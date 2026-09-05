"""Seeds clean revenue events for the MandateMart demo dashboard."""
import sys
import os
from datetime import datetime, timedelta
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Ensure UTF-8 stdout on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

from database import SessionLocal, engine, Base
from models import RevenueEvent
Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    try:
        # Step 1: Wipe all existing revenue events
        deleted = db.query(RevenueEvent).delete()
        db.commit()
        print(f"🗑️ Cleared {deleted} previous revenue events")

        now = datetime.utcnow()

        # Step 2: Insert exact clean demo data with realistic hour distribution
        events = [
            # 4 ZOPA_RECOVERY rows (Total: 1,460,000 paise = ₹14,600)
            RevenueEvent(
                event_type="ZOPA_RECOVERY",
                amount_paise=280000,
                description="USB-C GaN Charger deal saved via counter-offer at ₹2,800",
                created_at=now - timedelta(hours=3, minutes=20)
            ),
            RevenueEvent(
                event_type="ZOPA_RECOVERY",
                amount_paise=350000,
                description="Mechanical Keyboard + Cable bundle negotiated from ₹5,000 to ₹3,500",
                created_at=now - timedelta(hours=2, minutes=45)
            ),
            RevenueEvent(
                event_type="ZOPA_RECOVERY",
                amount_paise=520000,
                description="Full hackathon developer kit bundle with 15% ZOPA volume discount",
                created_at=now - timedelta(hours=1, minutes=15)
            ),
            RevenueEvent(
                event_type="ZOPA_RECOVERY",
                amount_paise=310000,
                description="Tactile Keyboard + Wrist Rest bundle finalized at ₹3,100",
                created_at=now - timedelta(minutes=25)
            ),

            # 3 PAYMENT_LINK_RESCUE rows (Total: 280,000 paise = ₹2,800)
            RevenueEvent(
                event_type="PAYMENT_LINK_RESCUE",
                amount_paise=50000,
                description="₹500 budget shortfall converted via Razorpay Payment Link",
                created_at=now - timedelta(hours=2, minutes=10)
            ),
            RevenueEvent(
                event_type="PAYMENT_LINK_RESCUE",
                amount_paise=80000,
                description="₹800 top-up link authorized by human principal",
                created_at=now - timedelta(hours=1, minutes=40)
            ),
            RevenueEvent(
                event_type="PAYMENT_LINK_RESCUE",
                amount_paise=150000,
                description="₹1,500 shortfall recovered via instant top-up link",
                created_at=now - timedelta(minutes=45)
            ),

            # 3 FRAUD_BLOCKED rows (Total: 20,850,000 paise = ₹2,08,500)
            RevenueEvent(
                event_type="FRAUD_BLOCKED",
                amount_paise=15000000,
                description="Prompt injection blocked: attempted ₹1,50,000 Swiss luxury watch purchase",
                created_at=now - timedelta(hours=3)
            ),
            RevenueEvent(
                event_type="FRAUD_BLOCKED",
                amount_paise=5000000,
                description="Mandate escalation blocked: attempted ₹50,000 unauthorized spend limit jump",
                created_at=now - timedelta(hours=1, minutes=50)
            ),
            RevenueEvent(
                event_type="FRAUD_BLOCKED",
                amount_paise=850000,
                description="Category violation blocked: ₹8,500 luxury item attempted on electronics mandate",
                created_at=now - timedelta(minutes=15)
            )
        ]

        for event in events:
            db.add(event)
        db.commit()

        # Step 3: Verify and print calculated totals
        zopa_total = sum(e.amount_paise for e in events if e.event_type == "ZOPA_RECOVERY")
        links_total = sum(e.amount_paise for e in events if e.event_type == "PAYMENT_LINK_RESCUE")
        rescued_total = zopa_total + links_total
        protected_total = sum(e.amount_paise for e in events if e.event_type == "FRAUD_BLOCKED")

        print("=" * 70)
        print("  MANDATEMART REVENUE RESCUE — SEEDED CLEAN DATA")
        print("=" * 70)
        print(f"  ZOPA Bargaining Recovery : ₹{zopa_total / 100:,.2f} ({zopa_total:,} paise across 4 events)")
        print(f"  Payment Link Rescue      : ₹{links_total / 100:,.2f} ({links_total:,} paise across 3 events)")
        print(f"  Total Revenue Rescued    : ₹{rescued_total / 100:,.2f} ({rescued_total:,} paise)")
        print(f"  Hostile Spend Protected  : ₹{protected_total / 100:,.2f} ({protected_total:,} paise across 3 events)")
        print("=" * 70)
        print(f"Expected totals: ZOPA ₹14,600 · Links ₹2,800 · Rescued ₹17,400 · Protected ₹2,08,500.")
        print("=" * 70)

    finally:
        db.close()

if __name__ == "__main__":
    seed()
