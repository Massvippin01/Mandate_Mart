<div align="center">

# 🛡️ MandateMart
### Frontend Command Center

**The mission-control dashboard for autonomous agent-to-agent commerce — where every rupee an AI agent spends is authorized, verified, and cryptographically provable.**

[![Razorpay AI Buildathon](https://img.shields.io/badge/Razorpay_AI_Buildathon-2026-7C3AED?style=for-the-badge&logo=razorpay&logoColor=white)](https://razorpay.com/)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tailwind v4](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![React Flow](https://img.shields.io/badge/@xyflow/react-Topology-F43F5E?style=for-the-badge&logo=react&logoColor=white)](https://reactflow.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

<br/>

<sub>Real-time SSE telemetry · Cryptographically verifiable ledger</sub>

</div>

<br/>

## ⚡ The Problem in One Sentence

AI agents are starting to spend real money on our behalf — but nobody can *see* what they're authorized to do, *verify* what they actually did, or *stop* them instantly when something goes wrong. MandateMart is the control tower that makes autonomous commerce auditable, governable, and safe.

<br/>

## 🖥️ Five Views, One Command Center

Built on **Next.js 15 (App Router)** with a strict fintech design language inspired by Vercel and Stripe dashboards, the sidebar gives operators full visibility and override power over every agent transaction.

| # | View | What it shows |
|---|------|----------------|
| 1 | 📊 **Analytics & KPIs** | Executive GMV via spring-physics counters, ZOPA savings, rescued transactions, prevented unauthorized spend |
| 2 | 🕸️ **Topology & Flow** | Live animated `@xyflow/react` graph of authority + money flow across 8 system nodes, pulsing in sync with SSE events |
| 3 | 🔗 **Audit Ledger** | SHA-256 Merkle-linked audit blocks with one-click **Verify Chain** and a **Simulate Tamper** button that shows instant invalidation |
| 4 | 🏪 **Merchant Catalog** | Live inventory + pricing, with `reserve_price` floors kept strictly server-side private |
| 5 | 💬 **Negotiation Storyboard** | WhatsApp-style bubble UI replaying the Buyer Agent (cyan) ↔ Merchant Agent (amber) bargaining rounds |

<br/>

### 🕸️ Topology & Flow — the centerpiece view

```
Human Principal → Policy Compiler → Buyer Agent → Merchant Agent
       → Semantic Gate → Financial Gate → Razorpay Rails → Merkle Ledger
```

Every node pulses live as authority and money move through the system — this is usually the moment judges lean in.

<br/>

## 🪟 Interactive Modal Systems

| Modal | Purpose |
|---|---|
| 🖥️ **War Room Terminal** | Raw SSE event stream — hashes, gate execution logs, high-density telemetry |
| 💰 **Revenue Rescue Center** | Converts budget shortfalls into Razorpay Payment Links instead of abandoned carts |
| 🧾 **Transaction Passport** | Cryptographic receipt generator — exports a verifiable PNG proof of mandate + settlement |
| 🔴 **Hardware Kill Switch** | One tap → instant nullification of active agent nonces, no confirmation lag |

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
│   └── page.tsx           # Command Center orchestrator & 6 view controllers
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

<div align="center">

**Built for the Razorpay AI Buildathon 2026** · Making agentic commerce something you can actually trust

</div>
