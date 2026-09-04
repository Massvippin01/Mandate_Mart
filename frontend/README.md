# 🛡️ MandateMart — Frontend Command Center

<div align="center">

[![Razorpay AI Buildathon](https://img.shields.io/badge/Razorpay%20AI%20Buildathon-2026-0C2340?style=for-the-badge)](https://razorpay.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![React Flow](https://img.shields.io/badge/@xyflow/react-Topology-FF0072?style=for-the-badge)](https://reactflow.dev/)

<br/>

**A high-performance, real-time command dashboard for AI agentic commerce, delegated spend authority, and cryptographic audit telemetry.**

</div>

---

## 🖥️ Overview

The MandateMart frontend is designed as a **mission-critical financial command center** rather than a consumer shopping cart. It provides real-time visualization, inspection, and human override capabilities for autonomous Agent-to-Agent (A2A) commerce.

Built on **Next.js 15 (App Router)** and **Tailwind CSS**, it implements a strict fintech design system inspired by Vercel and Stripe dashboard standards.

---

## 🧭 Dashboard Views

The command center features 6 dedicated views accessible via the sidebar navigation:

1. **Protocol Console (`executive`)**
   - Human Mandate Leash configuration (budget slider, categories, validity duration).
   - Natural language policy input with Web Speech API voice dictation (`en-IN`).
   - One-click demo scenarios (Budget constrained, Luxury blocked, Category violation, Tamper test).
   - Live double gate verdicts and Razorpay settlement order generation.

2. **Analytics & KPIs (`analytics`)**
   - Executive GMV metrics powered by spring-physics `<NumberTicker />`.
   - ZOPA savings breakdown, rescued transactions count, and prevented unauthorized spend.
   - Real-time margin recovery visualization.

3. **Topology & Flow (`topology`)**
   - Live animated protocol topology powered by `@xyflow/react`.
   - Visualizes authority and money flow across 8 system nodes: `Human Principal` → `Policy Compiler` → `Buyer Agent` → `Merchant Agent` → `Semantic Gate` → `Financial Gate` → `Razorpay Rails` → `Merkle Ledger`.
   - Dynamic pulsing glow on active nodes synchronized via SSE.

4. **Cryptographic Audit Ledger (`ledger`)**
   - Real-time display of SHA-256 Merkle-linked audit blocks.
   - Interactive **Verify Chain** verification against backend cryptographic proofs.
   - **Simulate Tamper** demonstration button to show instantaneous block invalidation.

5. **Merchant Catalog & Inventory (`catalog`)**
   - Live inventory tracking with real-time stock and price adjustments.
   - Displays merchant public prices while keeping `reserve_price` floor strictly private.

6. **Agent Negotiation Storyboard (`storyboard`)**
   - WhatsApp-style chat interface visualizing the autonomous A2A bargaining rounds.
   - Real-time dialogue bubbles between Buyer Agent (cyan) and Merchant Agent (amber).

---

## 🪟 Interactive Modal Systems

- **War Room Terminal**: High-density streaming telemetry terminal showing raw SSE events, cryptographic hashes, and gate execution logs.
- **Revenue Rescue Center**: Proactive recovery analytics displaying how budget shortfalls are transformed into Razorpay Payment Links rather than abandoned carts.
- **Transaction Passport**: Cryptographic receipt generator exporting verifiable proof of mandate, gate results, and settlement IDs as a PNG receipt.
- **Hardware Kill Switch**: Instant revocation triggering immediate nullification of active agent nonces.

---

## 🎨 Design System Primitives

All UI components follow a strict, curated fintech palette located in `src/components/ui/primitives.tsx`:

- **Allowed Accents**: Violet (brand/primary), Emerald (success/money), Rose (danger/kill), Amber (warning/merchant), Cyan (buyer agent identity).
- **Typography**: `Inter` (sans-serif) for all headers and body text; `JetBrains Mono` strictly reserved for amounts, order IDs, cryptographic hashes, and ledger logs.
- **Primitives**:
  - `Panel`: Glassmorphic container (`bg-zinc-900/50 border border-white/[0.06] rounded-2xl`).
  - `PanelHeader`: Standardized header row with icon, title, and meta badges.
  - `Badge`: Tones for `neutral`, `success`, `danger`, `warn`, `info`.
  - `Button`: Variants for `primary`, `danger`, `success`, `outline`, `ghost`.
- **Magic UI Accents**:
  - `NumberTicker`: Fluid Indian Rupee (`en-IN`) spring counter.
  - `BorderBeam`: Dynamic animated conic-gradient border sweep.
  - `DotPattern`: Subtle SVG background matrix.

---

## 🚀 Getting Started

### Installation

```bash
cd frontend
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the Command Center.

### Production Build

```bash
npm run build
npm run start
```

---

## 📁 Directory Structure

```text
frontend/src/
├── app/
│   ├── layout.tsx         # Google Fonts (Inter + JetBrains Mono)
│   ├── globals.css        # Tailwind theme & React Flow dark mode overrides
│   └── page.tsx           # Command Center orchestrator & 6 view controllers
└── components/
    ├── ui/
    │   └── primitives.tsx # Design system primitives (Panel, Badge, Button, cn)
    ├── magicui/
    │   ├── number-ticker.tsx # Indian Rupee animated spring counter
    │   ├── border-beam.tsx   # Conic gradient border highlight
    │   └── dot-pattern.tsx   # SVG background dot matrix
    ├── ProtocolTopology.tsx      # Interactive @xyflow/react live topology graph
    ├── NegotiationStoryboard.tsx # Autonomous A2A dialogue storyboard
    ├── RevenueRescue.tsx         # Margin optimization & shortfall recovery modal
    ├── RedTeamArena.tsx          # 5-vector adversarial simulation arena
    ├── TransactionPassport.tsx   # Verifiable cryptographic PNG receipt
    └── WarRoomTerminal.tsx       # Live raw SSE ledger telemetry terminal
```
