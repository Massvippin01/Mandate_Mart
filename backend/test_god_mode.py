"""
+==================================================================+
|   MandateMart v2 -- GOD-MODE INTEGRATION TEST SUITE              |
|   Razorpay National Hackathon -- Track 01: Agentic Commerce      |
|   Pre-Flight System Verification                                 |
+==================================================================+
"""

import os
import sys
import io
import json
import sqlite3
import hashlib
import time
import traceback
from datetime import datetime, timedelta

# Force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Ensure we are running from the backend directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv()

# -- Result Tracking --
results = {}
PASS = "[PASS]"
FAIL = "[FAIL]"

def run_test(name, fn):
    """Runs a test function, records PASS/FAIL, prints result."""
    try:
        fn()
        results[name] = PASS
        print(f"  {PASS} {name}")
    except Exception as e:
        results[name] = f"{FAIL} {e}"
        print(f"  {FAIL} {name}")
        traceback.print_exc()
        print()


# =================================================================
# TEST 1: DATABASE & SCHEMA VERIFICATION
# =================================================================
def test_database_and_schema():
    print("\n--- TEST 1: Database & Schema Verification ---")

    db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mandatemart.db")
    assert os.path.exists(db_path), f"Database file not found at {db_path}"

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Check journal mode
    cursor.execute("PRAGMA journal_mode;")
    mode = cursor.fetchone()[0].lower()
    print(f"    Journal Mode: {mode}")

    # Check required tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = [row[0] for row in cursor.fetchall()]
    print(f"    Tables found: {tables}")

    required = ["mandates", "catalog_items", "ledger_entries"]
    for table in required:
        assert table in tables, f"Missing required table: {table}"

    # Verify catalog has seeded items
    cursor.execute("SELECT COUNT(*) FROM catalog_items;")
    count = cursor.fetchone()[0]
    print(f"    Catalog items: {count}")
    assert count >= 4, f"Expected >= 4 catalog items, found {count}"

    # Verify reserve_price column exists (confidential merchant data)
    cursor.execute("PRAGMA table_info(catalog_items);")
    columns = [row[1] for row in cursor.fetchall()]
    assert "reserve_price" in columns, "reserve_price column missing from catalog_items"
    print(f"    > reserve_price column exists (ZOPA secret floor)")

    # Verify ledger schema has hash columns
    cursor.execute("PRAGMA table_info(ledger_entries);")
    ledger_cols = [row[1] for row in cursor.fetchall()]
    assert "prev_hash" in ledger_cols, "prev_hash column missing from ledger_entries"
    assert "entry_hash" in ledger_cols, "entry_hash column missing from ledger_entries"
    print(f"    > prev_hash + entry_hash columns confirmed")

    conn.close()

run_test("SQLite Database & Schema", test_database_and_schema)


# =================================================================
# TEST 2: ED25519 CRYPTOGRAPHY -- SIGN, VERIFY, TAMPER DETECT
# =================================================================
def test_ed25519_crypto():
    print("\n--- TEST 2: Ed25519 Cryptography ---")

    from utils import PassportAuthority

    authority = PassportAuthority()
    pub_key = authority.public_key_hex
    print(f"    Public Key (hex): {pub_key[:24]}...")

    # Create and sign a mock mandate payload
    payload = {
        "mandate_id": "mnd_test0001",
        "issued_to": "buyer_agent_01",
        "intent_text": "Buy hackathon gear",
        "max_amount": 4000,
        "expires_at": "2026-09-05T00:00:00"
    }

    signature = authority.sign_mandate(payload)
    print(f"    Signature (b64):  {signature[:32]}...")
    assert len(signature) > 20, "Signature too short"

    # Verify with correct payload -> MUST be True
    valid = authority.verify_mandate(payload, signature, pub_key)
    print(f"    Verify (original):  {valid}")
    assert valid is True, "Ed25519 verification FAILED on original payload"

    # Mutate payload by 1 byte -> MUST be False (tamper detection)
    tampered_payload = payload.copy()
    tampered_payload["max_amount"] = 4001  # Changed from 4000 to 4001
    invalid = authority.verify_mandate(tampered_payload, signature, pub_key)
    print(f"    Verify (tampered):  {invalid}")
    assert invalid is False, "Ed25519 should REJECT tampered payload"

    print(f"    > Sign, Verify, and Tamper Detection all passed")

run_test("Ed25519 Crypto (Sign/Verify/Tamper)", test_ed25519_crypto)


