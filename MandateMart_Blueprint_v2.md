# MandateMart v2
### Delegated Spend Agents for Agentic Commerce
**Track 01 — AI Growth & Agentic Commerce | Razorpay National Hackathon**

> **v2 changelog:** Adds semantic (ML-based) intent gating, a cryptographic Merkle-chained audit ledger, real Razorpay UPI Autopay/Subscriptions integration, and ZOPA-based negotiation mechanics. Neo4j was considered and deliberately dropped — see Section 12 for reasoning.

---

## 1. The Pitch (30-second version)

> Every agentic commerce demo today shows an AI buying something. MandateMart shows what happens the moment *before* that — how a human safely hands an AI a wallet with a leash on it, how a merchant's AI negotiates back, and how every inch of that leash is visible in real time.

**What it is:** A human authorizes a **real Razorpay UPI Autopay / e-Mandate** (test-mode) that funds an AI "buyer agent's" spending power. The buyer agent then shops a merchant's catalog and *negotiates* with the merchant's own **pricing agent**, which withholds a hidden reserve price — real bargaining, not scripted turn-taking. Every proposed purchase passes a **double gate**: a semantic ML check (does this actually match what the human meant?) and a deterministic financial check (is it within budget?). Every decision is written into a **hash-chained, tamper-evident audit ledger**, streamed live to the UI. On approval, the FastAPI backend draws funds against the pre-authorized Razorpay token.

---

## 2. Why This Wins on the Actual Judging Criteria

The brief states the bar explicitly: *"Every money action explainable, bounded and gated. Show the audit trail and one failure handled gracefully."*

| Requirement | How MandateMart satisfies it |
|---|---|
| **Explainable** | Every agent action is preceded by a plain-English reasoning string, streamed to the ledger before the action executes |
| **Bounded** | The mandate hard-caps amount, category, and expiry — enforced in code, not by asking the LLM to "please stay within budget" |
| **Gated** | A deterministic `mandate_gate()` function sits between every agent decision and the Razorpay API; nothing reaches Razorpay unless it passes |
| **Audit trail** | Append-only, timestamped ledger of every query, negotiation turn, gate check, and payment call — rendered live, not just logged to console |
| **One failure handled gracefully** | A scripted over-budget negotiation attempt is blocked by the gate; the buyer agent recovers by proposing a cheaper substitute — shown live, no crash |
| **Uses Razorpay APIs** | A real UPI Autopay/e-Mandate authorizes the agent's funds up front; approved purchases draw against that pre-authorized token — not a bolt-on Orders call |

Why this beats a standard "chatbot + checkout button" build: that pattern treats authorization as an afterthought. MandateMart makes **authorization and negotiation the product itself** — which is exactly the open problem the brief cites (NPCI UAP, ACP, AP2, x402).

---

## 3. System Architecture (v2)

