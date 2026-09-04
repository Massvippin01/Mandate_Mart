"""Seeds initial revenue events for the demo dashboard."""
import sys
import os
sys.path.insert(0, ".")

# Ensure UTF-8 stdout on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from database import SessionLocal, engine, Base
from models import RevenueEvent
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Only seed if table is empty
existing = db.query(RevenueEvent).count()
if existing == 0:
    events = [
        RevenueEvent(event_type="ZOPA_RECOVERY", amount_paise=350000, description="Keyboard+Mouse bundle negotiated from ₹5,000 to ₹3,500"),
        RevenueEvent(event_type="ZOPA_RECOVERY", amount_paise=280000, description="USB-C Hub deal saved via counter-offer at ₹2,800"),
        RevenueEvent(event_type="ZOPA_RECOVERY", amount_paise=520000, description="Full hackathon kit bundle with 15% ZOPA discount"),
        RevenueEvent(event_type="PAYMENT_LINK_RESCUE", amount_paise=150000, description="₹1,500 shortfall recovered via Razorpay Payment Link"),
        RevenueEvent(event_type="PAYMENT_LINK_RESCUE", amount_paise=80000, description="₹800 top-up link converted successfully"),
        RevenueEvent(event_type="FRAUD_BLOCKED", amount_paise=1500000, description="Prompt injection blocked: attempted ₹15,000 luxury watch purchase"),
        RevenueEvent(event_type="FRAUD_BLOCKED", amount_paise=5000000, description="Mandate escalation blocked: attempted ₹50,000 unauthorized spend"),
        RevenueEvent(event_type="FRAUD_BLOCKED", amount_paise=850000, description="Category violation blocked: luxury scarf on electronics mandate"),
    ]
    for event in events:
        db.add(event)
    db.commit()
    print(f"✅ Seeded {len(events)} revenue events")
else:
    print(f"✅ Revenue events already populated ({existing} rows)")

db.close()