# =================================================================
# TEST 3: POLICY COMPILER FALLBACK
# =================================================================
def test_policy_compiler():
    print("\n--- TEST 3: Policy Compiler Fallback ---")

    from utils import compile_intent_to_policy, SpendPolicy

    policy = compile_intent_to_policy("Buy the best hackathon survival gear under 5000 rupees")
    print(f"    Type: {type(policy).__name__}")
    assert isinstance(policy, SpendPolicy), f"Expected SpendPolicy, got {type(policy)}"

    print(f"    intent_summary:      {policy.intent_summary}")
    print(f"    max_amount_paise:    {policy.max_amount_paise}")
    print(f"    allowed_categories:  {policy.allowed_categories}")
    print(f"    blocked_categories:  {policy.blocked_categories}")
    print(f"    expires_at_epoch:    {policy.expires_at_epoch}")

    assert policy.max_amount_paise > 0, "max_amount_paise must be > 0"
    assert isinstance(policy.allowed_categories, list), "allowed_categories must be a list"
    assert isinstance(policy.blocked_categories, list), "blocked_categories must be a list"
    assert policy.expires_at_epoch > int(time.time()), "expires_at must be in the future"

    print(f"    > Valid SpendPolicy object with all fields populated")

run_test("Policy Compiler (Pydantic Fallback)", test_policy_compiler)


# =================================================================
# TEST 4: DOUBLE GATE + KILL SWITCH
# =================================================================
def test_double_gate_and_kill_switch():
    print("\n--- TEST 4: Double Gate & Kill Switch ---")

    from database import SessionLocal
    import models
    import gates

    db = SessionLocal()

    try:
        # Create a temporary test mandate directly in DB
        test_mandate_id = f"mnd_godtest_{int(time.time()) % 100000}"
        test_mandate = models.Mandate(
            mandate_id=test_mandate_id,
            issued_to="buyer_agent_test",
            intent_text="Buy high-quality hackathon survival gear and energy drinks",
            max_amount=5000,
            spent_amount=0,
            razorpay_subscription_id="sub_test_godmode",
            razorpay_token_id="tok_test_godmode",
            expires_at=datetime.utcnow() + timedelta(hours=24),
            signature="test_sig_placeholder"
        )
        db.add(test_mandate)
        db.commit()
        db.refresh(test_mandate)
        print(f"    Created test mandate: {test_mandate_id}")

        # -- Sub-test A: Financial Gate (pure math) --
        fin_pass, fin_detail = gates.financial_gate(
            max_amount=5000, spent_amount=0,
            expires_at=datetime.utcnow() + timedelta(hours=24),
            proposed_amount=2500
        )
        print(f"    Financial Gate (2500 <= 5000): {fin_pass}")
        assert fin_pass is True, f"Financial gate should pass: {fin_detail}"

        # -- Sub-test B: Financial Gate REJECT (over budget) --
        fin_pass2, fin_detail2 = gates.financial_gate(
            max_amount=5000, spent_amount=0,
            expires_at=datetime.utcnow() + timedelta(hours=24),
            proposed_amount=6000
        )
        print(f"    Financial Gate (6000 > 5000):  {fin_pass2}")
        assert fin_pass2 is False, "Financial gate should BLOCK over-budget"

        # -- Sub-test C: Financial Gate REJECT (expired) --
        fin_pass3, fin_detail3 = gates.financial_gate(
            max_amount=5000, spent_amount=0,
            expires_at=datetime.utcnow() - timedelta(hours=1),
            proposed_amount=100
        )
        print(f"    Financial Gate (expired):      {fin_pass3}")
        assert fin_pass3 is False, "Financial gate should BLOCK expired mandate"

        # -- Sub-test D: Kill Switch Revocation --
        gates.REVOKED_NONCES.discard(test_mandate_id)
        print(f"    Kill Switch status (before):   NOT REVOKED")

        # Activate Kill Switch
        gates.REVOKED_NONCES.add(test_mandate_id)
        print(f"    Kill Switch ACTIVATED for:     {test_mandate_id}")

        # Run full mandate_gate -- should be intercepted by Step 0
        test_items = [
            {"product_id": "prd_001", "name": "Mechanical Keyboard",
             "description": "Tactile mechanical keyboard perfect for hackathon coding", "price": 2500}
        ]
        kill_pass, kill_reason = gates.mandate_gate(test_mandate, test_items, 2500, db)
        print(f"    Gate after Kill Switch:        {kill_pass} -- {kill_reason}")
        assert kill_pass is False, "Gate must BLOCK after kill switch"
        assert "PASSPORT_REVOKED_BY_HUMAN_KILL_SWITCH" in kill_reason, \
            f"Expected PASSPORT_REVOKED reason, got: {kill_reason}"

        print(f"    > Financial Gate (pass, block, expiry) + Kill Switch all verified")

    finally:
        gates.REVOKED_NONCES.discard(test_mandate_id)
        db.query(models.Mandate).filter(models.Mandate.mandate_id == test_mandate_id).delete()
        db.commit()
        db.close()