```
┌─────────────┐   authorizes UPI    ┌──────────────────────────────────┐
│    Human    │   Autopay mandate   │  Razorpay Subscriptions /         │
│  (Buyer)    │ ───────────────────▶│  e-Mandate (test-mode)            │
└─────────────┘   (natural-language │  → returns subscription_id/token  │
                    intent, e.g.    └──────────────────┬─────────────────┘
                    "hackathon                          │ token held by
                    survival gear,                      │ FastAPI backend
                    max ₹4000")                          ▼
                                        ┌────────────────────────────┐
                                        │      Buyer Agent            │
                                        │  (queries catalog,          │
                                        │   negotiates, proposes)     │
                                        └────────────┬─────────────────┘
                                                     │ negotiates with
                                                     ▼
                                        ┌────────────────────────────┐
                                        │  Merchant Pricing Agent     │
                                        │  (hidden reserve_price,     │
                                        │   ZOPA-bounded counter-     │
                                        │   offers, bundle discounts) │
                                        └────────────┬─────────────────┘
                                                     │ final proposed cart
                                                     ▼
                                    ┌────────────────────────────────────┐
                                    │           DOUBLE GATE                │
                                    │  ┌────────────────────────────────┐ │
                                    │  │ 1. Semantic Gate (ML)           │ │
                                    │  │  embed(mandate_text) vs         │ │
                                    │  │  embed(proposed_items)          │ │
                                    │  │  cosine_similarity > 0.75 ?     │ │
                                    │  └────────────────────────────────┘ │
                                    │  ┌────────────────────────────────┐ │
                                    │  │ 2. Financial Gate (deterministic│ │
                                    │  │  plain code, NOT an LLM)        │ │
                                    │  │  amount ≤ remaining cap?        │ │
                                    │  │  mandate not expired?           │ │
                                    │  └────────────────────────────────┘ │
                                    └───────┬────────────────────┬─────────┘
                                      BOTH PASS               ANY FAIL
                                            ▼                     ▼
                          ┌───────────────────────┐   ┌─────────────────────────┐
                          │ Razorpay charge against│   │ Graceful fallback:       │
                          │ pre-authorized token    │   │ propose cheaper/aligned  │
                          │ (test-mode)             │   │ substitute, or ask human │
                          └───────────┬─────────────┘   │ to top up mandate        │
                                      │                  └────────────┬─────────────┘
                                      ▼                               │
                    ┌──────────────────────────────────────────────────▼──┐
                    │      Hash-Chained Audit Ledger (SHA-256, live)        │
                    │  every entry includes hash of the previous entry —    │
                    │  tampering breaks the chain visibly in the UI         │
                    └─────────────────────────────────────────────────────┘
```

**Key design principles to say out loud in judging:**
- *"Authorization is deterministic code, not an LLM's judgment — you never let a probabilistic system gate real money."*
- *"LLMs hallucinate, so our audit trail doesn't trust them. Every decision is cryptographically chained — if an entry is altered, the hash chain breaks and the payment path hard-locks."*
- *"Category matching is semantic, not string-matching — the gate understands that 'hackathon survival gear' can mean an energy drink, even if the catalog labels it 'Beverages.'"*

---

## 4. Full Feature List (v2)

### Core (MVP — must work perfectly for demo)
1. **Real Razorpay UPI Autopay / e-Mandate authorization** — human completes an actual test-mode Razorpay flow to fund the agent; backend holds the returned `subscription_id`/`token_id`
2. **Buyer agent** — LLM-driven, queries catalog, negotiates, proposes purchases within its funded mandate
3. **Merchant catalog API** — 10–12 structured products (name, category, price, stock, bundle rules)
4. **Financial gate** — plain deterministic function, zero LLM involvement, checks amount + expiry before any charge
5. **Semantic intent gate** — `sentence-transformers` embeddings + cosine similarity between mandate text and proposed cart (threshold ~0.75)
6. **Razorpay charge execution** — approved purchases draw against the pre-authorized token (test-mode)
7. **Hash-chained audit ledger UI** — real-time streaming timeline; each entry's hash includes the previous entry's hash, and the UI visibly shows the chain (and breaks visibly if tampered)
8. **One scripted graceful failure** — a purchase attempt fails one of the two gates → blocked → buyer agent proposes a cheaper/better-aligned substitute, all shown live

### High-impact additions (build if MVP is solid)
9. **Merchant pricing agent with ZOPA mechanics** — initialized with a hidden `reserve_price` and inventory-based pressure; instructed to offer bundle discounts and counter-offer without ever revealing its floor — produces genuine, non-scripted-feeling negotiation
10. **Mid-flow mandate top-up** — human raises the spend cap live during a blocked negotiation (via a second small Razorpay authorization), agent resumes automatically
11. **Dual-failure demo** — show both gate types failing independently: one purchase blocked on semantic mismatch (score < 0.75), another blocked on budget — proves the double gate is real, not decorative

