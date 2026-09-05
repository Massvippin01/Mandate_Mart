# MandateMart Live — End-to-End Razorpay Checkout & Webhook Runbook

## Port Plan
- **Port 8000**: MandateMart_Live Backend (`uvicorn main:app --port 8000`)
- **Port 3001**: MandateMart_Live Frontend (`npm run dev -- -p 3001`)
- **Port 4040**: ngrok Web Inspector (`http://127.0.0.1:4040`)

---

## Prerequisites
1. **ngrok running on port 8000**:
   ```bash
   ngrok http 8000
   ```
   Ensure your Razorpay Dashboard (Test Mode ON) -> Account & Settings -> Webhooks has:
   - URL: `https://<ngrok-subdomain>.ngrok-free.app/api/webhooks/razorpay`
   - Events: `payment.captured`, `payment.authorized`
   - Webhook Secret matches `RAZORPAY_WEBHOOK_SECRET` in `MandateMart_Live\backend\.env`.

---

## Execution Sequence

### Terminal A: ngrok Tunnel
Already active or run:
```bash
ngrok http 8000
```

### Terminal B: MandateMart_Live Backend
```powershell
cd MandateMart_Live\backend
..\..\MandateMart\backend\venv\Scripts\python.exe -m uvicorn main:app --port 8000
```

*(Note: Stop any previous backend running on port 8000 first)*

### Terminal C: MandateMart_Live Frontend
```powershell
cd MandateMart_Live\frontend
npm run dev -- -p 3001
```

---

## End-to-End Demo Verification Flow

1. Open browser to **`http://localhost:3001`**
2. **Authorize Mandate**:
   - Persona: Personal Buyer
   - Intent: "Buy high-quality hackathon survival gear"
   - Spend Cap: ₹4000
   - Click **Authorize Cryptographic Mandate**
3. **Trigger Agent**:
   - Scenario: Standard Flow (Autonomous Happy Path)
   - Click **Run Mission**
4. **Autonomous Flow**:
   - Buyer Agent negotiates bundle (Mechanical Keyboard + Energy Drinks = ₹2900)
   - Double Gate passes (Semantic & Financial)
   - Backend creates real Razorpay Order on Razorpay servers & logs `PAYMENT_EXECUTED` to Merkle Ledger
5. **Real Razorpay Checkout Modal**:
   - Razorpay Checkout JS modal automatically opens on screen
   - Enter test UPI ID: `success@razorpay` (or click Test Cards -> Success)
   - Complete authorization
6. **Live Webhook Receipt & Settlement**:
   - Frontend shows card: `⏳ AWAITING LIVE RAZORPAY WEBHOOK — watch ngrok inspector`
   - Razorpay servers send live webhook via ngrok to `/api/webhooks/razorpay`
   - Backend verifies HMAC-SHA256 signature, logs `PAYMENT_CAPTURED_VIA_WEBHOOK` with `source=RAZORPAY_LIVE`
   - Frontend poller detects verified webhook within ~2s and flips card to:
     `✅ SETTLED BY LIVE RAZORPAY WEBHOOK (source=RAZORPAY_LIVE)`
7. **Safety Fallback**:
   - If no webhook arrives after 45 seconds, the safety fallback button `No webhook yet? Deliver signed simulator webhook` appears to guarantee zero risk during live presentation.
