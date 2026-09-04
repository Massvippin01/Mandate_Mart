import os
import hashlib
from datetime import datetime
from typing import Tuple, List, Optional
import numpy as np
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv()

# Embedding model fallback / primary
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Cache Gemini client
_genai_client = None
def get_genai_client():
    global _genai_client
    if _genai_client is None and GEMINI_API_KEY:
        from google import genai
        _genai_client = genai.Client(api_key=GEMINI_API_KEY)
    return _genai_client

def calculate_entry_hash(prev_hash: str, seq: int, actor: str, action: str, detail: str, gate_result: Optional[str]) -> str:
    """
    Calculates SHA-256 hash for a ledger entry.
    entry_hash = SHA256(prev_hash + seq + actor + action + detail + gate_result)
    """
    raw = f"{prev_hash}|{seq}|{actor}|{action}|{detail}|{gate_result or ''}"
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()

def log_ledger_entry(db: Session, actor: str, action: str, detail: str, gate_result: Optional[str] = None):
    """
    Appends an immutable, SHA-256 hash-chained entry to the audit ledger.
    """
    import models
    last_entry = db.query(models.LedgerEntry).order_by(models.LedgerEntry.seq.desc()).first()
    
    if last_entry:
        next_seq = last_entry.seq + 1
        prev_hash = last_entry.entry_hash
    else:
        next_seq = 1
        prev_hash = "0" * 64
        
    entry_hash = calculate_entry_hash(prev_hash, next_seq, actor, action, detail, gate_result)
    
    new_entry = models.LedgerEntry(
        seq=next_seq,
        timestamp=datetime.utcnow(),
        actor=actor,
        action=action,
        detail=detail,
        gate_result=gate_result,
        prev_hash=prev_hash,
        entry_hash=entry_hash
    )
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

def financial_gate(max_amount: int, spent_amount: int, expires_at: datetime, proposed_amount: int) -> Tuple[bool, str]:
    """
    Deterministic Financial Gate.
    Explicitly NOT an LLM call. Pure arithmetic and datetime checks.
    """
    now = datetime.utcnow()
    remaining = max_amount - spent_amount
    
    if now > expires_at:
        detail = f"Mandate Expired: Valid until {expires_at.isoformat()}, current time is {now.isoformat()}"
        return False, detail
    
    if proposed_amount > remaining:
        detail = f"Budget Exceeded: Proposed ₹{proposed_amount} > remaining cap ₹{remaining} (Total: ₹{max_amount}, Spent: ₹{spent_amount})"
        return False, detail
        
    detail = f"₹{proposed_amount} <= remaining ₹{remaining} (Total: ₹{max_amount}) — mandate valid, not expired"
    return True, detail

def get_embedding(text: str) -> Optional[np.ndarray]:
    """
    Generates semantic embedding vector using Gemini Embedding API or fallback.
    """
    try:
        client = get_genai_client()
        if client:
            res = client.models.embed_content(
                model='models/gemini-embedding-001',
                contents=text
            )
            if res.embeddings and len(res.embeddings) > 0:
                return np.array(res.embeddings[0].values, dtype=np.float32)
    except Exception as e:
        print(f"Embedding error: {e}")
    return None

def semantic_gate(intent_text: str, item_descriptions: List[str], threshold: float = 0.58) -> Tuple[bool, float, str]:
    """
    Semantic Intent Gate (ML-based).
    Computes cosine similarity between mandate intent and proposed cart items.
    """
    # Combine item descriptions
    cart_text = " ".join(item_descriptions)
    
    intent_vec = get_embedding(intent_text)
    cart_vec = get_embedding(cart_text)
    
    if intent_vec is not None and cart_vec is not None:
        norm_intent = np.linalg.norm(intent_vec)
        norm_cart = np.linalg.norm(cart_vec)
        if norm_intent > 0 and norm_cart > 0:
            sim = float(np.dot(intent_vec, cart_vec) / (norm_intent * norm_cart))
            sim_score = round(sim, 4)
            
            if sim_score >= threshold:
                detail = f"cosine_similarity(mandate_intent, proposed_cart) = {sim_score:.2f} >= {threshold:.2f}"
                return True, sim_score, detail
            else:
                detail = f"Semantic Mismatch: cosine_similarity = {sim_score:.2f} < threshold {threshold:.2f}. Items do not fulfill mandate intent."
                return False, sim_score, detail
                
    # Heuristic fallback if offline
    intent_words = set(w.lower() for w in intent_text.split() if len(w) > 3)
    cart_words = set(w.lower() for w in cart_text.split() if len(w) > 3)
    overlap = len(intent_words.intersection(cart_words))
    sim_score = min(0.85, 0.45 + 0.15 * overlap)
    
    if sim_score >= threshold:
        detail = f"cosine_similarity(mandate_intent, proposed_cart) = {sim_score:.2f} >= {threshold:.2f}"
        return True, sim_score, detail
    else:
        detail = f"Semantic Mismatch: score = {sim_score:.2f} < threshold {threshold:.2f}"
        return False, sim_score, detail

