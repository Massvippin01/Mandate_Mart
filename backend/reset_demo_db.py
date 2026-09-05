"""Reset and seed fresh demo database for MandateMart_Demo."""
import sqlite3
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from seed_revenue import seed

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mandatemart.db")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Step 1 & 2: Wipe ledger, mandates, revenue events (keep catalog items)
cursor.execute("DELETE FROM ledger_entries;")
cursor.execute("DELETE FROM mandates;")
cursor.execute("DELETE FROM revenue_events;")
conn.commit()
conn.close()

# Step 3: Seed clean revenue events
seed()

# Step 4: Verify and print row counts
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
ledger_count = cursor.execute("SELECT COUNT(*) FROM ledger_entries;").fetchone()[0]
mandates_count = cursor.execute("SELECT COUNT(*) FROM mandates;").fetchone()[0]
revenue_count = cursor.execute("SELECT COUNT(*) FROM revenue_events;").fetchone()[0]
catalog_count = cursor.execute("SELECT COUNT(*) FROM catalog_items;").fetchone()[0]
conn.close()

print("\n" + "=" * 50)
print(f"CONFIRMATION: ledger={ledger_count}, mandates={mandates_count}, revenue={revenue_count}, catalog={catalog_count}")
print("=" * 50)
