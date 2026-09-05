"""
+==================================================================+
|   MandateMart LIVE WEBHOOK EXPERIMENT                            |
|   Polls /api/webhooks/last for proof of live Razorpay delivery   |
+==================================================================+
"""

import sys
import io
import time
import json
import requests
from datetime import datetime

# Force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

BASE = "http://localhost:8000"
POLL_INTERVAL = 3  # seconds
TIMEOUT = 180      # 3 minutes max

CHECKLIST = """
+==================================================================+
|              LIVE WEBHOOK PRE-FLIGHT CHECKLIST                   |
+==================================================================+

  1. ngrok http 8000 is running → forwarding URL copied
  2. Razorpay Dashboard → Test Mode ON → Webhooks configured:
     URL = <ngrok-url>/api/webhooks/razorpay
     Events = payment.captured
     Webhook Secret copied into MandateMart_Live/backend/.env
  3. MandateMart_Live backend running on port 8000:
     cd MandateMart_Live\\backend
     ..\\..\\MandateMart\\backend\\venv\\Scripts\\python.exe -m uvicorn main:app --port 8000
  4. Frontend running on port 3000 (any copy — it talks to :8000)
  5. ngrok inspector open: http://127.0.0.1:4040

+==================================================================+
|  Press ENTER to begin polling for live webhook...                |
+==================================================================+
"""

def main():
    print(CHECKLIST)
    input()

    # Verify backend is reachable
    try:
        r = requests.get(f"{BASE}/api/webhooks/last", timeout=5)
        r.raise_for_status()
        print(f"✅ Backend reachable on {BASE}")
    except Exception as e:
        print(f"❌ Cannot reach {BASE}/api/webhooks/last: {e}")
        print("   Is the Live backend running on port 8000?")
        sys.exit(1)

    print(f"\n⏳ Polling /api/webhooks/last every {POLL_INTERVAL}s (timeout: {TIMEOUT}s)")
    print("   Go to http://localhost:3000, run the Happy Path, pay with success@razorpay")
    print("   Razorpay will POST to ngrok → ngrok forwards to :8000 → webhook handler fires\n")

    start = time.time()
    seen_verified = False

    while time.time() - start < TIMEOUT:
        try:
            r = requests.get(f"{BASE}/api/webhooks/last", timeout=5)
            data = r.json()

            if data.get("verified") is True and "payment" in data.get("event", ""):
                seen_verified = True
                elapsed = round(time.time() - start, 1)
                print("\n" + "=" * 70)
                print("🎉🎉🎉  LIVE RAZORPAY WEBHOOK RECEIVED & VERIFIED  🎉🎉🎉")
                print("=" * 70)
                print(f"  Event:      {data.get('event')}")
                print(f"  Order ID:   {data.get('order_id', 'N/A')}")
                print(f"  Payment ID: {data.get('payment_id', 'N/A')}")
                print(f"  Amount:     ₹{data.get('amount_paise', 0) // 100}")
                print(f"  Method:     {data.get('method', 'N/A')}")
                print(f"  Mandate:    {data.get('mandate_id', 'N/A')}")
                print(f"  Received:   {data.get('received_at', 'N/A')}")
                print(f"  Elapsed:    {elapsed}s after polling started")
                print(f"  Source:     RAZORPAY_LIVE")
                print("=" * 70)
                print("\n📸 SCREENSHOT: http://127.0.0.1:4040 (ngrok inspector)")
                print("📸 SCREENSHOT: http://localhost:8000/api/webhooks/last")
                print("📸 SCREENSHOT: The MandateMart UI showing SETTLED status")
                print("\n✅ EXPERIMENT SUCCESS — This is your bonus clip footage!")
                break

            elif data.get("status") == "NO_WEBHOOK_RECEIVED_YET":
                elapsed = round(time.time() - start, 1)
                print(f"  [{elapsed:>6.1f}s] No webhook yet... waiting", end="\r")
            else:
                elapsed = round(time.time() - start, 1)
                status = data.get("event", data.get("status", "unknown"))
                print(f"  [{elapsed:>6.1f}s] Last event: {status} (verified={data.get('verified')})")

        except Exception as e:
            elapsed = round(time.time() - start, 1)
            print(f"  [{elapsed:>6.1f}s] Poll error: {e}")

        time.sleep(POLL_INTERVAL)

    if not seen_verified:
        print("\n" + "=" * 70)
        print("⏱️  NO LIVE WEBHOOK RECEIVED WITHIN TIMEOUT")
        print("=" * 70)
        print("  ABORT EXPERIMENT. Ship the stable demo recording instead.")
        print("  This is fine — the simulated webhook path already proves the architecture.")
        print("=" * 70)


if __name__ == "__main__":
    main()