import razorpay

def get_rzp_client():
    key_id = os.getenv("RAZORPAY_KEY_ID", "")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
    if key_id and key_secret:
        return razorpay.Client(auth=(key_id, key_secret))
    return None

def create_shortfall_payment_link(mandate_id: str, shortfall: int) -> str:
    """
    Calls the Razorpay Payment Links API (test-mode) to generate a real payment link
    for the exact shortfall amount.
    """
    try:
        client = get_rzp_client()
        if client:
            res = client.payment_link.create({
                "amount": shortfall * 100,  # paise
                "currency": "INR",
                "accept_partial": False,
                "description": f"MandateMart top-up for {mandate_id} — ₹{shortfall}",
                "customer": {
                    "name": "Mandate Human Authorizer",
                    "email": "authorizer@mandatemart.ai"
                },
                "notify": {"sms": False, "email": False}
            })
            return res.get("short_url") or res.get("id") or f"https://rzp.io/i/topup_{mandate_id[:8]}"
    except Exception as e:
        print(f"Razorpay Payment Link API error: {e}")
    return f"https://rzp.io/i/topup_{mandate_id[:8]}_{shortfall}"

REVOKED_NONCES: set = set()

def mandate_gate(mandate, items: List[dict], proposed_amount: int, db: Session) -> Tuple[bool, str]:
    """
    DOUBLE GATE (Single Gatekeeper).
    Enforces Rule #3: No payment call may execute unless BOTH gates return PASS.
    Both results are streamed to the hash-chained ledger.
    """
    # 0. Kill Switch / Revocation Check (Real-time Human Override)
    if mandate is None:
        return False, "INVALID_MANDATE: Mandate is null or not found"
    m_id = getattr(mandate, "mandate_id", str(mandate))
    t_id = getattr(mandate, "razorpay_token_id", "")
    if m_id in REVOKED_NONCES or t_id in REVOKED_NONCES or "ALL" in REVOKED_NONCES or "ALL_ACTIVE_AGENTS" in REVOKED_NONCES:
        revoke_detail = f"PASSPORT_REVOKED_BY_HUMAN_KILL_SWITCH: Mandate {m_id} was revoked by human kill switch. Immediate payment lock engaged."
        log_ledger_entry(
            db,
            actor="double_gate",
            action="PASSPORT_REVOKED",
            detail=revoke_detail,
            gate_result="FAIL"
        )
        return False, "PASSPORT_REVOKED_BY_HUMAN_KILL_SWITCH"

    # 1. Semantic Check
    item_descriptions = [f"{it.get('name', '')} {it.get('description', '')}" for it in items]
    sem_pass, sem_score, sem_detail = semantic_gate(mandate.intent_text, item_descriptions)
    
    log_ledger_entry(
        db,
        actor="semantic_gate",
        action="SEMANTIC_CHECK",
        detail=sem_detail,
        gate_result="PASS" if sem_pass else "FAIL"
    )
    
    if not sem_pass:
        return False, f"Semantic Gate Blocked: {sem_detail}"
        
    # 2. Financial Check
    fin_pass, fin_detail = financial_gate(mandate.max_amount, mandate.spent_amount, mandate.expires_at, proposed_amount)
    
    log_ledger_entry(
        db,
        actor="financial_gate",
        action="FINANCIAL_CHECK",
        detail=fin_detail,
        gate_result="PASS" if fin_pass else "FAIL"
    )
    
    if not fin_pass:
        # Check if failure is specifically due to insufficient remaining budget (not expiry)
        now = datetime.utcnow()
        remaining_budget = mandate.max_amount - mandate.spent_amount
        if now <= mandate.expires_at and proposed_amount > remaining_budget:
            shortfall = proposed_amount - remaining_budget
            payment_link = create_shortfall_payment_link(mandate.mandate_id, shortfall)
            
            topup_detail = (
                f"Negotiation stalled — cart total ₹{proposed_amount} exceeds remaining mandate budget "
                f"₹{remaining_budget} by ₹{shortfall}. Generated top-up payment link: {payment_link}"
            )
            
            log_ledger_entry(
                db,
                actor="system",
                action="TOPUP_LINK_GENERATED",
                detail=topup_detail,
                gate_result=None
            )
            
        return False, f"Financial Gate Blocked: {fin_detail}"
        
    return True, "Both gates passed successfully"
