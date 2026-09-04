"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import RedTeamArena from "@/components/RedTeamArena";
import type { PassportData } from "@/components/TransactionPassport";

const TransactionPassport = dynamic(() => import("@/components/TransactionPassport"), { ssr: false });
const WarRoomTerminal = dynamic(() => import("@/components/WarRoomTerminal"), { ssr: false });
const NegotiationStoryboard = dynamic(() => import("@/components/NegotiationStoryboard"), { ssr: false });
import RevenueRescue from "@/components/RevenueRescue";

interface CatalogItem {
  product_id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  stock: number;
  bundle_rules: { min_qty: number; discount_pct: number }[];
}

interface Mandate {
  mandate_id: string;
  issued_to: string;
  intent_text: string;
  max_amount: number;
  spent_amount: number;
  razorpay_subscription_id?: string;
  razorpay_token_id?: string;
  issued_at: string;
  expires_at: string;
  signature: string;
}

interface LedgerEntry {
  seq: number;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
  gate_result: string | null;
  prev_hash: string;
  entry_hash: string;
}

interface VerifyResult {
  is_valid: boolean;
  total_entries: number;
  broken_at_seq?: number;
  reason?: string;
  status?: string;
}

interface Receipt {
  mandate_id: string;
  intent: string;
  total_authorized: number;
  total_spent: number;
  remaining_budget: number;
  subscription_id: string;
  token_id: string;
  signature_valid: boolean;
  signature: string;
  semantic_gate_score: string;
  financial_gate_audit: string;
  payment_confirmation: string;
  timestamp: string;
}

interface UpsellItem {
  offered: boolean;
  item: {
    product_id: string;
    name: string;
    price: number;
    description: string;
  };
  remaining_budget: number;
}

