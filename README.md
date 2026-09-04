# Mandate_Mart 🛡️💳
### Agentic Commerce with Delegated Spend Authority & Dual-Sided Enforcement
**Razorpay National Hackathon — Track 01: AI Growth & Agentic Commerce**

[![Next.js 15](https://img.shields.io/badge/Frontend-Next.js%2015-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Razorpay](https://img.shields.io/badge/Rails-Razorpay%20API-0C2340?style=flat&logo=razorpay)](https://razorpay.com/)
[![Ed25519](https://img.shields.io/badge/Security-Ed25519%20%2B%20SHA--256-violet?style=flat)](https://ed25519.cr.yp.to/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ⚡ Overview

As autonomous AI agents begin executing transactions on behalf of humans, existing payment rails face an existential authorization crisis: **how does a human grant purchasing agency to an AI without handing over unbounded credit card access or getting trapped in constant MFA loops?**

**MandateMart** solves this with **Delegated Spend Authority**:
- Humans sign cryptographic, cryptographically verifiable spend mandates with scoped constraints (budget ceilings, merchant whitelists, allowed SKU categories, velocity caps).
- Buyer and Merchant agents negotiate deals autonomously over standard Agent-to-Agent (A2A) protocols.
- **Double Gate Architecture** enforces constraints both *before* bargaining and *before* settlement.
- Valid transactions route seamlessly to **Razorpay test rails** with SHA-256 Merkle-linked audit trails.

---

## 🏛️ System Architecture

```
                                  HUMAN PRINCIPAL
                                         │
                             Delegates Spend Mandate
                             (Ed25519 Signed Leash)
                                         ▼
                                   BUYER AGENT
                                         │
                     ┌───────────────────┴───────────────────┐
                     ▼                                       ▼
             PRE-TRANSACTION GATE                  A2A PROTOCOL NEGOTIATION
        • Budget ceiling check                 • Autonomous bargaining
        • Category & merchant whitelist        • RFC-compliant agent manifest
        • Velocity limit enforcement           • Live SSE dialogue stream
                     │                                       │
                     └───────────────────┬───────────────────┘
                                         ▼
                                POST-TRANSACTION GATE
                                • Signature validation
                                • Receipt item verification
                                • Tamper-evident ledger entry
                                         │
                                         ▼
                              RAZORPAY SETTLEMENT RAILS
                                • Order creation
                                • Testnet payment link
                                • Automated reconciliation
```

---

## 🚀 Key Features

1. **Cryptographic Mandate Leash**
   - Natural language spending policies compiled to deterministic JSON schemas.
   - Cryptographically secured with **Ed25519** digital signatures.

2. **Autonomous Agent-to-Agent (A2A) Protocol**
   - Compliant with `/.well-known/agent.json` discovery standards.
   - Real-time bargaining between Buyer Agent and Merchant Agent with dynamic concession strategies.

3. **Double Gate Guardrails**
   - **Gate 1 (Pre-Transaction)**: Prevents out-of-scope haggling and unauthorized SKU queries.
   - **Gate 2 (Post-Transaction)**: Re-validates final negotiated price against original mandate signature before dispatching Razorpay orders.

4. **Hardware-Grade Kill Switch**
   - Instant revocation of rogue agent keys, immediately terminating active sessions and invalidating downstream settlement requests.

5. **SHA-256 Merkle Audit Ledger**
   - Cryptographically linked audit chain guaranteeing non-repudiation. Includes simulation tools to demonstrate tamper detection in real time.

6. **Interactive Protocol Topology Map**
   - Animated visual flow powered by `@xyflow/react` showing real-time agent authority and transaction flows.

7. **Revenue Rescue Engine**
   - Algorithmic cart recovery and margin optimization for merchants facing abandoned agent sessions.

8. **Fintech Design System**
   - Next.js 15, Tailwind CSS, Lucide icons, Framer Motion, and Magic UI primitives (`NumberTicker`, `BorderBeam`, `DotPattern`).

---

## 🛠️ Tech Stack

- **Backend**: Python 3.11+, FastAPI, Uvicorn, Pydantic v2, PyCryptodome (Ed25519), SQLite, Razorpay Python SDK, Google Gemini API.
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, `@xyflow/react`, Lucide React, Recharts.
- **Testing**: Complete automated test suite (`backend/test_god_mode.py`) covering cryptographic validation, policy compilation, double gates, Merkle ledger integrity, and Razorpay rails.

---

## 📦 Quickstart & Installation

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- Git

### 1. Clone Repository
```bash
git clone https://github.com/Massvippin01/Mandate_Mart.git
cd Mandate_Mart
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Activate Virtual Environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt

# Configure Environment Variables
cp .env.example .env
# Edit .env with your Razorpay Test credentials and Gemini API key

# Start Backend Server
python -m uvicorn main:app --reload --port 8000
```
Backend will be live at `http://localhost:8000` (API Docs at `http://localhost:8000/docs`).

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Frontend command center will be live at `http://localhost:3000`.

---

## 🧪 Verification & Testing

To run the complete automated test suite verifying all 7 core subsystems:

```bash
cd backend
python test_god_mode.py
```

Expected output:
```
================================================================================
  MANDATEMART GOD-MODE VERIFICATION SUITE
================================================================================
  [PASS] 1. SQLite Database & Schema
  [PASS] 2. Ed25519 Crypto (Sign, Verify, Tamper Detection)
  [PASS] 3. Policy Compiler (NL -> Rules Engine)
  [PASS] 4. Double Gate & Kill Switch
  [PASS] 5. SHA-256 Merkle Ledger Integrity
  [PASS] 6. Razorpay Rails (Order Payload & Keys)
  [PASS] 7. Endpoints & A2A Manifest
================================================================================
  ALL 7/7 TESTS PASSED — 100% OPERATIONAL
================================================================================
```

---

## 📂 Project Structure

```
Mandate_Mart/
├── backend/
│   ├── agent.py              # Buyer Agent logic & LLM haggling engine
│   ├── merchant_agent.py     # Merchant Agent bargaining rules
│   ├── gates.py              # Double Gate validation & Kill Switch
│   ├── models.py             # SQLAlchemy models & schema definitions
│   ├── schemas.py            # Pydantic validation schemas
│   ├── main.py               # FastAPI application & SSE streams
│   ├── utils.py              # Ed25519 cryptography & Merkle hash chain
│   ├── test_god_mode.py      # Automated 7-point verification suite
│   ├── seed_revenue.py       # Sample data generation
│   ├── requirements.txt      # Python dependencies
│   └── .env.example          # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx    # Inter + JetBrains Mono typography
│   │   │   ├── globals.css   # Theme styling & React Flow styles
│   │   │   └── page.tsx      # Command Center dashboard (6 views)
│   │   └── components/
│   │       ├── ui/
│   │       │   └── primitives.tsx       # Panel, PanelHeader, Badge, Button
│   │       ├── magicui/
│   │       │   ├── number-ticker.tsx    # Indian Rupee spring ticker
│   │       │   ├── border-beam.tsx      # Conic gradient animation
│   │       │   └── dot-pattern.tsx      # Background dot matrix
│   │       ├── ProtocolTopology.tsx     # Live React Flow graph
│   │       ├── NegotiationStoryboard.tsx# Live A2A chat storyboard
│   │       ├── RevenueRescue.tsx        # Cart recovery modal
│   │       └── WarRoomTerminal.tsx      # Live SSE ledger terminal
│   └── package.json
└── MandateMart_Blueprint_v2.md # Complete architectural specification
```

---

## 🏆 Hackathon Submission Notes

- **Track**: Track 01 — AI Growth & Agentic Commerce
- **Innovation**: Eliminates blind trust in autonomous AI purchasing through signed cryptographic spend mandates and real-time dual-gate validation.
- **Production Readiness**: Designed with modular microservices, standards-compliant A2A manifests, and integration with Razorpay rails.
