<div align="center">

# MANDATO
### Protocol-Level Enforcement of Digitally Signed Mandates for Agentic Commerce

**Razorpay AI Buildathon 2026 — Track 01: AI Growth & Agentic Commerce**

[![Next.js 15](https://img.shields.io/badge/Frontend-Next.js%2015-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.115-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Razorpay](https://img.shields.io/badge/Rails-Razorpay%20API-0C2340?style=for-the-badge&logo=razorpay)](https://razorpay.com/)
[![Ed25519](https://img.shields.io/badge/Security-Ed25519%20%2B%20SHA--256-violet?style=for-the-badge)](https://ed25519.cr.yp.to/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<br />

> *"In the agentic economy, probabilistic AI must never gate deterministic capital."*

<br />

<!-- TODO: Add your 15-second demo GIF here -->
<!-- ![Mandato Demo](docs/demo.gif) -->

</div>

---

## ⚡ The Problem: The Agentic Authorization Crisis

As autonomous AI agents begin executing transactions on behalf of humans, existing payment rails face an existential crisis. Standard architectures suffer from three fatal flaws:
1.  **Probabilistic Gating:** Developers rely on LLM system prompts (*"Please don't spend more than ₹4,000"*). LLMs hallucinate, misinterpret instructions, and can be prompt-injected.
2.  **Post-Facto Authorization:** Existing bots either require constant human MFA loops (defeating autonomy) or possess unconstrained API access (catastrophic financial risk).
3.  **The Black-Box Audit:** When autonomous buyer and merchant agents haggle, neither the user nor the payment provider has verifiable, tamper-proof insight into why a price was agreed upon.

With the global protocol race accelerating—NPCI's UAP, Google's AP2, and the x402 standard—**agent-to-agent commerce is the open problem of the year** [[15]][[18]].

## 🏛️ The Solution: Delegated Spend Authority

**MANDATO** is the trust layer between AI intent and real money. We separate AI reasoning from financial execution using a **Deterministic Double Gate**, **Ed25519 Agent Passports**, and a **SHA-256 Merkle Audit Ledger**.

1.  **Policy Compiler:** Translates human natural language (*"Buy hackathon gear under ₹4k"*) into strict, machine-verifiable JSON policies.
2.  **Ed25519 Passports:** Asymmetric cryptography ensures merchants can verify agent budgets without shared secrets.
3.  **Zero-LLM Double Gate:** Pure Python arithmetic guarantees that even if an AI is compromised, it mathematically cannot breach the budget.
4.  **ZOPA Bargaining:** Autonomous bilateral negotiation protecting hidden merchant reserve floors.

---

## 🎯 Track 01 Rubric Alignment Matrix

| Track 01 Mandate | MANDATO Implementation |
| :--- | :--- |
| **Grow Merchant Revenue** | **ZOPA Engine** saves abandoned carts via dynamic bundling. **Revenue Rescue Engine** quantifies recovered GMV. **Graceful Failure** generates Razorpay Payment Links for budget shortfalls instead of failing the checkout. |
| **Sellable to AI Buyers** | Native **A2A Commerce Manifest** (`/.well-known/agent.json`) allows foreign AI agents to discover and transact via structured tool calls. **External Bot Raid** simulator proves zero-UI interoperability. |
| **Explainable & Bounded** | **Deterministic Double Gate** enforces strict Pydantic policies. Zero LLM involvement in financial math. **Protocol Topology Map** visualizes authority flow in real-time. |
| **Audit Trail** | **SHA-256 Merkle Ledger** streamed via SSE. Live tamper-detection breaks the chain visually if the DB is mutated. |
| **One Failure Handled Gracefully** | Budget overruns autonomously trigger **Razorpay Payment Links** for human top-up, recovering lost GMV without crashing the agent loop. |

---

## 🚀 Key Features

### 🔐 1. Cryptographic Mandate Leash (Ed25519)
Humans sign cryptographic, verifiable spend mandates with scoped constraints (budget ceilings, allowed SKU categories, velocity caps). Secured with **Ed25519** digital signatures—modifying even 1 byte invalidates the passport.

### 🤖 2. Autonomous Agent-to-Agent (A2A) Protocol
Compliant with `/.well-known/agent.json` discovery standards. Buyer and Merchant agents negotiate deals autonomously over standard protocols with dynamic concession strategies and hidden reserve floor protection.

### 🛡️ 3. Zero-LLM Double Gate Guardrails
*   **Gate 1 (Semantic Intent):** ML-based cosine similarity check ensuring the cart matches the human's natural language intent.
*   **Gate 2 (Deterministic Financial):** Pure arithmetic verification (`proposed_amount <= max_budget - spent_amount`). **No LLMs allowed near the money.**

### 🛑 4. Hardware-Grade Kill Switch
Instant revocation of rogue agent nonces. If a human sees an agent making a bad deal, they slam the Kill Switch, and the Double Gate hard-blocks the next API call in <1ms.

### 📊 5. Revenue Rescue Command Center
Algorithmic cart recovery and margin optimization. Measures exact GMV rescued from cart abandonment via ZOPA bargaining and Payment Link shortfalls.

### 🗺️ 6. Interactive Protocol Topology Map
Animated visual flow powered by `@xyflow/react` showing real-time agent authority and transaction flows. Nodes light up live as events stream through the system.

### ⚔️ 7. Red Team Adversarial Arena
Live simulation of 5 attack vectors (Prompt Injection, Category Violation, Mandate Escalation, Replay Attack, Tool Poisoning). Proves that **Razorpay is never called** during an attack.

---

## 🛠️ Tech Stack

*   **Backend:** Python 3.11+, FastAPI, Uvicorn, Pydantic v2, PyNaCl (Ed25519), SQLite (WAL Mode), Razorpay Python SDK, Google Gemini API.
*   **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, `@xyflow/react`, Lucide React, Recharts, Magic UI primitives.
*   **Testing:** Complete automated test suite (`backend/test_god_mode.py`) covering cryptographic validation, policy compilation, double gates, Merkle ledger integrity, and Razorpay rails.

---

## 📦 Quickstart & Installation

### Prerequisites
*   Python 3.10+
*   Node.js 18+ and npm
*   Git

### 1. Clone Repository
```bash
git clone https://github.com/Massvippin01/Mandate_Mart.git
cd Mandate_Mart