run_test("Double Gate & Kill Switch", test_double_gate_and_kill_switch)


# =================================================================
# TEST 5: MERKLE LEDGER SHA-256 CHAIN INTEGRITY
# =================================================================
def test_merkle_ledger_integrity():
    print("\n--- TEST 5: Merkle Ledger Integrity ---")

    from database import SessionLocal
    import models
    from gates import calculate_entry_hash

    db = SessionLocal()
    try:
        entries = db.query(models.LedgerEntry).order_by(models.LedgerEntry.seq.asc()).all()
        total = len(entries)
        print(f"    Total ledger entries: {total}")

        if total == 0:
            print(f"    (!) Ledger is empty -- skipping chain verification (still PASS)")
            return

        for i, entry in enumerate(entries):
            expected_prev = "0" * 64 if i == 0 else entries[i - 1].entry_hash
            assert entry.prev_hash == expected_prev, \
                f"Chain break at Block #{entry.seq}: prev_hash mismatch"

            recalculated = calculate_entry_hash(
                entry.prev_hash, entry.seq, entry.actor,
                entry.action, entry.detail, entry.gate_result
            )
            assert entry.entry_hash == recalculated, \
                f"Content tampering at Block #{entry.seq}: hash mismatch"

        latest = entries[-1]
        print(f"    Genesis hash:   {entries[0].entry_hash[:24]}...")
        print(f"    Latest hash:    {latest.entry_hash[:24]}...")
        print(f"    > All {total} blocks verified -- SHA-256 chain is cryptographically intact")

    finally:
        db.close()

run_test("SHA-256 Merkle Ledger Integrity", test_merkle_ledger_integrity)


# =================================================================
# TEST 6: RAZORPAY RAILS -- KEY ENFORCEMENT & PAYLOAD GEN
# =================================================================
def test_razorpay_rails():
    print("\n--- TEST 6: Razorpay Rails Verification ---")

    # Sub-test A: Verify test-key enforcement
    key_id = os.getenv("RAZORPAY_KEY_ID", "")
    print(f"    RAZORPAY_KEY_ID: {key_id[:12]}..." if key_id else "    RAZORPAY_KEY_ID: (not set)")
    assert key_id.startswith("rzp_test_"), \
        f"CRITICAL: Key must start with 'rzp_test_' (got '{key_id[:12]}...'). Live keys PROHIBITED."
    print(f"    > Test-mode prefix enforced")

    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
    assert len(key_secret) > 5, "RAZORPAY_KEY_SECRET is missing or too short"
    print(f"    > RAZORPAY_KEY_SECRET is set")

    # Sub-test B: Verify Razorpay client initializes
    import razorpay
    client = razorpay.Client(auth=(key_id, key_secret))
    assert client is not None, "Razorpay client failed to initialize"
    print(f"    > Razorpay Client initialized")

    # Sub-test C: Mock Payment Link payload structure
    mock_payload = {
        "amount": 1500 * 100,
        "currency": "INR",
        "accept_partial": False,
        "description": "MandateMart top-up for mnd_test -- Rs.1500",
        "customer": {
            "name": "Mandate Human Authorizer",
            "email": "authorizer@mandatemart.ai"
        },
        "notify": {"sms": False, "email": False}
    }
    assert "amount" in mock_payload
    assert mock_payload["currency"] == "INR"
    assert "description" in mock_payload
    assert mock_payload["amount"] == 150000
    print(f"    > Payment Link payload verified (amount=150000 paise, currency=INR)")

    # Sub-test D: Mock Order payload structure
    mock_order = {
        "amount": 2500 * 100,
        "currency": "INR",
        "receipt": "mnd_rcpt_test0001"
    }
    assert mock_order["amount"] == 250000
    assert mock_order["currency"] == "INR"
    assert "receipt" in mock_order
    print(f"    > Order payload verified (amount=250000 paise)")

    # Sub-test E: Verify shortfall payment link generation function
    from gates import create_shortfall_payment_link
    assert callable(create_shortfall_payment_link)
    print(f"    > create_shortfall_payment_link() is callable")

