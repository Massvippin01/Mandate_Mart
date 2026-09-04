<div align="center">

# 🛡️ MandateMart

### **The Trust Layer for Agentic Commerce**

**Give AI the ability to transact — without giving AI unrestricted access to money.**

<br/>

[![Razorpay AI Buildathon 2026](https://img.shields.io/badge/Razorpay%20AI%20Buildathon-2026-0C2340?style=for-the-badge)](https://razorpay.com/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python)](https://www.python.org/)
[![Razorpay](https://img.shields.io/badge/Payments-Razorpay-0C2340?style=for-the-badge)](https://razorpay.com/)
[![Ed25519](https://img.shields.io/badge/Cryptography-Ed25519-7C3AED?style=for-the-badge)](https://ed25519.cr.yp.to/)
[![God Mode QA](https://img.shields.io/badge/QA-8%2F8%20PASS-success?style=for-the-badge)](backend/test_god_mode.py)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br/>

> **AI can reason. AI can negotiate. AI can recommend.**
>
> **But AI cannot move money outside the authority explicitly delegated to it.**

<br/>

[Features](#-core-capabilities) · [Architecture](#️-architecture) · [Security](#-security-model) · [Quick Start](#-quick-start) · [Testing](#-testing) · [Rubric Alignment](#-track-01-rubric-alignment)

<br/><br/>

<!-- TODO: Replace with your actual demo GIF -->
<!-- <img src="docs/assets/demo.gif" alt="MandateMart Demo" width="900"/> -->

</div>

---

## ⚡ What is MandateMart?

**MandateMart is a security and authorization layer for AI-driven payments.**

As AI agents move from *recommending* products to **actually purchasing them**, a fundamental problem appears:

> **How do you give an AI enough authority to complete a transaction without giving it enough authority to financially harm the user?**

With NPCI's UAP, Google's AP2, and the x402 standard racing to define agent-to-agent commerce, **MandateMart is a working reference implementation of that future — built on Razorpay rails.**

We separate four concerns that most agentic-commerce demos collapse into one:

```text
AI DECISION-MAKING   (probabilistic, can hallucinate)
        ↓
POLICY ENFORCEMENT   (compiled from natural language)
        ↓
CRYPTOGRAPHIC AUTH   (Ed25519 signed mandates)
        ↓
PAYMENT EXECUTION    (deterministic, Razorpay rails)
```

The AI remains probabilistic. **The money layer remains deterministic.**

---

## 🎯 The Problem

Traditional AI payment architectures fall into three failure modes:

### 01 — Too Much Trust
Give an AI direct access to a payment API. A prompt injection, hallucination, or malicious tool response causes an unauthorized transaction.

### 02 — Too Much Human Intervention
Require OTP / MFA / manual checkout for every transaction. This defeats the entire point of autonomous commerce.

### 03 — No Verifiable Authorization
Even when a purchase succeeds, answering **"why was this payment allowed?"** requires forensic log-diving — if the logs even exist.

**MandateMart solves all three at once.**

---

## 💡 Our Approach: Delegated Spend Authority

The user defines what the agent may do. The agent operates autonomously **inside those cryptographically-enforced boundaries**.

```text
┌─────────────────────┐
│       HUMAN         │
│ "Buy hackathon gear │
│       under ₹4K"    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   POLICY COMPILER   │  (Gemini JSON-mode)
│ Budget: ₹4,000      │
│ Categories: Gear    │
│ Expiry: 24 hours    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  ED25519 PASSPORT   │
│ Signed Authority    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐         ┌─────────────────────┐
│    BUYER AGENT      │◄───A2A─►│   MERCHANT AGENT    │
│ (search, select)    │ ZOPA    │ (hidden reserve     │
│                     │ bargain │  floor, bundling)   │
└──────────┬──────────┘         └─────────────────────┘
           │
           ▼
      ┌───────────┐
      │ DOUBLE    │
      │   GATE    │
      └─────┬─────┘
            │
      ┌─────┴─────┐
      ▼           ▼
  SEMANTIC    FINANCIAL
    GATE        GATE
  (ML cos-sim) (pure Python)
      │           │
      └─────┬─────┘
            ▼
      ┌──────────────┐
      │   RAZORPAY   │
      │ Orders API / │
      │ Pay Links    │
      └──────┬───────┘
             ▼
     SHA-256 MERKLE LEDGER
```

---

## 🚀 Core Capabilities

### 🔐 1. Cryptographic Agent Passports (Ed25519)
Every authorized agent receives an Ed25519-signed identity containing its delegated authority. Modify even one byte of the mandate and the signature invalidates instantly. **No shared secrets required** — merchants verify using a public key.

```json
{
  "agent_id": "BUYER-7F32",
  "purpose": "hackathon_equipment",
  "max_transaction": 2500,
  "daily_limit": 4000,
  "allowed_categories": ["electronics", "peripherals"],
  "blocked_categories": ["luxury", "gambling"],
  "expires_at": "2026-09-05T00:00:00Z"
}
```

### 🧠 2. Policy Compiler
Users express intent in natural language:

> *"Buy the best hackathon accessories under ₹4,000."*

Gemini (JSON-mode, with deterministic fallback) compiles this into a typed `SpendPolicy`. The LLM **interprets intent** — it does **not** get to redefine financial authority.

### 🤖 3. Agent-to-Agent Commerce (A2A Native)
Merchants publish a machine-readable manifest at `/.well-known/agent.json` describing their capabilities, skills, and security requirements. Foreign AI agents discover and transact with **zero UI** involved — proven live by our External Bot Raid simulator.

### 🤝 4. ZOPA Negotiation Engine
Bilateral bargaining modeled on the **Zone of Possible Agreement**. The merchant's `reserve_price` is stored in SQLite and **never exposed** to the buyer agent or any public endpoint. Bundles, counter-offers, and concession strategies emerge autonomously.

```text
Original Bundle     ₹4,299
        ↓
ZOPA Negotiation
        ↓
Final Offer         ₹3,799
        ↓
Savings              ₹500   (buyer)
Margin Protected   ₹1,200   (merchant, above reserve floor)
```

### 🛡️ 5. Deterministic Double Gate
**The core security boundary.** Before any rupee reaches Razorpay, the transaction must pass two independent gates:

- **Gate 01 — Semantic Intent** — Cosine similarity between human intent and cart description (Gemini embeddings, threshold 0.58, Jaccard fallback).
- **Gate 02 — Deterministic Financial** — Pure Python arithmetic. No LLM. No prompt. No probabilistic reasoning.

```python
proposed_amount <= max_budget - spent_amount
```

> **The critical invariant: If the financial gate fails, the Razorpay API is never called.** You can prove this live in the browser's Network tab.

### ⚔️ 6. Red Team Adversarial Arena
A built-in attack simulator proving the security boundary holds under real adversarial conditions:

| Attack Vector       | Result      |
|---------------------|-------------|
| Prompt Injection    | 🛑 Blocked  |
| Category Violation  | 🛑 Blocked  |
| Mandate Escalation  | 🛑 Blocked  |
| Replay Attack       | 🛑 Blocked  |
| Tool Poisoning      | 🛑 Blocked  |

Every blocked attack is hashed into the Merkle ledger. **The AI is allowed to fail; the payment layer is not allowed to fail open.**

### 🛑 7. Instant Kill Switch
A pulsing emergency button revokes an agent's nonce in real-time. The Double Gate checks revocation **before payment execution** — a rogue agent's next API call is dead on arrival in <1ms.

### 💰 8. Revenue Rescue Command Center
A measurable analytics dashboard proving Track 01's *"grow merchant revenue"* mandate:

- **ZOPA Recovered** — sales saved via autonomous negotiation
- **Payment Links Rescued** — shortfalls converted to top-up links instead of abandoned carts
- **Fraud Blocked** — hostile spend neutralized before reaching Razorpay

### 🎙️ 9. Voice Mandate Input
Users can speak their mandate intent via the Web Speech API (`en-IN`). The spoken phrase compiles into the same signed policy as typed input — conversational, not form-based.

### 🤖 10. External Bot Raid Simulator
A standalone `external_bot.py` proves "sellable to AI buyers" by discovering our A2A manifest, creating its own mandate, negotiating, and settling — all via raw HTTP, zero UI. The dashboard flags live: `⚠️ FOREIGN AGENT DETECTED`.

### 🔔 11. Razorpay Webhook Settlement
Production-grade async settlement. A simulator HMAC-signs a `payment.captured` payload exactly as Razorpay would, delivers it to our webhook endpoint, and our verification pipeline settles the mandate in the Merkle ledger.

### 🧾 12. Cryptographic Transaction Passport
A downloadable PNG receipt containing the Merkle root hash, Ed25519 signature, gate verdicts, and Razorpay order ID — a verifiable artifact for audits, disputes, and compliance.

### 🗺️ 13. Live Protocol Topology
A `@xyflow/react` graph where nodes light up in real-time as the SSE stream delivers ledger events — a judge-friendly visual trace of the authorization pipeline.

### 💬 14. Negotiation Storyboard
A WhatsApp-style chat UI rendering the raw A2A negotiation as a human-readable conversation between buyer and merchant agents — turning black-box agent reasoning into an inspectable dialogue.

---

## 🏗️ Architecture

```text
                       ┌──────────────────┐
                       │      HUMAN       │
                       └────────┬─────────┘
                                │ natural-language intent
                                ▼
                       ┌──────────────────┐
                       │ POLICY COMPILER  │  (Gemini JSON-mode)
                       └────────┬─────────┘
                                ▼
                       ┌──────────────────┐
                       │ ED25519 PASSPORT │
                       └────────┬─────────┘
                                │
                   ┌────────────┴────────────┐
                   ▼                         ▼
          ┌─────────────────┐       ┌─────────────────┐
          │   BUYER AGENT   │◄─A2A─►│ MERCHANT AGENT  │
          │ (Gemini tools)  │ ZOPA  │ (hidden reserve)│
          └────────┬────────┘       └─────────────────┘
                   ▼
          ┌────────────────────────────────┐
          │       DETERMINISTIC            │
          │         DOUBLE GATE            │
          │   semantic   │   financial     │
          │    (ML)      │   (arithmetic)  │
          └──────────────┬─────────────────┘
                         │
                ┌────────┴────────┐
                ▼                 ▼
        ┌──────────────┐  ┌──────────────┐
        │ RAZORPAY     │  │ RAZORPAY     │
        │ Orders API   │  │ Payment Links│
        │ (happy path) │  │ (shortfall)  │
        └──────┬───────┘  └──────┬───────┘
               │                 │
               └────────┬────────┘
                        ▼
              ┌──────────────────┐
              │  SHA-256 MERKLE  │  SSE → frontend
              │   AUDIT LEDGER   │
              └──────────────────┘
```

---

## 🔒 Security Model

MandateMart enforces one architectural axiom:

> ### **LLMs can propose. Deterministic systems authorize.**

### Trust Boundaries

| Component                  | Trusted to move money? |
|----------------------------|:----------------------:|
| LLM                        | ❌                     |
| Buyer Agent                | ❌                     |
| Merchant Agent             | ❌                     |
| A2A / MCP Tool             | ❌                     |
| Semantic Model             | ❌                     |
| **Policy Engine**          | ✅                     |
| **Cryptographic Verify**   | ✅                     |
| **Financial Gate**         | ✅                     |
| **Razorpay**               | ✅                     |

Compromising the AI layer **does not** grant access to the payment layer.

### Five Invariants

```text
Financial  :  AUTHORIZED_AMOUNT ≤ REMAINING_DELEGATED_LIMIT
Identity   :  VALID_SIGNATURE ∧ NONCE_NOT_REVOKED ∧ ¬EXPIRED
Payment    :  GATE_FAILURE → RAZORPAY_CALL = 0
Audit      :  EVENT_N references HASH(EVENT_N−1)
Privacy    :  reserve_price ∉ public API ∧ reserve_price ∉ LLM context
```

---

## 💳 Razorpay Integration

The architecture deliberately separates agentic intelligence from payment execution:

- **Orders API** — Happy-path settlement when gates pass.
- **Payment Links** — Graceful shortfall recovery (the rubric's *"one failure handled gracefully"* requirement).
- **Webhook Settlement** — HMAC-SHA256 verified `payment.captured` events settle mandates in the ledger.
- **Test-key enforcement** — `RAZORPAY_KEY_ID` is asserted to start with `rzp_test_` at startup; production keys cannot accidentally be used.

The security boundary exists **before** money reaches the payment API.

---

## 📊 Track 01 Rubric Alignment

| Track 01 Requirement                  | MandateMart Implementation                                                              |
|---------------------------------------|-----------------------------------------------------------------------------------------|
| **Grow merchant revenue**             | ZOPA negotiation + bundle optimization + Revenue Rescue analytics + Payment Link recovery |
| **Sellable to AI buyers**             | `/.well-known/agent.json` A2A manifest + External Bot Raid simulator                    |
| **Explainable**                       | Policy Compiler + Negotiation Storyboard + Transaction Passport                         |
| **Bounded**                           | Ed25519 passports with scoped categories, ceilings, expiry, revocation nonces            |
| **Gated**                             | Deterministic Double Gate (semantic + financial) — LLMs cannot touch money               |
| **Audit trail**                       | SHA-256 Merkle ledger streamed via SSE + live tamper simulator                          |
| **One failure handled gracefully**    | Budget shortfalls → Razorpay Payment Link (instead of abandoned cart)                   |

---

## 🛠️ Tech Stack

| Layer           | Technology                                                                                     |
|-----------------|------------------------------------------------------------------------------------------------|
| **Frontend**    | Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, @xyflow/react, Recharts, Lucide React, Magic UI primitives |
| **Backend**     | Python 3.11+, FastAPI, Uvicorn, Pydantic v2, PyNaCl, SQLite (WAL mode), Razorpay SDK, Google Gemini API |
| **Security**    | Ed25519 signatures, SHA-256 Merkle chain, cryptographic nonces, HMAC webhook verification       |
| **AI / Agents** | Buyer Agent, Merchant Agent, Policy Compiler, Semantic Intent Engine, ZOPA Negotiation Engine, Red Team Simulator |

---

## 📁 Project Structure

```text
Mandate_Mart/
│
├── backend/
│   ├── main.py                # FastAPI app, SSE stream, A2A manifest, Red Team, Webhooks
│   ├── agent.py               # Buyer Agent logic & Gemini tool calling
│   ├── merchant_agent.py      # Merchant Agent with hidden reserve floor (ZOPA)
│   ├── gates.py               # Double Gate validation & Kill Switch
│   ├── models.py              # SQLAlchemy models (Mandate, CatalogItem, LedgerEntry, RevenueEvent)
│   ├── schemas.py             # Pydantic schemas (SpendPolicy, MandateCreate)
│   ├── utils.py               # Ed25519 PassportAuthority & Policy Compiler
│   ├── database.py            # SQLite engine (WAL mode) + session management
│   ├── external_bot.py        # Foreign AI Agent Raid Simulator
│   ├── test_god_mode.py       # Automated 8-point verification suite
│   ├── seed_revenue.py        # Sample revenue-event data
│   ├── requirements.txt
│   ├── .env.example
│   └── mandatemart.db
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx     # Inter + JetBrains Mono typography
│   │   │   ├── globals.css    # Theme + React Flow dark-mode styles
│   │   │   └── page.tsx       # Command Center (6 views + voice mandate)
│   │   └── components/
│   │       ├── ui/primitives.tsx              # Panel, Badge, Button design system
│   │       ├── magicui/                       # NumberTicker, BorderBeam, DotPattern
│   │       ├── ProtocolTopology.tsx           # Live React Flow graph
│   │       ├── NegotiationStoryboard.tsx      # WhatsApp-style A2A chat
│   │       ├── RevenueRescue.tsx              # Merchant GMV analytics
│   │       ├── RedTeamArena.tsx               # 5-vector attack simulator
│   │       ├── TransactionPassport.tsx        # Downloadable PNG receipt
│   │       └── WarRoomTerminal.tsx            # Raw SSE telemetry viewer
│   ├── package.json
│   └── tailwind.config.ts
│
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Python **3.11+**
- Node.js **18+** and npm
- Razorpay test-mode credentials (`rzp_test_...`)
- Google Gemini API key

### 1. Clone

```bash
git clone https://github.com/Massvippin01/Mandate_Mart.git
cd Mandate_Mart
```

### 2. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt

cp .env.example .env
# Fill in: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, GEMINI_API_KEY, RAZORPAY_WEBHOOK_SECRET

python -m uvicorn main:app --reload --port 8000
```

Backend at `http://localhost:8000` — Swagger docs at `/docs`, A2A manifest at `/.well-known/agent.json`.

### 3. Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Dashboard at `http://localhost:3000`.

### 4. Seed Demo Data (optional)

```bash
cd backend
python seed_revenue.py
```

### 5. Run the External Bot Raid

```bash
cd backend
python external_bot.py
```

Watch the dashboard flash `⚠️ FOREIGN AGENT DETECTED` as the foreign agent transacts entirely via raw API.

---

## 🧪 Testing

The **God-Mode** verification suite exercises every security boundary end-to-end:

```bash
cd backend
python test_god_mode.py
```