export default function Dashboard() {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [mandate, setMandate] = useState<Mandate | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [verifyStatus, setVerifyStatus] = useState<VerifyResult | null>(null);
  
  // Personas & Scenarios
  const [persona, setPersona] = useState<"personal" | "corporate">("personal");
  const [selectedScenario, setSelectedScenario] = useState<"standard" | "budget_fail" | "semantic_fail">("standard");
  const [intentText, setIntentText] = useState("Buy high-quality hackathon survival gear");
  const [maxAmount, setMaxAmount] = useState(4000);
  
  // UI states
  const [loadingMandate, setLoadingMandate] = useState(false);
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [verifyingChain, setVerifyingChain] = useState(false);
  const [tamperLoading, setTamperLoading] = useState(false);
  const [topupLoading, setTopupLoading] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [upsellItem, setUpsellItem] = useState<UpsellItem | null>(null);
  
  // Master Features: Kill Switch, Passport, War Room
  const [killSwitchActive, setKillSwitchActive] = useState(false);
  const [passportData, setPassportData] = useState<PassportData | null>(null);
  const [showWarRoom, setShowWarRoom] = useState(false);
  const [showRevenue, setShowRevenue] = useState(false);
  const [settlementStatus, setSettlementStatus] = useState<"none" | "pending" | "settled">("none");
  const [isListening, setIsListening] = useState(false);
  const [foreignAgentDetected, setForeignAgentDetected] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<"STORYBOARD" | "SPLIT" | "LEDGER">("SPLIT");

  const startVoiceInput = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input requires Chrome or Edge browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIntentText(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const ledgerEndRef = useRef<HTMLDivElement>(null);
  const ledgerScrollRef = useRef<HTMLDivElement>(null);

  const fetchCatalog = () => {
    fetch("http://localhost:8000/api/catalog")
      .then(res => res.json())
      .then(data => setCatalog(data))
      .catch(err => console.error("Catalog fetch error:", err));
  };

  const verifyLedger = async () => {
    setVerifyingChain(true);
    try {
      const res = await fetch("http://localhost:8000/api/ledger/verify");
      const data = await res.json();
      setVerifyStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setVerifyingChain(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
    verifyLedger();

    const eventSource = new EventSource("http://localhost:8000/api/ledger");
    eventSource.onmessage = (event) => {
      try {
        const data: LedgerEntry = JSON.parse(event.data);
        setLedger(prev => {
          if (!prev.find(e => e.seq === data.seq)) {
            const next = [...prev, data];
            return next.sort((a, b) => a.seq - b.seq);
          }
          return prev;
        });

        if (data.actor && (data.actor.includes("external") || data.detail?.includes("external"))) {
          setForeignAgentDetected(true);
          setTimeout(() => setForeignAgentDetected(false), 15000);
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    return () => eventSource.close();
  }, [mandate?.mandate_id]);

  useEffect(() => {
    // Scroll only the ledger container, not the whole page
    if (ledgerScrollRef.current) {
      ledgerScrollRef.current.scrollTop = ledgerScrollRef.current.scrollHeight;
    }
    verifyLedger();
  }, [ledger.length]);

  const selectPersona = (p: "personal" | "corporate") => {
    setPersona(p);
    if (p === "personal") {
      setIntentText("Buy high-quality hackathon survival gear and energy drinks");
      setMaxAmount(4000);
    } else {
      setIntentText("Corporate IT Procurement: Developer keyboards and GaN power chargers only");
      setMaxAmount(6000);
    }
  };

  const selectScenario = (type: "standard" | "budget_fail" | "semantic_fail") => {
    setSelectedScenario(type);
    if (type === "standard") {
      setIntentText(persona === "corporate" ? "Enterprise IT equipment and accessories" : "Buy high-quality hackathon survival gear");
      setMaxAmount(persona === "corporate" ? 6000 : 4000);
    } else if (type === "budget_fail") {
      setIntentText("Equip me with pro developer workstation hardware");
      setMaxAmount(3000);
    } else if (type === "semantic_fail") {
      setIntentText("Buy developer coding gear and energy drinks");
      setMaxAmount(4000);
    }
  };

  const issueMandate = async () => {
    setLoadingMandate(true);
    setUpsellItem(null);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);
    
    try {
      const res = await fetch("http://localhost:8000/api/mandate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent_text: intentText,
          max_amount: maxAmount,
          expires_at: expiresAt.toISOString()
        })
      });
      const data = await res.json();
      setMandate(data);
      setKillSwitchActive(false);
      verifyLedger();
    } catch (e: unknown) {
      alert("Failed to issue mandate: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoadingMandate(false);
    }
  };

  const handleTopUp = async () => {
    if (!mandate) return;
    setTopupLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/mandate/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mandate_id: mandate.mandate_id,
          topup_amount: 1500
        })
      });
      const data = await res.json();
      setMandate(data);
      verifyLedger();
    } finally {
      setTopupLoading(false);
    }
  };

  const triggerAgent = async () => {
    if (!mandate) {
      alert("Please authorize a mandate first!");
      return;
    }
    setLoadingAgent(true);
    setUpsellItem(null);
    try {
      await fetch("http://localhost:8000/api/agent/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mandate_id: mandate.mandate_id,
          scenario: selectedScenario
        })
      });
      verifyLedger();
      await fetchReceipt(mandate.mandate_id);
      await triggerUpsellHook(mandate.mandate_id);
      setSettlementStatus("pending");
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoadingAgent(false);
    }
  };

  const triggerUpsellHook = async (mndId: string) => {
    if (!mndId) return;
    try {
      const res = await fetch("http://localhost:8000/api/agent/upsell", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mandate_id: mndId })
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.offered) {
        setUpsellItem(data);
      }
    } catch (e) {
      console.warn("Non-fatal upsell hook notice:", e);
    }
  };

  const fetchReceipt = async (mndId: string) => {
    try {
      const res = await fetch(`http://localhost:8000/api/mandate/${mndId}/receipt`);
      const data = await res.json();
      setReceipt(data);
    } catch (e) {
      console.error(e);
    }
  };

  const triggerKillSwitch = async () => {
    const nonce = mandate?.mandate_id || "ALL_ACTIVE_AGENTS";
    try {
      await fetch(`http://localhost:8000/api/mandate/kill-switch/${nonce}`, { method: "POST" });
      setKillSwitchActive(true);
      await verifyLedger();
    } catch (e: unknown) {
      console.error(e);
    }
  };

  const openPassport = async () => {
    const targetId = mandate?.mandate_id || (receipt ? receipt.mandate_id : null);
    if (!targetId) {
      alert("Authorize a mandate or run a transaction first!");
      return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/mandate/${targetId}/passport-data`);
      const data = await res.json();
      setPassportData(data);
    } catch (e: unknown) {
      console.error(e);
    }
  };

  const simulateTamper = async () => {
    setTamperLoading(true);
    try {
      await fetch("http://localhost:8000/api/ledger/tamper", { method: "POST" });
      await verifyLedger();
    } finally {
      setTamperLoading(false);
    }
  };

  const resetAll = async () => {
    if (!confirm("Reset audit ledger and test mandates?")) return;
    await fetch("http://localhost:8000/api/ledger/reset", { method: "POST" });
    setMandate(null);
    setLedger([]);
    setReceipt(null);
    setUpsellItem(null);
    setKillSwitchActive(false);
    await verifyLedger();
  };

  const spendPct = mandate ? Math.min(100, (mandate.spent_amount / mandate.max_amount) * 100) : 0;

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-sans relative overflow-hidden">

      {/* Animated Background Glow */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/[.07] blur-[120px] animate-pulse" />
        <div className="absolute -bottom-60 -right-60 w-[500px] h-[500px] rounded-full bg-purple-600/[.06] blur-[100px]" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-emerald-600/[.03] blur-[160px]" />
      </div>

      <div className="relative z-10 p-4 md:p-8">

        {/* Foreign Agent Detected Alert Banner */}
        {foreignAgentDetected && (
          <div className="max-w-7xl mx-auto w-full bg-amber-500/20 border border-amber-500 rounded-xl p-4 mb-6 animate-pulse shadow-lg shadow-amber-500/10">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <div className="text-amber-400 font-bold text-base md:text-lg">FOREIGN AGENT DETECTED</div>
                <div className="text-amber-300 text-xs md:text-sm font-mono">
                  External AI buyer transacting via A2A Commerce Manifest — No UI involved
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──────────── TOP HEADER ──────────── */}
        <header className="max-w-7xl mx-auto mb-6 pb-6 border-b border-zinc-800/60 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 animate-fade-in-up">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-2.5 py-1 text-[10px] font-bold rounded-md bg-indigo-500/15 text-indigo-400 border border-indigo-500/25 tracking-wider uppercase">
                Track 01 — AI Growth & Agentic Commerce
              </span>
              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-zinc-800/80 text-zinc-500 border border-zinc-700/50">
                v2.0 Merkle
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mt-2">
              Mandate<span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Mart</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-1.5 max-w-2xl leading-relaxed">
              Delegated Spend Agents with <span className="text-zinc-300 font-medium">Double-Gated Spending</span>,{" "}
              <span className="text-zinc-300 font-medium">ZOPA Multi-Agent Negotiation</span>, and a{" "}
              <span className="text-zinc-300 font-medium">Cryptographic SHA-256 Merkle Ledger</span> on real Razorpay rails.
            </p>
          </div>

          {/* Live Badges & Master Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* KILL SWITCH */}
            <button
              onClick={triggerKillSwitch}
              disabled={killSwitchActive}
              className={`group px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 shadow-lg flex items-center gap-2 ${
                killSwitchActive
                  ? "bg-rose-950/80 border border-rose-500/60 text-rose-300 cursor-not-allowed"
                  : "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-rose-900/40 hover:shadow-rose-800/50 hover:scale-[1.02]"
              }`}
            >
              <span className={`text-sm ${!killSwitchActive ? "animate-pulse" : ""}`}>🚨</span>
              <span>{killSwitchActive ? "PASSPORT REVOKED" : "KILL SWITCH"}</span>
            </button>

            {/* WAR ROOM */}
            <button
              onClick={() => setShowWarRoom(true)}
              className="group px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/50 hover:border-emerald-500/50 text-xs font-mono font-bold flex items-center gap-2 transition-all duration-200 hover:scale-[1.02]"
            >
              <span>👁️</span>
              <span>War Room</span>
            </button>

            {/* A2A MANIFEST */}
            <a
              href="http://localhost:8000/.well-known/agent.json"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/80 border border-zinc-700/50 text-xs font-mono text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/40 transition-all duration-200"
            >
              <span className="text-[10px]">🤖</span>
              <span>A2A Manifest</span>
            </a>

            {/* REVENUE RESCUE */}
            <button
              onClick={() => setShowRevenue(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-mono font-bold transition-all duration-200 hover:scale-[1.02] shadow-md shadow-emerald-950/40 border border-emerald-400/30"
            >
              <span>📈</span>
              <span>Revenue Rescue</span>
            </button>

            {/* RAZORPAY BADGE */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-zinc-400">Razorpay Test Rails</span>
            </div>

            {/* CHAIN STATUS */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono font-medium transition-all ${
              verifyStatus?.is_valid 
                ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-400"
                : "bg-red-950/50 border-red-500/60 text-red-300 animate-pulse"
            }`}>
              <div className={`w-2 h-2 rounded-full ${verifyStatus?.is_valid ? "bg-emerald-400" : "bg-red-400"}`} />
              {verifyStatus?.is_valid 
                ? `CHAIN VALID (${verifyStatus.total_entries} BLOCKS)`
                : `TAMPER DETECTED (BLOCK #${verifyStatus?.broken_at_seq})`
              }
            </div>

            {/* RESET */}
            <button
              onClick={resetAll}
              className="px-3 py-2 rounded-xl bg-zinc-900/60 border border-zinc-800/60 text-xs font-medium text-zinc-500 hover:text-white hover:border-zinc-600 transition-all duration-200"
            >
              Reset
            </button>
          </div>
        </header>

        {/* Emergency Kill Switch Banner */}
        {killSwitchActive && (
          <div className="max-w-7xl mx-auto mb-5 p-4 bg-rose-950/70 border-2 border-rose-500/60 rounded-2xl text-rose-200 text-xs font-mono flex items-center justify-between shadow-2xl shadow-rose-950/30 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-pulse">🚨</span>
              <div>
                <strong className="font-bold text-white uppercase tracking-wide">HUMAN KILL SWITCH ENGAGED</strong>
                <span className="ml-2 text-rose-300/90">
                  Active Ed25519 agent passport has been revoked. All incoming agent transactions will be rejected by the Double Gate.
                </span>
              </div>
            </div>
            <button
              onClick={() => setKillSwitchActive(false)}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-700 text-zinc-200 hover:text-white text-xs font-bold transition"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* ──────────── PERSONA BAR ──────────── */}
        <div className="max-w-7xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 p-3.5 glass-card animate-fade-in-up delay-75">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Persona</span>
            <div className="flex gap-1 bg-zinc-950/80 p-1 rounded-lg border border-zinc-800/60">
              <button
                onClick={() => selectPersona("personal")}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  persona === "personal"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                🧑 Personal Shopper
              </button>
              <button
                onClick={() => selectPersona("corporate")}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                  persona === "corporate"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                🏢 Corporate IT
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {mandate && (
              <button
                onClick={openPassport}
                className="group px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 hover:from-indigo-600/50 hover:to-purple-600/50 border border-indigo-400/40 text-indigo-200 text-xs font-bold flex items-center gap-2 transition-all duration-200 shadow hover:shadow-lg hover:shadow-indigo-500/10 hover:scale-[1.02]"
              >
                <span>🛡️</span>
                <span>Transaction Passport</span>
              </button>
            )}

            {receipt && (
              <button
                onClick={() => setShowReceipt(true)}
                className="px-4 py-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-xs font-bold flex items-center gap-2 transition-all duration-200"
              >
                <span>📄</span>
                <span>Audit Summary</span>
              </button>
            )}
          </div>
        </div>

        {/* ──────────── MAIN GRID ──────────── */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* ═══ LEFT COLUMN (5 cols) ═══ */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Preset Scenario Selector */}
            <div className="glass-card p-5 shadow-xl animate-fade-in-up delay-150">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3 flex items-center justify-between">
                <span>Demo Scenarios</span>
                <span className="text-indigo-400 font-mono">1-Click Presets</span>
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: "standard" as const, label: "Happy Path", sub: "ZOPA + Double Gate", color: "indigo" },
                  { key: "budget_fail" as const, label: "Budget Fail", sub: "Gate Blocks & Recovers", color: "amber" },
                  { key: "semantic_fail" as const, label: "Semantic Fail", sub: "Intent Mismatch Block", color: "purple" },
                ].map(s => (
                  <button
                    key={s.key}
                    onClick={() => selectScenario(s.key)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all duration-200 ${
                      selectedScenario === s.key
                        ? `bg-${s.color}-600/15 border-${s.color}-500/60 text-white font-semibold ring-1 ring-${s.color}-500/20`
                        : "bg-zinc-950/50 border-zinc-800/60 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                    }`}
                  >
                    <div className="font-bold text-[11px]">{s.label}</div>
                    <div className="text-[9px] text-zinc-500 mt-1 truncate">{s.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Mandate Authorization Card */}
            <div className="glass-card p-6 shadow-xl space-y-4 animate-fade-in-up delay-200">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-[10px] flex items-center justify-center font-mono shadow-md shadow-indigo-500/20">1</span>
                  Human Mandate Leash
                </h2>
                <span className="text-[10px] font-mono text-zinc-600 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">Ed25519 Signed</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Natural-Language Intent
                </label>
                <div className="flex items-start gap-2">
                  <textarea
                    value={intentText}
                    onChange={(e) => setIntentText(e.target.value)}
                    rows={2}
                    className="w-full bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all text-zinc-100 resize-none"
                  />
                  <button
                    type="button"
                    onClick={startVoiceInput}
                    disabled={isListening}
                    className={`shrink-0 px-3.5 py-3 rounded-xl font-bold text-xs text-white transition-all flex items-center gap-1.5 shadow-md ${
                      isListening
                        ? "bg-red-600 animate-pulse shadow-lg shadow-red-500/50 border border-red-400"
                        : "bg-indigo-600 hover:bg-indigo-500 border border-indigo-500/40"
                    }`}
                    title="Speak your mandate intent"
                  >
                    {isListening ? "🔴 Listening..." : "🎙️ Speak"}
                  </button>
                </div>
                {isListening && (
                  <div className="mt-2 text-red-400 text-xs font-mono animate-pulse flex items-center gap-1.5">
                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    ● Recording voice input... speak your mandate now
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                  Spend Limit Hard Cap (₹)
                </label>
                <input
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(Number(e.target.value))}
                  className="w-full bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all text-zinc-100 font-mono"
                />
              </div>

              <button
                onClick={issueMandate}
                disabled={loadingMandate}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/15 disabled:opacity-50 text-sm hover:scale-[1.01] active:scale-[0.99]"
              >
                {loadingMandate ? "Signing & Authorizing..." : "🔏 Authorize Spend Mandate"}
              </button>

              {mandate && (
                <div className="p-4 bg-zinc-950/60 border border-zinc-800/50 rounded-xl space-y-2.5 font-mono text-xs animate-fade-in">
                  <div className="flex justify-between text-zinc-400">
                    <span>Mandate ID:</span>
                    <span className="text-indigo-400 font-bold">{mandate.mandate_id}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>UPI Autopay Token:</span>
                    <span className="text-zinc-300 truncate max-w-[140px]">{mandate.razorpay_token_id || "tok_autopay_mock"}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Spend Budget:</span>
                    <span className="text-white font-bold">₹{mandate.spent_amount} / ₹{mandate.max_amount}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-zinc-900/80 rounded-full h-2 overflow-hidden">
                    <div 
                      className="h-full transition-all duration-700 ease-out rounded-full"
                      style={{ 
                        width: `${spendPct}%`,
                        background: spendPct > 80 
                          ? "linear-gradient(90deg, #ef4444, #f97316)" 
                          : "linear-gradient(90deg, #6366f1, #8b5cf6)"
                      }}
                    />
                  </div>

                  {/* Top Up Button */}
                  <div className="pt-2 border-t border-zinc-800/50 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-600">Need more spend limit?</span>
                    <button
                      onClick={handleTopUp}
                      disabled={topupLoading}
                      className="px-3 py-1.5 rounded-lg bg-indigo-950/50 hover:bg-indigo-900/60 border border-indigo-800/50 text-indigo-300 text-[11px] font-bold transition-all flex items-center gap-1.5"
                    >
                      {topupLoading ? "Topping up..." : "+₹1,500 Top-Up"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Agent Action Box */}
            <div className="glass-card p-6 shadow-xl space-y-4 animate-fade-in-up delay-300">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-white text-[10px] flex items-center justify-center font-mono shadow-md shadow-indigo-500/20">2</span>
                  Autonomous Agent Execution
                </h2>
                {loadingAgent && (
                  <span className="text-xs font-mono text-indigo-400 flex items-center gap-1.5 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    Haggling...
                  </span>
                )}
              </div>

              <p className="text-[11px] text-zinc-500 leading-relaxed">
                Buyer Agent queries the merchant catalog, autonomously bargains with the Merchant Pricing Agent within ZOPA, and passes the cart through the Double Gate before drawing from Razorpay test rails.
              </p>

              <button
                onClick={triggerAgent}
                disabled={!mandate || loadingAgent}
                className="w-full py-3.5 px-4 bg-white text-zinc-950 hover:bg-zinc-100 font-bold rounded-xl transition-all shadow-lg shadow-white/5 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm hover:scale-[1.01] active:scale-[0.99]"
              >
                {loadingAgent ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-zinc-950" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Autonomous Haggling in Progress...
                  </>
                ) : (
                  "⚡ Launch Autonomous Agent Haggling"
                )}
              </button>
            </div>

            {/* Post-Purchase Upsell Card */}
            {upsellItem && (
              <div className="p-4 bg-gradient-to-r from-purple-950/30 to-zinc-900/50 border border-purple-500/30 rounded-2xl space-y-2 animate-fade-in glass-card">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-purple-500/15 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                    Post-Purchase Upsell Hook
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">Remaining Leash: ₹{upsellItem.remaining_budget}</span>
                </div>
                <h4 className="text-sm font-bold text-white">{upsellItem.item.name}</h4>
                <p className="text-[11px] text-zinc-400">{upsellItem.item.description}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-bold text-emerald-400 font-mono">₹{upsellItem.item.price}</span>
                  <span className="text-[10px] text-zinc-600">Logged to Audit Chain</span>
                </div>
              </div>
            )}

            {/* Razorpay Webhook Settlement Simulator Block */}
            {settlementStatus === "pending" && (
              <div className="bg-amber-950/30 border border-amber-500/40 rounded-2xl p-5 space-y-3 shadow-lg shadow-amber-950/20 animate-fade-in glass-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">⏳</span>
                    <span className="text-amber-400 font-bold text-xs font-mono uppercase tracking-wider">PENDING SETTLEMENT</span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-300/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Awaiting Webhook
                  </span>
                </div>
                <div className="text-zinc-400 text-xs leading-relaxed">
                  Razorpay test order executed. Awaiting asynchronous webhook confirmation for cryptographic settlement into Merkle Ledger.
                </div>
                <button
                  onClick={async () => {
                    try {
                      const mId = mandate?.mandate_id || "demo_mandate";
                      const res = await fetch(`http://localhost:8000/api/webhooks/simulate/${mId}`, {
                        method: "POST"
                      });
                      const data = await res.json();
                      if (data.status === "WEBHOOK_DELIVERED_AND_VERIFIED") {
                        setSettlementStatus("settled");
                        verifyLedger();
                      }
                    } catch (e) { console.error(e); }
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-amber-950/50 text-xs flex items-center justify-center gap-2"
                >
                  <span>🔔</span>
                  <span>Deliver Razorpay Webhook (Simulate Settlement)</span>
                </button>
              </div>
            )}

            {settlementStatus === "settled" && (
              <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-5 space-y-1.5 animate-pulse shadow-lg shadow-emerald-950/20 glass-card">
                <div className="flex items-center gap-2">
                  <span className="text-base">✅</span>
                  <span className="text-emerald-400 font-bold text-xs font-mono tracking-wider uppercase">CRYPTOGRAPHICALLY SETTLED</span>
                </div>
                <div className="text-zinc-400 text-xs leading-relaxed">
                  Razorpay webhook received, HMAC-SHA256 verified over HTTP, settlement recorded in Merkle Ledger.
                </div>
              </div>
            )}

            {/* Red Team Arena */}
            <RedTeamArena />

            {/* Merchant Catalog */}
            <div className="glass-card p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
                <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                  🏪 Merchant Live Catalog
                </h3>
                <span className="text-[10px] text-zinc-600 font-mono">
                  {catalog.length} Products
                </span>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                {catalog.map(item => (
                  <div key={item.product_id} className="p-3 bg-zinc-950/50 border border-zinc-800/40 rounded-xl flex items-start justify-between gap-3 text-xs hover:border-zinc-700/50 transition-all duration-200">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-200 truncate">{item.name}</span>
                        <span className="shrink-0 px-1.5 py-0.5 rounded bg-zinc-800/80 text-[9px] text-zinc-500 uppercase font-medium">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-zinc-600 text-[10px] line-clamp-2">{item.description}</p>
                      {item.bundle_rules?.length > 0 && (
                        <span className="inline-block px-1.5 py-0.5 rounded bg-purple-950/40 border border-purple-800/30 text-[9px] text-purple-400">
                          Bundle: {item.bundle_rules[0].discount_pct}% off on {item.bundle_rules[0].min_qty}+ units
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono font-bold text-emerald-400 text-sm">₹{item.price}</span>
                      <div className="text-[9px] text-zinc-600 mt-0.5">Stock: {item.stock}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══ RIGHT COLUMN — STORYBOARD & LEDGER (7 cols) ═══ */}
          <div className="lg:col-span-7 flex flex-col space-y-4">

            {/* Split View Tabs */}
            <div className="flex items-center justify-between bg-zinc-900/90 px-3 py-2 rounded-xl border border-zinc-800 shadow-md">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRightPanelTab("STORYBOARD")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    rightPanelTab === "STORYBOARD"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span>💬</span>
                  <span>A2A Storyboard</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab("SPLIT")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    rightPanelTab === "SPLIT"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span>⚡</span>
                  <span>Split View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab("LEDGER")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    rightPanelTab === "LEDGER"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span>⛓️</span>
                  <span>Merkle Ledger</span>
                </button>
              </div>

              <div className="text-[10px] font-mono text-zinc-500 hidden sm:flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Autonomous A2A Protocol</span>
              </div>
            </div>

            {/* Storyboard Component (visible in STORYBOARD and SPLIT tabs) */}
            {(rightPanelTab === "STORYBOARD" || rightPanelTab === "SPLIT") && (
              <NegotiationStoryboard 
                entries={ledger} 
                className={rightPanelTab === "STORYBOARD" ? "h-[80vh]" : "max-h-96"} 
              />
            )}

            {/* Merkle Ledger (visible in LEDGER and SPLIT tabs) */}
            {(rightPanelTab === "LEDGER" || rightPanelTab === "SPLIT") && (
              <div className={`glass-card p-6 shadow-2xl flex flex-col ${rightPanelTab === "LEDGER" ? "h-[80vh]" : "h-[45vh]"} animate-fade-in-up delay-150`}>
            
            {/* Ledger Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-zinc-800/50 gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500" />
                  </span>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Cryptographic Audit Ledger
                  </h2>
                </div>
                <p className="text-[10px] text-zinc-600 font-mono mt-0.5 tracking-wide">
                  SHA-256 HASH CHAINED • TAMPER-EVIDENT • APPEND-ONLY
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={verifyLedger}
                  disabled={verifyingChain}
                  className="px-3.5 py-1.5 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition-all border border-zinc-700/60 flex items-center gap-1.5"
                >
                  {verifyingChain ? "Verifying..." : "🔗 Verify Chain"}
                </button>

                <button
                  onClick={simulateTamper}
                  disabled={tamperLoading || ledger.length === 0}
                  className="px-3.5 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold rounded-lg transition-all border border-rose-800/50 flex items-center gap-1.5"
                >
                  {tamperLoading ? "Mutating..." : "💀 Simulate Tamper"}
                </button>
              </div>
            </div>

            {/* Integrity Alert Banner */}
            {verifyStatus && !verifyStatus.is_valid && (
              <div className="my-3 p-3.5 bg-red-950/70 border-2 border-red-500/60 rounded-xl text-red-200 text-xs flex items-center gap-3 animate-pulse shadow-lg shadow-red-950/30">
                <span className="text-lg">🚨</span>
                <div>
                  <strong className="font-bold text-white">SECURITY ALERT: Cryptographic Chain Invalidation!</strong>
                  <p className="text-[11px] text-red-300/90 font-mono mt-0.5">{verifyStatus.reason}</p>
                </div>
              </div>
            )}

            {/* Ledger Stream */}
            <div ref={ledgerScrollRef} className="flex-1 overflow-y-auto space-y-3 pr-2 my-4 custom-scrollbar">
              {ledger.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-3">
                  <svg className="w-16 h-16 stroke-current opacity-20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-sm font-mono">Genesis ledger awaiting initialization...</p>
                  <p className="text-[10px] text-zinc-800">Authorize a mandate to begin the audit trail</p>
                </div>
              ) : (
                ledger.map((entry) => {
                  const isBuyer = entry.actor === "buyer_agent";
                  const isMerchant = entry.actor === "merchant_agent";
                  const isSemantic = entry.actor === "semantic_gate";
                  const isFinancial = entry.actor === "financial_gate";
                  const isRedTeam = entry.actor === "red_team" || entry.action.includes("ATTACK");
                  const isKillSwitch = entry.action === "KILL_SWITCH_ACTIVATED" || entry.action === "PASSPORT_REVOKED";

                  return (
                    <div
                      key={entry.seq}
                      className={`p-4 rounded-xl border font-mono text-xs transition-all relative group ${
                        isKillSwitch
                          ? "bg-rose-950/40 border-rose-500/50 text-rose-100 ring-1 ring-rose-500/20 shadow-md shadow-rose-950/20"
                        : isRedTeam
                          ? "bg-rose-950/25 border-rose-800/60 text-rose-100"
                        : entry.gate_result === "FAIL"
                          ? "bg-rose-950/20 border-rose-800/50 text-rose-100"
                        : entry.action === "TOPUP_LINK_GENERATED"
                          ? "bg-gradient-to-r from-amber-950/40 to-zinc-950 border-amber-500/60 text-amber-100 ring-1 ring-amber-500/30 shadow-md shadow-amber-950/30"
                        : entry.action === "PAYMENT_EXECUTED"
                          ? "bg-emerald-950/25 border-emerald-500/40 text-emerald-100 ring-1 ring-emerald-500/20"
                        : isMerchant
                          ? "bg-purple-950/15 border-purple-900/40 text-purple-200"
                        : isBuyer
                          ? "bg-blue-950/15 border-blue-900/40 text-blue-200"
                        : "bg-zinc-950/50 border-zinc-800/50 text-zinc-300"
                      }`}
                    >
                      {/* Header Row */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-800/80 text-zinc-500">
                            #{entry.seq < 10 ? `0${entry.seq}` : entry.seq}
                          </span>

                          <span className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isKillSwitch ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" :
                            isRedTeam ? "bg-rose-500/15 text-rose-400 border border-rose-500/25" :
                            entry.action === "TOPUP_LINK_GENERATED" ? "bg-amber-500/15 text-amber-300 border border-amber-500/30" :
                            isBuyer ? "bg-blue-500/15 text-blue-400 border border-blue-500/25" :
                            isMerchant ? "bg-purple-500/15 text-purple-400 border border-purple-500/25" :
                            isSemantic ? "bg-amber-500/15 text-amber-400 border border-amber-500/25" :
                            isFinancial ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25" :
                            "bg-zinc-800/60 text-zinc-400 border border-zinc-700/40"
                          }`}>
                            {entry.actor}
                          </span>

                          <span className="font-bold text-zinc-300 truncate">
                            [{entry.action}]
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {entry.gate_result && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider uppercase ${
                              entry.gate_result === "PASS"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            }`}>
                              {entry.gate_result === "PASS" ? "✓" : "✕"} {entry.gate_result}
                            </span>
                          )}
                          <span className="text-[10px] text-zinc-600">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      {/* Detail Body */}
                      {entry.action === "TOPUP_LINK_GENERATED" ? (
                        <div className="my-2 p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-2">
                          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                            <span className="text-base">💳</span>
                            <span>HUMAN-IN-THE-LOOP SHORTFALL TOP-UP REQUIRED</span>
                          </div>
                          <p className="text-zinc-300 text-xs leading-relaxed">
                            {entry.detail.split("Generated top-up payment link:")[0]}
                          </p>
                          {entry.detail.includes("https://rzp.io") && (
                            <div className="pt-1">
                              <a
                                href={entry.detail.match(/https:\/\/rzp\.io\/[^\s]+/)?.[0] || "#"}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition-all transform hover:scale-[1.02]"
                              >
                                <span>⚡</span>
                                <span>Open Razorpay Payment Link</span>
                                <span className="text-[9px] bg-zinc-950/20 px-1.5 py-0.5 rounded font-mono">Test Mode</span>
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-zinc-400 text-xs leading-relaxed mb-2.5">
                          {entry.detail}
                        </div>
                      )}

                      {/* Hash Footer */}
                      <div className="pt-2 border-t border-zinc-800/40 flex flex-wrap items-center justify-between text-[9px] text-zinc-600 gap-2">
                        <div className="flex items-center gap-1 truncate max-w-[48%]">
                          <span className="text-zinc-700">PREV:</span>
                          <span className="font-mono text-zinc-500 truncate">{entry.prev_hash}</span>
                        </div>
                        <div className="flex items-center gap-1 truncate max-w-[48%]">
                          <span className="text-zinc-700">HASH:</span>
                          <span className="font-mono text-indigo-400/80 truncate">{entry.entry_hash}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={ledgerEndRef} />
            </div>
          </div>
        )}

      </div>

        </div>
      </div>

      {/* ──────────── MODALS ──────────── */}

      {/* Receipt Modal */}
      {showReceipt && receipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-700/60 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">🧾</span>
                <h3 className="font-bold text-white text-base">Multi-Agent Transaction Receipt</h3>
              </div>
              <button 
                onClick={() => setShowReceipt(false)}
                className="text-zinc-400 hover:text-white text-sm px-2.5 py-1 rounded-lg bg-zinc-800 transition"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-zinc-950/80 rounded-xl space-y-1.5 border border-zinc-800/60">
                <div className="text-zinc-400">Mandate: <span className="text-indigo-400 font-bold">{receipt.mandate_id}</span></div>
                <div className="text-zinc-400">Intent: <span className="text-zinc-200">{receipt.intent}</span></div>
                <div className="text-zinc-400">UPI Token: <span className="text-zinc-300">{receipt.token_id || "N/A"}</span></div>
              </div>

              <div className="p-3 bg-zinc-950/80 rounded-xl space-y-1.5 border border-zinc-800/60">
                <div className="text-zinc-400">Authorized Cap: <span className="text-white font-bold">₹{receipt.total_authorized}</span></div>
                <div className="text-zinc-400">Final Settled Amount: <span className="text-emerald-400 font-bold">₹{receipt.total_spent}</span></div>
                <div className="text-zinc-400">Remaining Budget: <span className="text-indigo-300 font-bold">₹{receipt.remaining_budget}</span></div>
              </div>

              <div className="p-3 bg-zinc-950/80 rounded-xl space-y-1.5 border border-zinc-800/60">
                <div className="text-zinc-400">Semantic Gate: <span className="text-amber-400">{receipt.semantic_gate_score}</span></div>
                <div className="text-zinc-400">Financial Gate: <span className="text-emerald-400">{receipt.financial_gate_audit}</span></div>
              </div>

              <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/30 text-emerald-300 space-y-1">
                <div className="font-bold">✓ Execution: VERIFIED & CHARGED</div>
                <div className="text-[11px] text-zinc-300">{receipt.payment_confirmation}</div>
              </div>

              <div className="text-[10px] text-zinc-600 truncate">
                Ed25519 Signature: {receipt.signature}
              </div>
            </div>

            <button
              onClick={() => setShowReceipt(false)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Transaction Passport Modal */}
      {passportData && (
        <TransactionPassport data={passportData} onClose={() => setPassportData(null)} />
      )}

      {/* War Room Terminal Modal */}
      {showWarRoom && (
        <WarRoomTerminal entries={ledger} onClose={() => setShowWarRoom(false)} />
      )}

      {/* Revenue Rescue Command Center Modal */}
      <RevenueRescue isOpen={showRevenue} onClose={() => setShowRevenue(false)} />
    </main>
  );
}