### Polish / stretch (only if ahead of schedule)
12. **Multi-agent handoff receipt** — after payment, buyer agent generates a plain-English purchase summary, including both gate scores ("Semantic match: 0.88, Budget: ₹3,800/₹4,000")
13. **Second mandate persona** — a stricter "corporate procurement" mandate vs. a looser "personal shopping" mandate, to show the framework generalizes
14. **Upsell hook** — after a successful purchase, merchant agent offers one relevant add-on within remaining mandate budget (ties back to Track 01's upsell example directions)

---

## 5. Data Schemas (v2)

### Mandate Object
```json
{
  "mandate_id": "mnd_8f2a1c",
  "issued_to": "buyer_agent_01",
  "intent_text": "Buy high-quality hackathon survival gear",
  "max_amount": 4000,
  "spent_amount": 0,
  "razorpay_subscription_id": "sub_test_XXXXXXXX",
  "razorpay_token_id": "token_test_XXXXXXXX",
  "issued_at": "2026-09-02T10:00:00Z",
  "expires_at": "2026-09-03T10:00:00Z",
  "signature": "hmac_sha256(...)"
}
```

### Catalog Item
```json
{
  "product_id": "prd_001",
  "name": "Mechanical Keyboard",
  "category": "electronics_accessories",
  "description": "Compact mechanical keyboard, ideal for late-night coding sessions",
  "price": 2500,
  "reserve_price": 2100,
  "stock": 14,
  "bundle_rules": [
    { "min_qty": 2, "discount_pct": 10 }
  ]
}
```
*(`description` field is what gets embedded for the semantic gate; `reserve_price` is only visible to the Merchant Agent, never the Buyer Agent.)*

### Ledger Entry (hash-chained)
```json
{
  "seq": 42,
  "timestamp": "2026-09-02T10:03:41Z",
  "actor": "buyer_agent",
  "action": "REQUEST_PRICE",
  "detail": "Requesting price for mechanical keyboard + 3 energy drinks",
  "gate_result": null,
  "prev_hash": "a1b2c3...",
  "entry_hash": "d4e5f6..."
}
```
```json
{
  "seq": 43,
  "timestamp": "2026-09-02T10:03:52Z",
  "actor": "semantic_gate",
  "action": "SEMANTIC_CHECK",
  "detail": "cosine_similarity(mandate_intent, proposed_cart) = 0.88",
  "gate_result": "PASS",
  "prev_hash": "d4e5f6...",
  "entry_hash": "g7h8i9..."
}
```
```json
{
  "seq": 44,
  "timestamp": "2026-09-02T10:03:53Z",
  "actor": "financial_gate",
  "action": "FINANCIAL_CHECK",
  "detail": "₹3800 ≤ remaining ₹4000 — mandate valid, not expired",
  "gate_result": "PASS",
  "prev_hash": "g7h8i9...",
  "entry_hash": "j1k2l3..."
}
```
Each `entry_hash = SHA256(prev_hash + seq + actor + action + detail + gate_result)`. Recomputing the chain client-side and comparing to stored hashes is the "tamper-proof" demo moment.

---

## 6. Tech Stack (v2)

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js + React + Tailwind | Real-time streaming dashboard, split-pane agent view, hash-chain visualizer |
| Agent & gate backend | FastAPI (Python) | Async handling for multi-agent chat streaming; same language as the ML gate, no cross-language glue |
| Buyer & merchant agents | Claude API, two distinct system prompts + tool-calling | Buyer: catalog query/negotiate tools. Merchant: offer/counter-offer tools with hidden `reserve_price` |
| Semantic gate | `sentence-transformers` (`all-MiniLM-L6-v2`) + cosine similarity | Lightweight, runs fast on CPU, no GPU dependency risk during a live demo |
| Financial gate | Plain Python function — no LLM, no ML | Deterministic by design; this is the line you defend hardest to judges |
| Ledger | SHA-256 hash chain, stored in SQLite | Tamper-evidence without standing up extra infra |
| Catalog & mandate storage | SQLite | Simple, zero-setup, sufficient for 10–12 products and a handful of mandates |
| Payments | Razorpay Subscriptions API / UPI Autopay (test-mode), with Orders API as fallback | Anchors the project in real Indian payment rails — see Section 11 for the fallback plan |
| Signing | HMAC-SHA256 on mandate object | Credible without over-engineering real PKI in a hackathon window |

**Dropped from the original proposal:** Neo4j graph database. See Section 12 for reasoning — the relationship story (human → mandate → agent → merchant) can be told just as clearly with a static diagram in the UI, and standing up a graph DB adds setup risk without adding anything judges can see live.

---

## 7. Build Order & Time Allocation (v2)

**Phase 0 — Risk check (do this FIRST, before writing product code, ≈5% of time)**
- Spin up a throwaway Razorpay test-mode Subscriptions/e-Mandate flow and confirm you can (a) create it, (b) retrieve a usable token, (c) charge against it programmatically, all within test mode. **This is the one component with real integration risk — validate it before committing the demo script to it.**
- If it's not smooth within an hour or two, fall back to Orders API immediately (see Section 11) — don't burn half your hackathon debugging a payment sandbox.

**Phase 1 — MVP (≈50% of time)**
- Mandate schema + financial gate function
- Buyer agent wired to catalog + Razorpay payment execution (Autopay if Phase 0 succeeded, Orders API otherwise)
- Ledger UI showing pass/block events live (hash-chaining can be added in Phase 2 if plain timestamped entries are faster to ship first)

**Phase 2 — Differentiators (≈30% of time)**
- Semantic gate (sentence-transformers + cosine similarity)
- Merchant pricing agent with ZOPA negotiation (hidden reserve price)
- Hash-chain the ledger entries + client-side verification display
- Scripted graceful failure (gate blocks → buyer agent proposes substitute)

**Phase 3 — Polish (≈15% of time, cut first if behind)**
- Mid-flow mandate top-up
- Dual-failure demo (one semantic block, one budget block)
- Purchase summary receipt with both gate scores shown

**Rule of thumb:** Phase 1 alone already satisfies every clause of "the bar." Phase 2 is what wins over judges — semantic gating and the hash chain are the two single features with the best novelty-to-effort ratio, build those before anything else in this phase. Phase 3 is what wins over *everyone else in the room*, but only attempt it once Phase 2 is demo-stable.

---

## 8. Demo Script (v2, 5 minutes, judged format)

1. **(0:00–0:45) The Setup:** Human types the mandate in natural language — *"Buy me high-quality hackathon survival gear, max ₹4,000."* Human completes a real Razorpay UPI Autopay test-mode authorization flow live on screen. Backend confirms the token is held.
2. **(0:45–2:15) The Negotiation:** Split-pane view — Buyer Agent on the left, Merchant Agent on the right. Buyer wants a mechanical keyboard + 3 energy drinks. Merchant Agent (holding a hidden reserve price) offers a bundle discount. They haggle live; the ledger streams every turn underneath.
3. **(2:15–3:00) The Double Gate:** Final cart is proposed. UI visibly pauses for both checks:
   - *Semantic check:* embedding similarity between "hackathon survival gear" and the proposed cart → **0.88, PASS**
   - *Financial check:* ₹3,800 ≤ remaining ₹4,000 → **PASS**
4. **(3:00–3:30) Execution & Ledger:** Gate passes, FastAPI triggers the Razorpay charge against the pre-authorized token. UI shows the new ledger entry's hash and visually confirms it chains correctly to the previous entry.
5. **(3:30–4:15) Graceful Failure (dual-mode):** Buyer Agent attempts a ₹500 mouse — gate blocks on *budget* (exceeds remaining funds). Buyer Agent gracefully proposes a cheaper alternative instead of failing silently. If time allows, show a second attempt blocked on *semantic mismatch* instead (e.g., proposing something unrelated to "hackathon survival gear") to prove both gates are real.
6. **(4:15–5:00) Close:** Point at the full ledger on screen: *"This is the entire financial and semantic reasoning of an autonomous agent — cryptographically chained, fully auditable, and executed on real Razorpay payment rails, end to end."*

---

## 9. One-Line Answers for Anticipated Judge Questions (v2)

- *"Why not let the LLM decide spending limits?"* → Because probabilistic systems shouldn't gate real money; the financial gate is deterministic code specifically to eliminate that risk.
- *"Why does the semantic gate use ML if the financial gate doesn't?"* → Different jobs need different tools. Matching *intent* to a fuzzy real-world request is inherently a semantic problem — string-matching "Wearables" against "Smartwatch" fails even when the human clearly meant yes. But *authorizing money* has no ambiguity to model — it's arithmetic, so it stays deterministic.
- *"How is this different from a normal checkout bot?"* → A checkout bot completes a transaction. MandateMart controls *delegated authority*, negotiates on the merchant's side with a hidden reserve price, and gates every action through both a semantic and financial check — it's agent-to-agent, not agent-to-storefront.
- *"Does this actually use Razorpay meaningfully?"* → Yes — the agent's spending power is a real Razorpay UPI Autopay/e-Mandate authorization, not a mock JSON limit; approved purchases draw against that live pre-authorized token.
- *"Is the audit trail actually tamper-proof, or just a nice UI?"* → Each ledger entry's hash includes the previous entry's hash. Altering any past entry breaks every hash after it — this can be demonstrated live by attempting to edit a past entry and showing the chain visibly break.
- *"Is this production-realistic?"* → The mandate/signature pattern mirrors how AP2/x402-style protocols and NPCI's UAP are already being framed — this is a working sketch of that emerging standard, not a toy, built on Razorpay's actual Subscriptions infrastructure.

---

## 10. Post-Hackathon Extension Ideas (mention briefly if asked "what's next")

- Real PKI-based mandate signing instead of HMAC, for multi-merchant trust
- Mandate marketplace — humans can grant mandates to third-party agents, not just their own
- Cross-merchant spend aggregation — one mandate spanning multiple agentic storefronts
- Fine-tuned (rather than off-the-shelf) embedding model for the semantic gate, trained on real merchant catalog language for better precision

---

## 11. Fallback Plan: If Razorpay Autopay Integration Proves Too Slow

UPI Autopay/e-Mandate flows can involve extra setup (sandbox bank auth, webhook verification) that isn't guaranteed to be fast in a time-boxed hackathon. If Phase 0's risk check shows this will eat too much time:

- **Fallback:** Use the Razorpay Orders API for actual payment execution (as in the v1 blueprint), but keep the *mandate concept* — the human still authorizes a spend limit up front through a real Razorpay Checkout flow (a small test authorization is enough to prove the "human authorizes, then agent spends within it" story), and every subsequent purchase still executes as a real test-mode order gated by both checks.
- This preserves most of the narrative ("real human authorization → gated autonomous spending") without the integration risk of the full Autopay/Subscriptions flow. Mention in the pitch that Autopay is the intended production path, and that Orders API is what you used to prove the concept within the time box — judges tend to respect honesty about scope more than a shaky live demo of something half-working.

## 12. Why Neo4j Was Considered and Dropped

A graph database is a genuinely reasonable way to model human → mandate → agent → merchant relationships. But for a 5-minute judged demo:

- Nothing a graph DB shows can't be shown just as clearly with a static relationship diagram in the UI, at zero backend setup cost.
- Standing up Neo4j adds infrastructure that can fail independently of the core demo, for a payoff judges won't see rendered live unless a graph visualization is specifically built — which is itself extra time.
- That time is better spent hardening the semantic gate and hash chain — the two features doing the most novelty work per minute invested.

If there's genuine spare time *after* Phase 3 is complete and demo-stable, it's a reasonable stretch add — but it should never come before the core gates or the negotiation mechanic.
