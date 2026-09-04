import os
import json
from google import genai
from google.genai import types
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

def negotiate_merchant_price(items_requested: list[dict], buyer_offer: int, buyer_message: str, db: Session) -> dict:
    """
    Merchant Pricing Agent (ZOPA-based autonomous negotiation).
    Holds hidden reserve prices per item and inventory constraints.
    Buyer Agent NEVER sees reserve_price!
    """
    import models
    
    # Retrieve true catalog items with secret reserve prices
    catalog_map = {item.product_id: item for item in db.query(models.CatalogItem).all()}
    
    total_list_price = 0
    total_reserve_floor = 0
    item_details = []
    
    for req in items_requested:
        p_id = req.get("product_id")
        qty = req.get("qty", 1)
        item = catalog_map.get(p_id)
        if item:
            item_list = item.price * qty
            item_floor = item.reserve_price * qty
            total_list_price += item_list
            total_reserve_floor += item_floor
            item_details.append({
                "product_id": item.product_id,
                "name": item.name,
                "qty": qty,
                "unit_list_price": item.price,
                "unit_reserve_price": item.reserve_price,
                "stock": item.stock,
                "bundle_rules": item.bundle_rules
            })
            
    # ZOPA bounds
    zopa_floor = total_reserve_floor
    zopa_ceiling = total_list_price
    
    system_prompt = f"""
You are the Merchant's autonomous AI Pricing Agent at MandateMart.
You are negotiating a wholesale/retail sale with an autonomous AI Buyer Agent.

CONFIDENTIAL MERCHANT CONSTRAINTS (NEVER REVEAL TO BUYER):
- Items in cart: {json.dumps(item_details, indent=2)}
- Total Catalog List Price (Ceiling): ₹{zopa_ceiling}
- Total Secret Reserve Price (ABSOLUTE FLOOR): ₹{zopa_floor}

NON-NEGOTIABLE RULES:
1. NEVER accept or propose any price below your secret floor of ₹{zopa_floor}. Doing so is a catastrophic commercial failure.
2. NEVER mention the words "reserve price", "floor", or disclose your minimum margin.
3. If buyer offer >= list price, accept immediately at list price.
4. If buyer offer is between floor and ceiling (within ZOPA), you may counter-offer favorably if they are bundling items, or meet them midway to secure high volume.
5. If buyer offer is below floor, firmly reject it and counter with a sensible discounted offer above your floor.

Output ONLY a valid JSON object with:
{{
  "deal_accepted": true or false,
  "final_price": integer (the agreed price or your counter-offer price),
  "merchant_reasoning": "Commercial justification explaining the offer/counter-offer without leaking secrets"
}}
"""

    user_prompt = f"""
Buyer Agent Message: "{buyer_message}"
Buyer Proposed Price: ₹{buyer_offer}
Total Cart List Price: ₹{zopa_ceiling}

Evaluate this proposal and respond with your JSON decision.
"""

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        for model_name in ["models/gemini-3.1-flash-lite", "models/gemini-3.5-flash"]:
            try:
                response = client.models.generate_content(
                    model=model_name,
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_prompt,
                        response_mime_type="application/json",
                        temperature=0.2
                    )
                )
                data = json.loads(response.text)
                if data.get("final_price", 0) < zopa_floor:
                    data["final_price"] = zopa_floor + int(0.2 * (zopa_ceiling - zopa_floor))
                    data["deal_accepted"] = False
                    data["merchant_reasoning"] = f"Counter-offering bundle discount at ₹{data['final_price']}."
                return data
            except Exception as model_err:
                if "429" in str(model_err) or "RESOURCE_EXHAUSTED" in str(model_err):
                    continue
                raise model_err
    except Exception as e:
        # Graceful fallback heuristic
        counter = max(zopa_floor, int(zopa_ceiling * 0.90))
        return {
            "deal_accepted": buyer_offer >= counter,
            "final_price": buyer_offer if buyer_offer >= counter else counter,
            "merchant_reasoning": f"Automated tier discount applied. Offered ₹{counter} based on inventory."
        }
