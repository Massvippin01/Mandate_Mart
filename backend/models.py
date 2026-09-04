from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Text, func
from datetime import datetime
from database import Base

class Mandate(Base):
    __tablename__ = "mandates"
    mandate_id = Column(String, primary_key=True, index=True)
    issued_to = Column(String)
    intent_text = Column(Text)
    max_amount = Column(Integer)
    spent_amount = Column(Integer, default=0)
    razorpay_subscription_id = Column(String, nullable=True)
    razorpay_token_id = Column(String, nullable=True)
    issued_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    signature = Column(String)

class CatalogItem(Base):
    __tablename__ = "catalog_items"
    product_id = Column(String, primary_key=True, index=True)
    name = Column(String)
    category = Column(String)
    description = Column(Text)
    price = Column(Integer)
    reserve_price = Column(Integer)
    stock = Column(Integer)
    bundle_rules = Column(JSON) # e.g. [{"min_qty": 2, "discount_pct": 10}]

class LedgerEntry(Base):
    __tablename__ = "ledger_entries"
    seq = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    actor = Column(String)
    action = Column(String)
    detail = Column(Text)
    gate_result = Column(String, nullable=True)
    prev_hash = Column(String)
    entry_hash = Column(String)

class RevenueEvent(Base):
    __tablename__ = "revenue_events"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String, nullable=False)  # ZOPA_RECOVERY, PAYMENT_LINK_RESCUE, FRAUD_BLOCKED
    amount_paise = Column(Integer, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
