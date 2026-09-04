from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class CatalogItemSchema(BaseModel):
    product_id: str
    name: str
    category: str
    description: str
    price: int
    stock: int
    bundle_rules: list

    class Config:
        from_attributes = True

class MandateCreate(BaseModel):
    intent_text: str
    max_amount: int
    expires_at: datetime
    
class MandateResponse(BaseModel):
    mandate_id: str
    issued_to: str
    intent_text: str
    max_amount: int
    spent_amount: int
    razorpay_subscription_id: Optional[str] = None
    razorpay_token_id: Optional[str] = None
    issued_at: datetime
    expires_at: datetime
    signature: str

    class Config:
        from_attributes = True

class LedgerEntryResponse(BaseModel):
    seq: int
    timestamp: datetime
    actor: str
    action: str
    detail: str
    gate_result: Optional[str]
    prev_hash: str
    entry_hash: str
    
    class Config:
        from_attributes = True