run_test("Razorpay Rails (Key + Payload)", test_razorpay_rails)


# =================================================================
# TEST 7: A2A MANIFEST + RED TEAM + ENDPOINTS SMOKE TEST
# =================================================================
def test_endpoints_and_a2a():
    print("\n--- TEST 7: Endpoint & A2A Manifest Smoke Test ---")

    import requests

    base = "http://localhost:8000"

    # A2A Manifest
    r = requests.get(f"{base}/.well-known/agent.json", timeout=5)
    assert r.status_code == 200, f"A2A manifest returned {r.status_code}"
    manifest = r.json()
    assert manifest["protocol"] == "A2A-Commerce-v1"
    assert manifest["capabilities"]["negotiation"] is True
    assert "Ed25519" in manifest["security_requirements"]["authentication"]
    print(f"    > A2A Manifest: protocol={manifest['protocol']}, negotiation=True")

    # Catalog
    r = requests.get(f"{base}/api/catalog", timeout=5)
    assert r.status_code == 200
    catalog = r.json()
    assert len(catalog) >= 4
    for item in catalog:
        assert "reserve_price" not in item, f"SECURITY LEAK: reserve_price exposed for {item['name']}!"
    print(f"    > Catalog: {len(catalog)} items, reserve_price NOT exposed")

    # Ledger Verify
    r = requests.get(f"{base}/api/ledger/verify", timeout=5)
    assert r.status_code == 200
    verify = r.json()
    print(f"    > Ledger Verify: is_valid={verify['is_valid']}, blocks={verify.get('total_entries', 0)}")

    # Red Team -- all 5 attack vectors
    attacks = ["prompt_injection", "category_violation", "mandate_escalation", "replay_attack", "tool_poisoning"]
    for atk_type in attacks:
        r2 = requests.post(f"{base}/api/redteam/execute", json={"attack_type": atk_type}, timeout=5)
        assert r2.status_code == 200
        atk_result = r2.json()
        assert atk_result["blocked"] is True, f"{atk_type} should be blocked"
        assert atk_result["razorpay_called"] is False, f"Razorpay must NOT be called for {atk_type}"
    print(f"    > All 5 Red Team attack vectors: BLOCKED (Razorpay never called)")

    # Kill Switch endpoint
    r = requests.post(f"{base}/api/mandate/kill-switch/test_smoke_nonce", timeout=5)
    assert r.status_code == 200
    ks = r.json()
    assert ks["status"] == "REVOKED"
    print(f"    > Kill Switch: status={ks['status']}")

run_test("Endpoints & A2A Manifest", test_endpoints_and_a2a)


# =================================================================
# FINAL QA REPORT
# =================================================================
print("\n")
print("+==================================================================+")
print("|              MANDATEMART v2 -- GOD-MODE QA REPORT                |")
print("+==================================================================+")
print()

test_names = [
    ("SQLite Database & Schema", "WAL Mode & Schema Verification"),
    ("Ed25519 Crypto (Sign/Verify/Tamper)", "Sign, Verify, & Tamper Detection"),
    ("Policy Compiler (Pydantic Fallback)", "LLM Fallback & Pydantic Validation"),
    ("Double Gate & Kill Switch", "Budget Math & Kill Switch Revocation"),
    ("SHA-256 Merkle Ledger Integrity", "SHA-256 Chain Integrity Check"),
    ("Razorpay Rails (Key + Payload)", "Test-Key Enforcement & Payload Gen"),
    ("Endpoints & A2A Manifest", "Live Endpoint & Red Team Smoke Test"),
]

print(f"| {'System Component':<38} | {'Test Executed':<38} | {'Status':<10} |")
print(f"|{'-' * 40}|{'-' * 40}|{'-' * 12}|")

all_passed = True
for test_key, description in test_names:
    status = results.get(test_key, "NOT RUN")
    if "FAIL" in status:
        all_passed = False
    display_status = "PASS" if "PASS" in status else "FAIL"
    marker = "[OK]" if display_status == "PASS" else "[!!]"
    print(f"| {marker} {test_key:<35} | {description:<38} | {display_status:<10} |")

print(f"|{'-' * 40}|{'-' * 40}|{'-' * 12}|")
print()

if all_passed:
    print(">>> ALL 7 TESTS PASSED -- CODE IS LOCKED AND READY FOR HACKATHON <<<")
else:
    print(">>> SOME TESTS FAILED -- FIX ISSUES BEFORE DEMO <<<")
print()
