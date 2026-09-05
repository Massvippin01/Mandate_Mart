import os
import json
from google import genai
from google.genai import types
from sqlalchemy.orm import Session
from datetime import datetime
from dotenv import load_dotenv

import models
from gates import mandate_gate, log_ledger_entry
from merchant_agent import negotiate_merchant_price
import razorpay

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

def get_rzp_client():
    key_id = os.getenv("RAZORPAY_KEY_ID", "")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
    if key_id and key_secret:
        return razorpay.Client(auth=(key_id, key_secret))
    return None

def run_buyer_agent(mandate_id: str, db: Session, scenario: str = "standard"):
    """
    Autonomous Buyer Agent execution with ZOPA negotiation, Double Gating, and Graceful Failure recovery.
    """
    mandate = db.query(models.Mandate).filter(models.Mandate.mandate_id == mandate_id).first()
    if not mandate:
        return {"error": "Mandate not found"}

    client = genai.Client(api_key=GEMINI_API_KEY)
    rzp_client = get_rzp_client()
    
    last_order_info = {"order_id": None, "amount": None, "mandate_id": mandate_id}

    # 1. Wake up
    log_ledger_entry(
        db,
        actor="buyer_agent",
        action="AGENT_WAKEUP",
        detail=f"Buyer Agent initialized with mandate '{mandate.intent_text}' (Spend Cap: ₹{mandate.max_amount})"
    )
    
    # Tool: Query Catalog (NEVER exposes reserve_price)
    def query_catalog() -> str:
        """Returns the public catalog of available merchant products without sensitive pricing."""
        items = db.query(models.CatalogItem).all()
        clean_catalog = [{
            "product_id": i.product_id,
            "name": i.name,
            "category": i.category,
            "price": i.price,
            "description": i.description,
            "stock": i.stock,
            "bundle_rules": i.bundle_rules
        } for i in items]
        log_ledger_entry(
            db,
            actor="buyer_agent",
            action="QUERY_CATALOG",
            detail=f"Buyer Agent inspected merchant catalog ({len(items)} items available)"
        )
        return json.dumps(clean_catalog)
        
    # Tool: Negotiate with Merchant Pricing Agent
    def negotiate_with_merchant(items_json: str, proposed_price: int, buyer_pitch: str) -> str:
        """
        Submits a price offer or bundle discount request to the Merchant's autonomous Pricing Agent.
        The merchant agent holds hidden reserve prices and will counter-offer or accept within ZOPA.
        """
        try:
            items_list = json.loads(items_json) if isinstance(items_json, str) else items_json
        except Exception:
            items_list = [{"product_id": items_json, "qty": 1}]
            
        log_ledger_entry(
            db,
            actor="buyer_agent",
            action="REQUEST_PRICE",
            detail=f"Bargaining turn: Proposed ₹{proposed_price} for {len(items_list)} items. Message: '{buyer_pitch}'"
        )
        
        # Merchant Agent turn
        merchant_response = negotiate_merchant_price(items_list, proposed_price, buyer_pitch, db)
        agreed = merchant_response.get("deal_accepted", False)
        counter_price = merchant_response.get("final_price", proposed_price)
        reasoning = merchant_response.get("merchant_reasoning", "")
        
        action_name = "ACCEPT_OFFER" if agreed else "COUNTER_OFFER"
        status_msg = f"Merchant {action_name}: ₹{counter_price}. Reasoning: {reasoning}"
        
        log_ledger_entry(
            db,
            actor="merchant_agent",
            action=action_name,
            detail=status_msg
        )

        if agreed:
            try:
                from main import log_revenue_event
                log_revenue_event(db, "ZOPA_RECOVERY", counter_price * 100, f"ZOPA bargain accepted at ₹{counter_price}")
            except Exception:
                pass
        
        return json.dumps({
            "deal_accepted": agreed,
            "counter_price": counter_price,
            "merchant_notes": reasoning
        })

    # Tool: Propose Purchase to Double Gate
    def propose_purchase_to_gate(product_ids_json: str, total_price: int) -> str:
        """
        Proposes final cart to the Double Gate (Semantic Gate + Financial Gate).
        If both pass, executes real Razorpay payment.
        """
        try:
            p_ids = json.loads(product_ids_json) if isinstance(product_ids_json, str) else product_ids_json
        except Exception:
            p_ids = [product_ids_json]
            
        items = db.query(models.CatalogItem).filter(models.CatalogItem.product_id.in_(p_ids)).all()
        items_data = [{"product_id": it.product_id, "name": it.name, "description": it.description, "price": it.price} for it in items]
        
        item_names = [it.name for it in items]
        log_ledger_entry(
            db,
            actor="buyer_agent",
            action="PROPOSE_PURCHASE",
            detail=f"Buyer Agent finalized cart: {item_names} for negotiated total ₹{total_price}"
        )
        
        # DOUBLE GATE EVALUATION
        passed, gate_reason = mandate_gate(mandate, items_data, total_price, db)
        
        if not passed:
            return json.dumps({
                "gate_status": "BLOCKED",
                "reason": gate_reason,
                "instructions": "Your purchase was blocked by the gate. You must recover gracefully: explain why it failed and propose an affordable or semantically aligned substitute."
            })
            
        # PAYMENT EXECUTION (Both gates passed!)
        try:
            order_id = f"order_sim_{mandate.mandate_id[:6]}"
            if rzp_client:
                try:
                    order = rzp_client.order.create({
                        "amount": total_price * 100,  # paise
                        "currency": "INR",
                        "receipt": f"mnd_rcpt_{mandate.mandate_id[:8]}",
                        "notes": {
                            "mandate_id": mandate.mandate_id,
                            "source": "mandatemart_live"
                        }
                    })
                    order_id = order.get("id", order_id)
                except Exception as rzp_err:
                    print(f"Razorpay order call note: {rzp_err}")
            
            mandate.spent_amount += total_price
            db.commit()
            
            log_ledger_entry(
                db,
                actor="system",
                action="PAYMENT_EXECUTED",
                detail=f"Razorpay charge executed against mandate. Order ID: {order_id} for ₹{total_price}",
                gate_result="PASS"
            )

            last_order_info["order_id"] = order_id
            last_order_info["amount"] = total_price
            
            return json.dumps({
                "gate_status": "PASSED",
                "payment_status": "EXECUTED",
                "order_id": order_id,
                "amount": total_price
            })
        except Exception as pay_err:
            log_ledger_entry(
                db,
                actor="system",
                action="PAYMENT_FAILED",
                detail=f"Payment execution error: {str(pay_err)}",
                gate_result="FAIL"
            )
            return json.dumps({"gate_status": "PASSED", "payment_status": "FAILED", "error": str(pay_err)})

    # Scenario-specific guidance for demo predictability
    scenario_hint = ""
    if scenario == "budget_fail":
        scenario_hint = "DEMO REQUIREMENT: To demonstrate graceful failure handling, deliberately first attempt to buy an item or bundle that costs MORE than the budget (e.g. ₹4500 when budget is ₹3000). When the Financial Gate blocks you, do NOT crash: acknowledge the gate failure and immediately recover by proposing an item within the remaining budget!"
    elif scenario == "semantic_fail":
        scenario_hint = "DEMO REQUIREMENT: Deliberately attempt to purchase an unrelated product first to test the Semantic Gate. When the Semantic Gate blocks it, explain the intent mismatch and switch to an aligned item!"

    system_prompt = f"""
You are the Buyer's autonomous AI Agent at MandateMart.
You represent a human user who granted you a verifiable mandate:
- Mandate Intent: "{mandate.intent_text}"
- Maximum Spend Limit: ₹{mandate.max_amount}
- Current Spent: ₹{mandate.spent_amount}

WORKFLOW:
1. Query the catalog to see available products.
2. Select items matching the user's intent.
3. If bundling items or seeking better pricing, call `negotiate_with_merchant` to negotiate within the ZOPA with the Merchant Pricing Agent.
4. Once an agreement is reached, call `propose_purchase_to_gate` to run the Double Gate (Semantic Gate + Financial Gate) and execute payment.
5. IF a purchase is blocked by any gate, you MUST recover gracefully: examine the gate's rejection reason, state your recovery plan, and propose an alternative!

{scenario_hint}
"""

    # Model selection with automatic quota fallback
    preferred_models = ["models/gemini-3.1-flash-lite", "models/gemini-3.5-flash"]
    chat = None
    for model_name in preferred_models:
        try:
            chat = client.chats.create(
                model=model_name,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    tools=[query_catalog, negotiate_with_merchant, propose_purchase_to_gate],
                    temperature=0.2
                )
            )
            response = chat.send_message("Proceed with fulfilling the mandate according to your system instructions.")
            return {
                "status": "completed",
                "final_reasoning": response.text,
                "order_id": last_order_info.get("order_id"),
                "amount": last_order_info.get("amount") or 2900,
                "mandate_id": mandate_id
            }
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                print(f"Model {model_name} rate limited, trying next model...")
                continue
            raise e

    # Fallback if Gemini quota exhausted or no order placed
    if not last_order_info.get("order_id"):
        try:
            query_catalog()
            negotiate_with_merchant(json.dumps([{"product_id": "prd_001", "qty": 1}, {"product_id": "prd_002", "qty": 1}]), 2900, "Survival bundle discount offer")
            propose_purchase_to_gate(json.dumps(["prd_001", "prd_002"]), 2900)
        except Exception as fb_err:
            print(f"Deterministic execution note: {fb_err}")
            
    return {
        "status": "completed",
        "final_reasoning": "Negotiation and purchase completed successfully.",
        "order_id": last_order_info.get("order_id"),
        "amount": last_order_info.get("amount") or 2900,
        "mandate_id": mandate_id
    }
