# LIVE WEBHOOK EXPERIMENT (HARD STOP 8:00 PM)

1. Stop ALL other backends (free port 8000). Keep ONE frontend running on :3000 (it talks to whichever backend owns :8000).
2. `ngrok http 8000` → copy the `https` Forwarding URL.
3. Razorpay Dashboard → **Test Mode ON** → Account & Settings → Webhooks → Add:
   - URL = `<ngrok-url>/api/webhooks/razorpay`
   - Events = `payment.captured`
   - → Save → **copy Webhook Secret**.
4. In `MandateMart_Live\backend\.env` set `RAZORPAY_WEBHOOK_SECRET=<secret>`.
5. Start the Live backend:
   ```powershell
   cd MandateMart_Live\backend
   ..\..\MandateMart\backend\venv\Scripts\python.exe -m uvicorn main:app --port 8000
   ```
6. Open ngrok inspector: **http://127.0.0.1:4040**
7. On `:3000` run Happy Path, pay with `success@razorpay`.
8. Watch: ngrok POST arrives → dashboard Captured → ledger `PAYMENT_CAPTURED_VIA_WEBHOOK` (`source=RAZORPAY_LIVE`) → UI auto-SETTLED.
9. **SCREENSHOT** ngrok inspector = proof the call came from Razorpay's servers.

## Optional: Automated Polling

```powershell
cd MandateMart_Live\backend
..\..\MandateMart\backend\venv\Scripts\python.exe live_webhook_test.py
```

This polls `/api/webhooks/last` every 3s and prints a big success banner when a verified live webhook lands.
