<div align="center">

# 🛡️ MandateMart
### The Trust Layer for Agentic Commerce

**AI can reason. AI can negotiate. But only deterministic code can move money.**

*A working reference implementation of delegated financial authority for autonomous agent-to-agent commerce — where every rupee an AI agent spends is authorized, verified, and cryptographically provable.*

[![Razorpay AI Buildathon](https://img.shields.io/badge/Razorpay_AI_Buildathon-2026-7C3AED?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Ed25519](https://img.shields.io/badge/Crypto-Ed25519-F43F5E?style=for-the-badge&logo=letsencrypt&logoColor=white)](https://ed25519.cr.yp.to/)
[![Watch Demo](https://img.shields.io/badge/▶_Watch_Demo-YouTube-FF0000?style=for-the-badge&logo=youtube&logoColor=white)](https://youtu.be/6JAvCBpdnrc)

<sub>Real-time SSE telemetry · Zero-LLM deterministic gating · SHA-256 Merkle-linked audit ledger</sub>

### 📺 [Watch the Full Demo Video](https://youtu.be/6JAvCBpdnrc)

</div>

<br/>

## 📑 Table of Contents

- [Demo Video](#-watch-the-full-demo-video)
- [The Problem](#-the-problem)
- [The Solution: Delegated Spend Authority](#-the-solution-delegated-spend-authority)
- [Command Center — Five Views](#️-command-center--five-views)
- [Interactive Modals & Attack Arena](#-interactive-modals--attack-arena)
- [Security Model — The Five Invariants](#-security-model--the-five-invariants)
- [Core Capabilities](#-core-capabilities)
- [Design System](#-design-system)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Directory Structure](#-directory-structure)
- [Buildathon Track Alignment](#-buildathon-track-alignment)
- [The Vision](#-the-vision)

<br/>

## ⚡ The Problem

AI agents are moving from *recommending* products to *actually purchasing* them — but every existing architecture for this falls into one of two failure modes:

1. **Too much trust** — the LLM is handed live payment API keys. A single prompt injection, hallucination, or malicious tool response becomes an unauthorized transaction.
2. **Too much human friction** — the user must approve every purchase via OTP/MFA, destroying the very autonomy agentic commerce promises.

And even when a purchase *does* succeed, nobody can cryptographically answer the question that matters most to a payment provider: **"Why was this payment allowed?"**

With NPCI's UAP and the global protocol race (ACP, AP2, x402) heating up, agent-to-agent commerce is the open problem of the year. **MandateMart is a working reference implementation of its missing piece: delegated financial authority.**

<br/>

## 🔐 The Solution: Delegated Spend Authority

MandateMart separates **AI reasoning** from **financial execution**. A human delegates a cryptographically signed, strictly scoped spend mandate. Agents operate autonomously *inside* that boundary. A zero-LLM deterministic gate authorizes money. Razorpay executes it. A hash-chained ledger audits every step.

```mermaid
graph LR
    A[👤 Human Principal] -->|natural language intent| B[🧠 Policy Compiler]
    B -->|signed SpendPolicy| C[🤖 Buyer Agent]
    C <-->|ZOPA negotiation| D[🏪 Merchant Agent]
    D --> E{🧩 Semantic Gate}
    E -->|intent ≈ cart| F{💰 Financial Gate}
    F -->|proposed ≤ remaining| G[💳 Razorpay Rails]
    G --> H[🔗 Merkle Ledger]

    style A fill:#7C3AED,color:#fff
    style E fill:#F59E0B,color:#000
    style F fill:#F59E0B,color:#000
    style G fill:#10B981,color:#fff
    style H fill:#3178C6,color:#fff
```

### End-to-End Flow

1. **Intent → Policy** — The human types or *speaks* an intent (*"Buy hackathon gear under ₹4,000"*). The **Policy Compiler** (Gemini JSON-mode, with a deterministic regex fallback) compiles it into a typed `SpendPolicy`: budget ceiling, allowed/blocked categories, expiry.
2. **Cryptographic Passport** — The Passport Authority signs the mandate with **Ed25519**. The agent receives a passport with a single-use nonce. Merchants verify authority via public key — no shared secrets; one byte of tampering invalidates the signature.
3. **Autonomous A2A Commerce** — The buyer agent discovers the merchant via a machine-readable `/.well-known/agent.json` manifest, inspects the catalog, and negotiates bilaterally with the merchant agent over **ZOPA** (Zone of Possible Agreement). The merchant defends a *hidden reserve floor* and applies bundle discounts — never exposed to the buyer or the LLM.
4. **The Zero-LLM Double Gate** — Before any rupee moves: **Gate 1 (Semantic)** scores intent-vs-cart similarity (embedding cosine, with Jaccard fallback); **Gate 2 (Financial)** runs pure integer arithmetic — `proposed ≤ max − spent`, plus expiry, signature, and nonce-revocation checks. *LLMs propose; deterministic systems authorize.*
5. **Razorpay Execution** — On pass, the Orders API creates a real test order; checkout completes with test UPI/card. Settlement occurs **only** when an **HMAC-SHA256-verified webhook** (`payment.captured`) arrives — the UI never trusts the client-side "success" screen.
6. **Graceful Failure** — If a legitimate purchase exceeds the leash, the gate blocks the order but mints a **Razorpay Payment Link** for the exact shortfall — the human tops up in one click and the merchant keeps the sale.
7. **Immutable Audit** — Every negotiation turn, gate verdict, blocked attack, and settlement is appended to a **SHA-256 Merkle ledger** (append-only, hash-chained, streamed live over SSE). Tampering with any block breaks the chain and pinpoints the corrupted block.
8. **Human Kill Switch** — One button revokes the agent's nonce in real time; its next gate check dies instantly with `PASSPORT_REVOKED`.

<br/>

## 🖥️ Command Center — Five Views

Built on **Next.js 15 (App Router)** with a strict fintech design language inspired by Vercel and Stripe dashboards, the sidebar gives operators full visibility and override power over every agent transaction.

| # | View | What it shows |
|---|------|----------------|
| 1 | 📊 **Analytics & KPIs** | Executive GMV via spring-physics counters, ZOPA savings, rescued transactions, prevented unauthorized spend |
| 2 | 🕸️ **Topology & Flow** | Live animated `@xyflow/react` graph of authority + money flow across 8 system nodes, pulsing in sync with SSE events — usually the moment judges lean in |
| 3 | 🔗 **Audit Ledger** | SHA-256 Merkle-linked audit blocks with one-click **Verify Chain** and a **Simulate Tamper** button that shows instant invalidation |
| 4 | 🏪 **Merchant Catalog** | Live inventory + pricing, with `reserve_price` floors kept strictly server-side private |
| 5 | 💬 **Negotiation Storyboard** | WhatsApp-style bubble UI replaying the Buyer Agent (cyan) ↔ Merchant Agent (amber) bargaining rounds |

<br/>

## 🪟 Interactive Modals & Attack Arena

| Modal | Purpose |
|---|---|
| 🖥️ **War Room Terminal** | Raw SSE event stream — hashes, gate execution logs, high-density telemetry |
| 💰 **Revenue Rescue Center** | Converts budget shortfalls into Razorpay Payment Links instead of abandoned carts |
| 🧾 **Transaction Passport** | Cryptographic receipt generator — exports a verifiable PNG proof of mandate + settlement |
| 🛡️ **Red Team Arena** | Five live adversarial simulations (prompt injection, category violation, mandate escalation, replay attack, tool poisoning) with an animated real-gate trace and Network-tab proof of zero payment calls |
| 🔴 **Hardware Kill Switch** | One tap → instant nullification of active agent nonces, no confirmation lag |

<br/>

## 🔒 Security Model — The Five Invariants

1. **Financial** — authorized amount ≤ remaining delegated limit.
2. **Identity** — valid signature ∧ nonce not revoked ∧ mandate not expired.
3. **Payment** — gate failure → zero Razorpay calls.
4. **Audit** — every block references the hash of the previous block.
5. **Privacy** — reserve prices never enter the LLM context or public APIs.

<br/>

## 🧩 Core Capabilities

- **Policy Compiler** — natural language → machine-verifiable JSON mandates.
- **Ed25519 Agent Passports** — asymmetric, tamper-evident, revocable spend authority.
- **ZOPA Negotiation Engine** — autonomous bilateral bargaining with hidden reserve floors and bundle economics.
- **Deterministic Double Gate** — semantic + financial guardrails; gate failure ⇒ Razorpay is *never* called.
- **Red Team Arena** — five live attack simulations with an animated real-gate trace and a Network-tab proof of zero payment calls.
- **Merkle Audit Ledger** — live SSE stream, one-click chain verification, and a tamper simulator.
- **Razorpay Rails** — Orders API, Payment Links (shortfall rescue), and HMAC-verified webhook settlement; strict `rzp_test_` key enforcement.
- **Revenue Rescue Command Center** — measured GMV recovered via ZOPA, shortfalls converted, and hostile spend blocked.
- **External Agent Raid** — a standalone bot that discovers the manifest and transacts via raw API with zero UI, proving the merchant is *sellable to AI buyers*.
- **Protocol Topology Map** — a live, draggable React Flow graph where authority and money flow illuminate hop-by-hop.
- **Negotiation Storyboard** — the raw A2A dialogue rendered as a human-readable chat.
- **Transaction Passport** — a downloadable cryptographic receipt (Merkle root, Ed25519 signature, gate verdicts, Razorpay order ID).

<br/>

## 🎨 Design System

A curated fintech palette lives in `src/components/ui/primitives.tsx` — nothing off-palette ships.

<table>
<tr>
<td valign="top" width="50%">

**Accents (meaning-coded)**
- 🟣 Violet — brand / primary
- 🟢 Emerald — success / money
- 🔴 Rose — danger / kill switch
- 🟡 Amber — warning / merchant agent
- 🔵 Cyan — buyer agent identity

**Typography**
- `Inter` — all headers & body
- `JetBrains Mono` — amounts, order IDs, hashes, ledger logs *only*

</td>
<td valign="top" width="50%">

**Core primitives**
- `Panel` — glassmorphic container
- `PanelHeader` — icon + title + meta badges
- `Badge` — `neutral · success · danger · warn · info`
- `Button` — `primary · danger · success · outline · ghost`

**Magic UI accents**
- `NumberTicker` — spring-physics ₹ counter (`en-IN`)
- `BorderBeam` — animated conic-gradient sweep
- `DotPattern` — subtle SVG background matrix

</td>
</tr>
</table>

<br/>

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Backend** | FastAPI · Pydantic v2 · PyNaCl (Ed25519) · SQLite (WAL mode) · Razorpay Python SDK · Google Gemini |
| **Frontend** | Next.js 15 · TypeScript · Tailwind CSS v4 · Framer Motion · `@xyflow/react` · Recharts · Magic UI primitives |
| **Verification** | Automated 8/8 God-Mode suite (crypto, gates, ledger, rails, endpoints) · live webhook testing via ngrok · third-party proof on the Razorpay test dashboard |

<br/>

## 🚀 Getting Started

```bash
cd frontend
npm install
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** to view the Command Center.

<details>
<summary><strong>Production build</strong></summary>

```bash
npm run build
npm run start
```

</details>

<br/>

## 📁 Directory Structure

```text
frontend/src/
├── app/
│   ├── layout.tsx         # Google Fonts (Inter + JetBrains Mono)
│   ├── globals.css        # Tailwind theme & React Flow dark-mode overrides
│   └── page.tsx           # Command Center orchestrator & view controllers
└── components/
    ├── ui/
    │   └── primitives.tsx      # Design system primitives (Panel, Badge, Button, cn)
    ├── magicui/
    │   ├── number-ticker.tsx   # Indian Rupee animated spring counter
    │   ├── border-beam.tsx     # Conic-gradient border highlight
    │   └── dot-pattern.tsx     # SVG background dot matrix
    ├── ProtocolTopology.tsx        # Interactive @xyflow/react live topology graph
    ├── NegotiationStoryboard.tsx   # Autonomous A2A dialogue storyboard
    ├── RevenueRescue.tsx           # Margin optimization & shortfall recovery modal
    ├── RedTeamArena.tsx            # 5-vector adversarial simulation arena
    ├── TransactionPassport.tsx     # Verifiable cryptographic PNG receipt
    └── WarRoomTerminal.tsx         # Live raw SSE ledger telemetry terminal
```

<br/>

## 🏆 Buildathon Track Alignment

- **Grow merchant revenue** — ZOPA bundle recovery, Payment-Link shortfall rescue, post-purchase upsell hooks, all measured in the Revenue Rescue dashboard.
- **Sellable to AI buyers** — A2A manifest discovery + external agent raid.
- **Explainable, bounded, gated** — every verdict ships with its reason; money moves only through deterministic gates.
- **Audit trail** — tamper-evident Merkle ledger with live verification.
- **One failure handled gracefully** — budget shortfalls become Payment Links, not abandoned carts.

<br/>

## 🔭 The Vision

Commerce is shifting from *Human → Website → Cart → Checkout → Payment* to *Human → Agent → Agent → Payment*. When that happens, the fundamental question changes from **"Can the AI make the purchase?"** to **"How can the financial system prove the AI was authorized to make it?"**

**MandateMart is built around that second question.**

<br/>

<div align="center">

**Built for the Razorpay AI Buildathon 2026** · Making agentic commerce something you can actually trust

</div>
