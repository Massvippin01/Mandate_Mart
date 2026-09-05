"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Rocket, 
  Network, 
  ScrollText, 
  Swords, 
  BarChart3, 
  Store,
  Siren,
  TrendingUp,
  Mic,
  ShieldCheck,
  Bell,
  TerminalSquare,
  Bot,
  CreditCard,
  Link2,
  Zap,
  Lock,
  CheckCircle2,
  XCircle,
  Loader2,
  Hexagon,
  RefreshCw,
  AlertTriangle,
  User,
  Building2,
  Copy,
  Check
} from "lucide-react";
import RedTeamArena from "@/components/RedTeamArena";
import type { PassportData } from "@/components/TransactionPassport";
import RevenueRescue from "@/components/RevenueRescue";
import { Panel, PanelHeader, Badge, Button } from "@/components/ui/primitives";
import { NumberTicker } from "@/components/magicui/number-ticker";
import { BorderBeam } from "@/components/magicui/border-beam";
import { DotPattern } from "@/components/magicui/dot-pattern";

import TransactionPassport from "@/components/TransactionPassport";
import WarRoomTerminal from "@/components/WarRoomTerminal";
import NegotiationStoryboard from "@/components/NegotiationStoryboard";
import ProtocolTopology from "@/components/ProtocolTopology";

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
  
  // Navigation & Tab State
  const [activeTab, setActiveTab] = useState("mission");

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
  const [awaitingWebhook, setAwaitingWebhook] = useState(false);
  const [awaitingSeconds, setAwaitingSeconds] = useState(0);
  const [liveSettledSource, setLiveSettledSource] = useState<string | null>(null);
  const [lastCheckoutData, setLastCheckoutData] = useState<{ key_id: string; order_id: string; amount?: number } | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [paymentDismissed, setPaymentDismissed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isListeningLimit, setIsListeningLimit] = useState(false);
  const [limitFeedback, setLimitFeedback] = useState<string | null>(null);
  const [foreignAgentDetected, setForeignAgentDetected] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState<"STORYBOARD" | "SPLIT" | "LEDGER">("SPLIT");

  const parseSpokenAmount = (text: string): number | null => {
    if (!text) return null;
    const clean = text.toLowerCase().replace(/,/g, "").trim();

    // Pattern 1: Shorthand like "4k", "3.5k", "5k"
    const kMatch = clean.match(/(\d+(?:\.\d+)?)\s*k\b/);
    if (kMatch) {
      const val = parseFloat(kMatch[1]) * 1000;
      if (!isNaN(val) && val > 0) return Math.round(val);
    }

    // Pattern 2: Explicit digits like "3500", "4000 rupees", "₹4500", "limit of 5000"
    const digitMatch = clean.match(/(?:(?:rs\.?|inr|₹|limit|budget|cap|under|upto|maximum|max)\s*)?(\d{2,7})/);
    if (digitMatch && digitMatch[1]) {
      const val = parseInt(digitMatch[1], 10);
      if (!isNaN(val) && val > 0) return val;
    }

    // Pattern 3: Spoken English words
    const wordMap: Record<string, number> = {
      zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
      ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
      seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50,
      sixty: 60, seventy: 70, eighty: 80, ninety: 90
    };

    const words = clean.split(/[\s-]+/);
    let total = 0;
    let current = 0;
    let foundNumber = false;

    for (const w of words) {
      if (wordMap[w] !== undefined) {
        current += wordMap[w];
        foundNumber = true;
      } else if (w === "hundred") {
        current = (current || 1) * 100;
        foundNumber = true;
      } else if (w === "thousand") {
        total += (current || 1) * 1000;
        current = 0;
        foundNumber = true;
      } else if (w === "lakh") {
        total += (current || 1) * 100000;
        current = 0;
        foundNumber = true;
      }
    }
    total += current;
    if (foundNumber && total > 0) return total;

    return null;
  };

  const handleCopy = (text: string, field: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const loadRazorpayScript = () => {
    return new Promise<boolean>((resolve) => {
      if (typeof window === "undefined") return resolve(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).Razorpay) return resolve(true);

      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]') as HTMLScriptElement | null;
      if (existing) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((window as any).Razorpay) return resolve(true);
        existing.addEventListener("load", () => resolve(true));
        let tries = 0;
        const interval = setInterval(() => {
          tries++;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((window as any).Razorpay) {
            clearInterval(interval);
            resolve(true);
          } else if (tries > 25) {
            clearInterval(interval);
            resolve(false);
          }
        }, 100);
        return;
      }

      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.async = true;
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onPaymentSuccess = (res: any) => {
    console.log("Razorpay payment success in modal:", res);
    setPaymentResult(res);
    setPaymentDismissed(false);
    setAwaitingWebhook(true);
    setSettlementStatus("pending");
  };

  const onPaymentDismissed = () => {
    console.log("Razorpay modal dismissed");
    if (!paymentResult) {
      setPaymentDismissed(true);
    }
  };

  const openRazorpayModal = async (key_id: string, order_id: string, amountPaise?: number) => {
    await loadRazorpayScript();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Razorpay = (window as any).Razorpay;
    if (!Razorpay) {
      alert("Razorpay checkout SDK failed to load. Please check your network connection.");
      return;
    }

    setPaymentDismissed(false);

    const finalAmount = amountPaise || (lastCheckoutData?.amount ? lastCheckoutData.amount * 100 : 330000);

    const options = {
      key: key_id,
      order_id: order_id,
      amount: finalAmount,
      name: "MandateMart",
      description: "Agentic Commerce Settlement",
      currency: "INR",
      prefill: {
        name: "Buyer Agent",
        email: "agent@mandatemart.dev",
        contact: "9999999999"
      },
      config: {
        display: {
          blocks: {
            upi_block: {
              name: "Pay via UPI",
              instruments: [
                { method: "upi" }
              ]
            },
            other_block: {
              name: "Cards, Netbanking & Wallets",
              instruments: [
                { method: "card" },
                { method: "netbanking" },
                { method: "wallet" }
              ]
            }
          },
          sequence: ["block.upi_block", "block.other_block"],
          preferences: {
            show_default_blocks: true
          }
        }
      },
      theme: { color: "#7c3aed" },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handler: (res: any) => onPaymentSuccess(res),
      modal: { ondismiss: () => onPaymentDismissed() }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  };

  // Direct checkout modal handler (immune to popup blocker suppression)
  const handleDirectCheckoutModal = async () => {
    if (!mandate) {
      alert("Please authorize a mandate first!");
      return;
    }
    await loadRazorpayScript();
    
    let orderId = lastCheckoutData?.order_id;
    let orderAmount = lastCheckoutData?.amount;
    const keyId = lastCheckoutData?.key_id || "rzp_test_TXFpUQHw5s9KNT";

    if (!orderId) {
      try {
        const res = await fetch("http://localhost:8000/api/agent/buy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mandate_id: mandate.mandate_id,
            scenario: selectedScenario
          })
        });
        const data = await res.json();
        if (data && typeof data.order_id === "string") {
          orderId = data.order_id;
          orderAmount = typeof data.amount === "number" ? data.amount : undefined;
          setLastCheckoutData({ key_id: data.key_id || keyId, order_id: data.order_id, amount: orderAmount });
        }
      } catch (err) {
        console.error("Direct checkout order error:", err);
      }
    }

    if (orderId) {
      await openRazorpayModal(keyId, orderId, orderAmount ? orderAmount * 100 : undefined);
    } else {
      alert("Could not initialize Razorpay order. Ensure backend on port 8000 is running.");
    }
  };

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  useEffect(() => {
    if (!awaitingWebhook || settlementStatus === "settled") return;

    const timer = setInterval(() => {
      setAwaitingSeconds((s) => s + 1);
    }, 1000);

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:8000/api/webhooks/last");
        if (!res.ok) return;
        const last = await res.json();
        if (last && last.verified === true && typeof last.event === "string" && last.event.includes("payment")) {
          setSettlementStatus("settled");
          setAwaitingWebhook(false);
          setLiveSettledSource(last.source || "RAZORPAY_LIVE");
          verifyLedger();
        }
      } catch (err) {
        console.warn("Webhook polling error:", err);
      }
    }, 2000);

    return () => {
      clearInterval(timer);
      clearInterval(pollInterval);
    };
  }, [awaitingWebhook, settlementStatus]);

  // Voice Speech-to-Text for Natural-Language Intent (with Omni-Budget Parsing)
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

      // Omni-speech parsing: check if speech contains budget/limit keywords
      const budgetMatch = transcript.match(/(?:under|upto|budget of|limit of|limit|max of|maximum|max)\s*([₹\d\w\s]+?)(?:rupees|rs|inr|$)/i);
      if (budgetMatch && budgetMatch[1]) {
        const parsed = parseSpokenAmount(budgetMatch[1]);
        if (parsed && parsed > 0) {
          setMaxAmount(parsed);
          setLimitFeedback(`🎙️ Auto-detected limit: ₹${parsed.toLocaleString("en-IN")}`);
          setTimeout(() => setLimitFeedback(null), 3500);

          const cleanedIntent = transcript.replace(budgetMatch[0], "").trim();
          setIntentText(cleanedIntent || transcript);
          setIsListening(false);
          return;
        }
      }

      setIntentText(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // Dedicated Voice Speech-to-Text for Spend Limit Hard Cap
  const startLimitVoiceInput = () => {
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

    setIsListeningLimit(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      const parsed = parseSpokenAmount(transcript);
      if (parsed && parsed > 0) {
        setMaxAmount(parsed);
        setLimitFeedback(`🎙️ Set to ₹${parsed.toLocaleString("en-IN")}`);
        setTimeout(() => setLimitFeedback(null), 3500);
      } else {
        setLimitFeedback(`Could not parse amount from "${transcript}"`);
        setTimeout(() => setLimitFeedback(null), 3500);
      }
      setIsListeningLimit(false);
    };

    recognition.onerror = () => setIsListeningLimit(false);
    recognition.onend = () => setIsListeningLimit(false);
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
    setActiveTab("mission");
    setLoadingAgent(true);
    setUpsellItem(null);
    setAwaitingWebhook(false);
    setAwaitingSeconds(0);
    setLiveSettledSource(null);
    setSettlementStatus("none");
    setPaymentResult(null);
    setPaymentDismissed(false);

    try {
      const res = await fetch("http://localhost:8000/api/agent/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mandate_id: mandate.mandate_id,
          scenario: selectedScenario
        })
      });
      const data = await res.json();

      verifyLedger();
      await fetchReceipt(mandate.mandate_id);
      await triggerUpsellHook(mandate.mandate_id);

      if (data && data.order_id && data.key_id) {
        const amt = typeof data.amount === "number" ? data.amount : undefined;
        setLastCheckoutData({ key_id: data.key_id, order_id: data.order_id, amount: amt });
        await openRazorpayModal(data.key_id, data.order_id, amt ? amt * 100 : undefined);
      } else {
        setAwaitingWebhook(true);
        setSettlementStatus("pending");
      }
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
    try {
      await fetch("http://localhost:8000/api/ledger/reset", { method: "POST" });
    } catch (e) {
      console.warn("Backend reset note:", e);
    }
    setMandate(null);
    setLedger([]);
    setReceipt(null);
    setShowReceipt(false);
    setUpsellItem(null);
    setKillSwitchActive(false);
    setPassportData(null);
    setSettlementStatus("none");
    setPaymentResult(null);
    setPaymentDismissed(false);
    setAwaitingWebhook(false);
    setAwaitingSeconds(0);
    setLiveSettledSource(null);
    setLastCheckoutData(null);
    setIntentText("Buy high-quality hackathon survival gear");
    setMaxAmount(4000);
    setSelectedScenario("standard");
    setLimitFeedback(null);
    await verifyLedger();
  };

  const spendPct = mandate ? Math.min(100, (mandate.spent_amount / mandate.max_amount) * 100) : 0;

  // ── Render Cryptographic Audit Ledger ─────────────────────
  const renderAuditLedger = (isDedicatedView: boolean = false) => (
    <Panel className={`flex flex-col ${isDedicatedView ? "h-[82vh]" : (rightPanelTab === "LEDGER" ? "h-[80vh]" : "h-[45vh]")} animate-fade-in-up`}>
      {/* Ledger Header */}
      <PanelHeader
        icon={<Link2 size={18} />}
        title={
          <div className="flex items-center gap-2">
            <span>Cryptographic Audit Ledger</span>
            <span className="text-[10px] text-zinc-500 font-normal tracking-wide">SHA-256 Merkle Chained</span>
          </div>
        }
        meta={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={verifyLedger}
              disabled={verifyingChain}
            >
              <Link2 size={13} />
              <span>{verifyingChain ? "Verifying..." : "Verify Chain"}</span>
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={simulateTamper}
              disabled={tamperLoading || ledger.length === 0}
            >
              <XCircle size={13} />
              <span>{tamperLoading ? "Mutating..." : "Simulate Tamper"}</span>
            </Button>
          </div>
        }
      />

      {/* Integrity Alert Banner */}
      {verifyStatus && !verifyStatus.is_valid && (
        <div className="mx-5 my-3 p-3.5 bg-rose-950/70 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-center gap-3 animate-pulse">
          <Siren size={18} className="text-rose-400 shrink-0" />
          <div>
            <strong className="font-semibold text-white">Security Alert: Cryptographic Chain Invalidation</strong>
            <p className="text-[11px] text-rose-300 font-mono mt-0.5">{verifyStatus.reason}</p>
          </div>
        </div>
      )}

      {/* Ledger Stream */}
      <div ref={ledgerScrollRef} className="flex-1 overflow-y-auto space-y-3 p-5 pr-3 custom-scrollbar">
        {ledger.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-3 py-16">
            <ScrollText size={48} className="stroke-current opacity-20" />
            <p className="text-sm font-medium">Genesis ledger awaiting initialization</p>
            <p className="text-xs text-zinc-500">Authorize a mandate to begin the audit trail</p>
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
                className={`p-4 rounded-xl border text-xs transition-all relative ${
                  isKillSwitch
                    ? "bg-rose-950/40 border-rose-500/50 text-rose-100 ring-1 ring-rose-500/20"
                  : isRedTeam
                    ? "bg-rose-950/25 border-rose-800/60 text-rose-100"
                  : entry.gate_result === "FAIL"
                    ? "bg-rose-950/20 border-rose-800/50 text-rose-100"
                  : entry.action === "TOPUP_LINK_GENERATED"
                    ? "bg-amber-950/30 border-amber-500/50 text-amber-100"
                  : entry.action === "PAYMENT_EXECUTED"
                    ? "bg-emerald-950/25 border-emerald-500/40 text-emerald-100 ring-1 ring-emerald-500/20"
                  : isMerchant
                    ? "bg-amber-950/15 border-amber-900/30 text-amber-200"
                  : isBuyer
                    ? "bg-cyan-950/20 border-cyan-800/30 text-cyan-200"
                  : "bg-zinc-900/60 border-zinc-800/60 text-zinc-300"
                }`}
              >
                {/* Header Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-400">
                      #{entry.seq < 10 ? `0${entry.seq}` : entry.seq}
                    </span>

                    <Badge
                      tone={
                        isKillSwitch || isRedTeam ? "danger" :
                        entry.action === "TOPUP_LINK_GENERATED" || isSemantic ? "warn" :
                        isFinancial || entry.action === "PAYMENT_EXECUTED" ? "success" :
                        "neutral"
                      }
                      className="text-[10px]"
                    >
                      {entry.actor}
                    </Badge>

                    <span className="font-semibold text-zinc-200 truncate font-mono text-[11px]">
                      [{entry.action}]
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {entry.gate_result && (
                      <Badge tone={entry.gate_result === "PASS" ? "success" : "danger"}>
                        {entry.gate_result === "PASS" ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        <span>{entry.gate_result}</span>
                      </Badge>
                    )}
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {/* Detail Body */}
                {entry.action === "TOPUP_LINK_GENERATED" ? (
                  <div className="my-2 p-3.5 bg-amber-950/40 border border-amber-500/30 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                      <CreditCard size={15} />
                      <span>Human-in-the-Loop Shortfall Top-Up Required</span>
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
                          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition-colors"
                        >
                          <Zap size={14} />
                          <span>Open Razorpay Payment Link</span>
                          <span className="text-[10px] bg-zinc-950/20 px-1.5 py-0.5 rounded font-mono">Test Mode</span>
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-zinc-300 text-xs leading-relaxed mb-2.5 font-mono">
                    {entry.detail}
                  </div>
                )}

                {/* Hash Footer (Mono font strictly for hashes) */}
                <div className="pt-2 border-t border-zinc-800/40 flex flex-wrap items-center justify-between text-[9px] text-zinc-500 gap-2 font-mono">
                  <div className="flex items-center gap-1 truncate max-w-[48%]">
                    <span className="text-zinc-600">PREV:</span>
                    <span className="truncate">{entry.prev_hash}</span>
                  </div>
                  <div className="flex items-center gap-1 truncate max-w-[48%]">
                    <span className="text-zinc-600">HASH:</span>
                    <span className="text-violet-400/90 truncate">{entry.entry_hash}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={ledgerEndRef} />
      </div>
    </Panel>
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 font-sans relative overflow-x-hidden">

      {/* ── BACKGROUND LAYER WITH DOT PATTERN ── */}
      <div className="fixed inset-0 -z-10 bg-zinc-950">
        <DotPattern className="opacity-15" />
        <div className="absolute top-0 left-1/3 w-[600px] h-[400px] bg-violet-600/[0.07] blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] bg-cyan-600/[0.05] blur-[120px] rounded-full pointer-events-none" />
      </div>

      {/* ── SIDEBAR NAVIGATION ── */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-zinc-950 border-r border-white/[0.06] flex flex-col z-30 select-none">
        {/* Sidebar Brand */}
        <div className="p-5 border-b border-white/[0.06] flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shadow-violet-950/50">
            <Hexagon size={18} className="text-white fill-white/20" />
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-white flex items-center gap-1">
              Mandate<span className="text-violet-400">Mart</span>
            </div>
            <div className="text-[10px] text-zinc-500 tracking-wider">COMMAND CENTER</div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {[
            { id: "mission", label: "Mission Control", icon: Rocket },
            { id: "topology", label: "Protocol Map", icon: Network },
            { id: "ledger", label: "Audit Ledger", icon: ScrollText },
            { id: "redteam", label: "Red Team Arena", icon: Swords },
            { id: "analytics", label: "Revenue Rescue", icon: BarChart3 },
            { id: "catalog", label: "Merchant Catalog", icon: Store },
          ].map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                  isActive
                    ? "bg-violet-500/10 text-violet-300 border-l-2 border-violet-500 font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border-l-2 border-transparent"
                }`}
              >
                <Icon size={16} className={isActive ? "text-violet-400" : "text-zinc-400"} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500">
          <span>Track 01 • v2.0</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
        </div>
      </aside>

      {/* ── MAIN CONTENT CONTAINER ── */}
      <div className="pl-64 min-h-screen flex flex-col">
        
        {/* ── STICKY TOP HEADER CHROME ── */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-zinc-950/70 border-b border-white/[0.06] px-6 py-3.5">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                <Hexagon size={16} className="text-white fill-white/20" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-semibold text-white tracking-tight">
                    Mandate<span className="text-violet-400">Mart</span>
                  </h1>
                  <Badge tone="info">v2.0 Merkle</Badge>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Delegated financial authority on Razorpay rails
                </p>
              </div>
            </div>

            {/* Header Control Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* KILL SWITCH */}
              <Button
                variant="danger"
                size="sm"
                onClick={triggerKillSwitch}
                disabled={killSwitchActive}
                className={killSwitchActive ? "opacity-60 cursor-not-allowed" : ""}
              >
                <Siren size={14} className={!killSwitchActive ? "animate-pulse" : ""} />
                <span>{killSwitchActive ? "Passport Revoked" : "Kill Switch"}</span>
              </Button>

              {/* WAR ROOM */}
              <Button variant="outline" size="sm" onClick={() => setShowWarRoom(true)}>
                <TerminalSquare size={14} />
                <span>War Room</span>
              </Button>

              {/* A2A MANIFEST */}
              <a
                href="http://localhost:8000/.well-known/agent.json"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700/80 bg-zinc-900/60 px-3 h-8 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <Bot size={14} />
                <span>A2A Manifest</span>
              </a>

              {/* REVENUE RESCUE */}
              <Button variant="success" size="sm" onClick={() => setShowRevenue(true)}>
                <TrendingUp size={14} />
                <span>Revenue Rescue</span>
              </Button>

              {/* LIVE RAZORPAY ENVIRONMENT BADGE */}
              <Badge tone="info" className="border-purple-500/40 bg-purple-950/40 text-purple-300 font-semibold text-xs gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span>LIVE RAZORPAY Rails (Port 3001)</span>
              </Badge>

              {/* CHAIN VALIDITY BADGE */}
              {verifyStatus?.is_valid ? (
                <Badge tone="success">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Chain Valid ({verifyStatus.total_entries})</span>
                </Badge>
              ) : (
                <Badge tone="danger">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                  <span>Tamper Detected</span>
                </Badge>
              )}

              {/* RESET */}
              <Button variant="ghost" size="sm" onClick={resetAll}>
                <RefreshCw size={13} />
                <span>Reset</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">

          {/* Foreign Agent Detected Alert */}
          {foreignAgentDetected && (
            <Panel className="border-amber-500/40 bg-amber-950/20 p-4 mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="text-amber-400 shrink-0 animate-pulse" />
                <div>
                  <div className="text-amber-300 font-semibold text-sm">Foreign Agent Detected</div>
                  <div className="text-amber-400/80 text-xs font-mono">
                    External AI buyer transacting via A2A Commerce Manifest (Direct API)
                  </div>
                </div>
              </div>
            </Panel>
          )}

          {/* Emergency Kill Switch Banner */}
          {killSwitchActive && (
            <Panel className="border-rose-500/50 bg-rose-950/40 p-4 mb-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Siren size={22} className="text-rose-400 shrink-0 animate-pulse" />
                  <div>
                    <strong className="font-semibold text-white text-sm">Human Kill Switch Engaged</strong>
                    <p className="text-rose-300 text-xs mt-0.5">
                      Active Ed25519 agent passport has been revoked. All incoming agent transactions are blocked at the Double Gate.
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setKillSwitchActive(false)}>
                  Dismiss
                </Button>
              </div>
            </Panel>
          )}

          {/* ── CONDITIONAL VIEWS WITH FRAMER MOTION ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {/* ══════════════ TAB 1: MISSION CONTROL ══════════════ */}
              {activeTab === "mission" && (
                <div className="space-y-6">

                  {/* Hero Header Area with BorderBeam */}
                  <Panel className="relative p-6 overflow-hidden">
                    <BorderBeam duration={10} colorFrom="#8b5cf6" colorTo="#06b6d4" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="text-[11px] font-semibold text-violet-400 tracking-wider uppercase mb-1">
                          Delegated Financial Authority
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                          Autonomous AI Shopping with Cryptographic Guardrails
                        </h2>
                        <p className="text-zinc-400 text-xs mt-1 max-w-2xl leading-relaxed">
                          Issue natural-language spend mandates with hard financial ceilings. Agents negotiate within bilateral ZOPA, pass deterministic Double Gates, and settle on Razorpay rails.
                        </p>
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        {mandate && (
                          <Button variant="primary" size="sm" onClick={openPassport}>
                            <ShieldCheck size={14} />
                            <span>Passport</span>
                          </Button>
                        )}
                        {receipt && (
                          <Button variant="outline" size="sm" onClick={() => setShowReceipt(true)}>
                            <ScrollText size={14} />
                            <span>Audit Summary</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Panel>

                  {/* Persona Bar */}
                  <Panel className="p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-medium text-zinc-400">Persona:</span>
                        <div className="flex gap-1 bg-zinc-950/80 p-1 rounded-lg border border-white/[0.04]">
                          <Button
                            variant={persona === "personal" ? "primary" : "ghost"}
                            size="sm"
                            onClick={() => selectPersona("personal")}
                            className="text-xs h-7 px-3"
                          >
                            <User size={13} />
                            <span>Personal Shopper</span>
                          </Button>
                          <Button
                            variant={persona === "corporate" ? "primary" : "ghost"}
                            size="sm"
                            onClick={() => selectPersona("corporate")}
                            className="text-xs h-7 px-3"
                          >
                            <Building2 size={13} />
                            <span>Corporate IT</span>
                          </Button>
                        </div>
                      </div>

                      <div className="text-xs text-zinc-500 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>Ed25519 Delegation Active</span>
                      </div>
                    </div>
                  </Panel>

                  {/* Two-Column Mission Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* ── LEFT COLUMN (5 cols) ── */}
                    <div className="lg:col-span-5 space-y-6">
                      
                      {/* Preset Scenario Selector */}
                      <Panel className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-zinc-200">Demo Scenarios</span>
                          <span className="text-xs text-violet-400">1-Click Presets</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: "standard" as const, label: "Happy Path", sub: "ZOPA + Gate Pass" },
                            { key: "budget_fail" as const, label: "Budget Fail", sub: "Gate Blocks & Leash" },
                            { key: "semantic_fail" as const, label: "Semantic Fail", sub: "Intent Mismatch" },
                          ].map(s => (
                            <button
                              key={s.key}
                              onClick={() => selectScenario(s.key)}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                                selectedScenario === s.key
                                  ? "bg-violet-600/15 border-violet-500/50 text-white font-medium ring-1 ring-violet-500/40"
                                  : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                              }`}
                            >
                              <div className="font-semibold text-xs">{s.label}</div>
                              <div className="text-[10px] text-zinc-500 mt-0.5 truncate">{s.sub}</div>
                            </button>
                          ))}
                        </div>
                      </Panel>

                      {/* Mandate Authorization Card */}
                      <Panel className="p-6 space-y-4">
                        <PanelHeader
                          icon={<Lock size={16} />}
                          title="Human Mandate Leash"
                          meta={<Badge tone="neutral">Ed25519 Signed</Badge>}
                          className="p-0 pb-4 border-b border-white/[0.06]"
                        />

                        <div>
                          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                            Natural-Language Intent
                          </label>
                          <div className="flex items-start gap-2">
                            <textarea
                              value={intentText}
                              onChange={(e) => setIntentText(e.target.value)}
                              rows={2}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 outline-none transition-all text-zinc-100 resize-none font-sans"
                            />
                            <Button
                              variant={isListening ? "danger" : "outline"}
                              size="sm"
                              onClick={startVoiceInput}
                              disabled={isListening}
                              className="shrink-0 h-[68px] px-3.5 flex-col gap-1"
                              title="Speak your mandate intent"
                            >
                              <Mic size={16} className={isListening ? "animate-pulse" : ""} />
                              <span className="text-[10px]">{isListening ? "Listening" : "Speak"}</span>
                            </Button>
                          </div>
                          {isListening && (
                            <div className="mt-2 text-rose-400 text-xs flex items-center gap-1.5 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                              Recording voice input... speak your mandate now
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-medium text-zinc-300">
                              Spend Limit Hard Cap (₹)
                            </label>
                            {limitFeedback && (
                              <span className="text-[11px] text-purple-300 animate-fade-in font-medium">
                                {limitFeedback}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={maxAmount}
                              onChange={(e) => setMaxAmount(Number(e.target.value))}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs focus:border-violet-500 focus:ring-1 focus:ring-violet-500/40 outline-none transition-all text-zinc-100 font-mono"
                              placeholder="e.g. 4000"
                            />
                            <Button
                              variant={isListeningLimit ? "danger" : "outline"}
                              size="sm"
                              onClick={startLimitVoiceInput}
                              disabled={isListeningLimit}
                              className="shrink-0 h-[42px] px-3.5 gap-1.5"
                              title="Speak your spend limit (e.g. '3500' or 'four thousand')"
                            >
                              <Mic size={15} className={isListeningLimit ? "animate-pulse" : ""} />
                              <span className="text-xs">{isListeningLimit ? "Listening..." : "Speak"}</span>
                            </Button>
                          </div>
                          {isListeningLimit && (
                            <div className="mt-1.5 text-rose-400 text-xs flex items-center gap-1.5 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                              Listening for amount... say e.g. &quot;3500&quot; or &quot;four thousand&quot;
                            </div>
                          )}
                        </div>

                        <Button
                          variant="primary"
                          size="md"
                          onClick={issueMandate}
                          disabled={loadingMandate}
                          className="w-full relative overflow-hidden"
                        >
                          <Lock size={15} />
                          <span>{loadingMandate ? "Signing & Authorizing..." : "Authorize Spend Mandate"}</span>
                        </Button>

                        {mandate && (
                          <div className="p-4 bg-zinc-950/70 border border-white/[0.04] rounded-xl space-y-2.5 text-xs">
                            <div className="flex justify-between text-zinc-400">
                              <span>Mandate ID:</span>
                              <span className="text-violet-400 font-mono font-medium">{mandate.mandate_id}</span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>UPI Autopay Token:</span>
                              <span className="text-zinc-300 font-mono truncate max-w-[140px]">
                                {mandate.razorpay_token_id || "tok_autopay_mock"}
                              </span>
                            </div>
                            <div className="flex justify-between text-zinc-400">
                              <span>Spend Budget:</span>
                              <span className="text-white font-mono font-semibold">
                                <NumberTicker value={mandate.spent_amount} currency /> / ₹{mandate.max_amount.toLocaleString("en-IN")}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="w-full bg-zinc-900 rounded-full h-2 overflow-hidden">
                              <div 
                                className="h-full transition-all duration-700 ease-out rounded-full"
                                style={{ 
                                  width: `${spendPct}%`,
                                  background: spendPct > 80 
                                    ? "linear-gradient(90deg, #f43f5e, #f97316)" 
                                    : "linear-gradient(90deg, #8b5cf6, #06b6d4)"
                                }}
                              />
                            </div>

                            {/* Top Up Button */}
                            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                              <span className="text-[11px] text-zinc-500">Need more limit?</span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleTopUp}
                                disabled={topupLoading}
                                className="h-7 text-xs"
                              >
                                <Zap size={12} />
                                <span>{topupLoading ? "Topping up..." : "+₹1,500 Top-Up"}</span>
                              </Button>
                            </div>
                          </div>
                        )}
                      </Panel>

                      {/* Agent Action Box */}
                      <Panel className="p-6 space-y-4">
                        <PanelHeader
                          icon={<Bot size={16} />}
                          title="Autonomous Agent Execution"
                          meta={
                            loadingAgent ? (
                              <Badge tone="info">
                                <Loader2 size={11} className="animate-spin" />
                                <span>Haggling...</span>
                              </Badge>
                            ) : undefined
                          }
                          className="p-0 pb-4 border-b border-white/[0.06]"
                        />

                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Buyer Agent inspects merchant inventory, initiates bilateral ZOPA bargaining with Merchant Agent, and verifies cart against the Double Gate before drawing funds on Razorpay rails.
                        </p>

                        <Button
                          variant="primary"
                          size="md"
                          onClick={triggerAgent}
                          disabled={!mandate || loadingAgent}
                          className="w-full"
                        >
                          {loadingAgent ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              <span>Autonomous Haggling in Progress...</span>
                            </>
                          ) : (
                            <>
                              <Zap size={15} />
                              <span>Launch Autonomous Agent Haggling</span>
                            </>
                          )}
                        </Button>

                        {/* Direct Razorpay Checkout Trigger Button */}
                        <Button
                          variant="outline"
                          size="md"
                          onClick={handleDirectCheckoutModal}
                          disabled={!mandate || loadingAgent}
                          className="w-full text-purple-300 border-purple-500/40 hover:bg-purple-500/10 gap-2 font-medium"
                        >
                          <CreditCard size={15} className="text-purple-400" />
                          <span>💳 Open Razorpay Checkout Modal (Test Mode)</span>
                        </Button>

                        {/* Direct Modal Launcher Banner if order ready but modal closed */}
                        {lastCheckoutData && !paymentResult && settlementStatus !== "settled" && (
                          <div className="p-3 bg-purple-950/40 border border-purple-500/40 rounded-xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold">
                              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                              <span>Order Ready ({lastCheckoutData.order_id.slice(0, 14)}...)</span>
                            </div>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => openRazorpayModal(lastCheckoutData.key_id, lastCheckoutData.order_id)}
                              className="h-7 text-xs bg-purple-600 hover:bg-purple-500"
                            >
                              <span>Launch Modal</span>
                            </Button>
                          </div>
                        )}
                      </Panel>

                      {/* Post-Purchase Upsell Card */}
                      {upsellItem && (
                        <Panel className="p-4 border-violet-500/30 bg-violet-950/20 space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge tone="info">Post-Purchase Upsell Hook</Badge>
                            <span className="text-[11px] font-mono text-zinc-400">
                              Remaining: ₹{upsellItem.remaining_budget.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-white">{upsellItem.item.name}</h4>
                          <p className="text-[11px] text-zinc-400">{upsellItem.item.description}</p>
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-bold text-emerald-400 font-mono">
                              ₹{upsellItem.item.price.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-zinc-500">Logged to Merkle Chain</span>
                          </div>
                        </Panel>
                      )}

                      {/* 🧪 RAZORPAY TEST CREDENTIALS PANEL */}
                      <Panel className="p-4 border-purple-500/30 bg-purple-950/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-purple-300 font-semibold text-xs">
                            <CreditCard size={14} className="text-purple-400" />
                            <span>🧪 RAZORPAY TEST CREDENTIALS</span>
                          </div>
                          <Badge tone="info">Sandbox</Badge>
                        </div>
                        <div className="space-y-2 text-xs font-mono">
                          <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-white/5 gap-2">
                            <span className="text-zinc-400 text-[11px] whitespace-nowrap">UPI VPA:</span>
                            <span className="text-purple-300 font-semibold truncate select-all">success@razorpay</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[11px] text-purple-300 hover:bg-purple-500/20 shrink-0"
                              onClick={() => handleCopy("success@razorpay", "upi")}
                            >
                              {copiedField === "upi" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              <span>{copiedField === "upi" ? "Copied" : "Copy"}</span>
                            </Button>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-white/5 gap-2">
                            <span className="text-zinc-400 text-[11px] whitespace-nowrap">Visa Card:</span>
                            <span className="text-purple-300 font-semibold text-[11px] truncate select-all">4100 2800 0000 1007 · 12/28 · 123</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-[11px] text-purple-300 hover:bg-purple-500/20 shrink-0"
                              onClick={() => handleCopy("4100280000001007", "card")}
                            >
                              {copiedField === "card" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              <span>{copiedField === "card" ? "Copied" : "Copy"}</span>
                            </Button>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded bg-black/40 border border-white/5 gap-2">
                            <span className="text-zinc-400 text-[11px] whitespace-nowrap">Netbanking:</span>
                            <span className="text-emerald-300 text-[11px] truncate">HDFC / SBI ➔ Instant &quot;Success&quot;</span>
                            <Badge tone="success" className="text-[10px] py-0">100% Pass</Badge>
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          💡 <strong>How to Pay in Sandbox:</strong> Use <strong>Visa Card (4100 2800 0000 1007)</strong>, <strong>Netbanking (any bank → Success)</strong>, or <strong>UPI (success@razorpay)</strong>. All three trigger live authorization and webhook settlement.
                        </p>
                      </Panel>

                      {/* Payment Dismissed / Retry Banner */}
                      {paymentDismissed && !paymentResult && settlementStatus !== "settled" && (
                        <Panel className="p-4 border-amber-500/40 bg-amber-950/20 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                              <AlertTriangle size={15} />
                              <span>Payment not completed.</span>
                            </div>
                            <Badge tone="warn">Modal Closed</Badge>
                          </div>
                          <p className="text-zinc-400 text-xs">
                            Checkout was closed before the transaction was authorized.
                          </p>
                          {lastCheckoutData && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-amber-300 border-amber-500/30 hover:bg-amber-500/10 text-xs gap-1.5"
                              onClick={() => openRazorpayModal(lastCheckoutData.key_id, lastCheckoutData.order_id)}
                            >
                              <RefreshCw size={13} />
                              <span>🔁 Retry Checkout</span>
                            </Button>
                          )}
                        </Panel>
                      )}

                      {/* Visible Payment Success Banner */}
                      {paymentResult && (
                        <Panel className="p-4 border-emerald-500/50 bg-emerald-950/30 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs sm:text-sm">
                              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                              <span>✅ PAYMENT SUCCESS — payment_id: {paymentResult.razorpay_payment_id || "pay_test"}</span>
                            </div>
                            <Badge tone="success">CAPTURED</Badge>
                          </div>
                          {paymentResult.razorpay_order_id && (
                            <p className="text-[11px] text-zinc-400 font-mono">
                              Order ID: {paymentResult.razorpay_order_id}
                            </p>
                          )}
                        </Panel>
                      )}

                      {/* Razorpay Webhook Settlement Status Card */}
                      {(awaitingWebhook || settlementStatus === "pending") && settlementStatus !== "settled" && (
                        <Panel className="p-5 border-amber-500/30 bg-amber-950/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
                              <Loader2 size={14} className="animate-spin text-amber-400" />
                              <span>⏳ AWAITING LIVE RAZORPAY WEBHOOK — watch ngrok inspector</span>
                            </div>
                            <Badge tone="warn">{awaitingSeconds}s elapsed</Badge>
                          </div>
                          <p className="text-zinc-400 text-xs leading-relaxed">
                            Razorpay test order authorized. Awaiting live webhook delivery from Razorpay servers via ngrok for cryptographic settlement into Merkle Ledger.
                          </p>

                          {/* Safety fallback: ONLY after 45 seconds with no live webhook */}
                          {awaitingSeconds >= 45 && (
                            <div className="pt-2 border-t border-amber-500/20 space-y-2">
                              <Button
                                variant="outline"
                                size="md"
                                onClick={async () => {
                                  try {
                                    const mId = mandate?.mandate_id || "demo_mandate";
                                    const res = await fetch(`http://localhost:8000/api/webhooks/simulate/${mId}`, {
                                      method: "POST"
                                    });
                                    const data = await res.json();
                                    if (data.status === "WEBHOOK_DELIVERED_AND_VERIFIED") {
                                      setSettlementStatus("settled");
                                      setAwaitingWebhook(false);
                                      setLiveSettledSource("SIMULATOR_FALLBACK");
                                      verifyLedger();
                                    }
                                  } catch (e) { console.error(e); }
                                }}
                                className="w-full text-amber-300 border-amber-500/30 hover:bg-amber-500/10 text-xs"
                              >
                                <Bell size={14} />
                                <span>No webhook yet? Deliver signed simulator webhook</span>
                              </Button>
                            </div>
                          )}
                        </Panel>
                      )}

                      {settlementStatus === "settled" && (
                        <Panel className="p-4 border-emerald-500/40 bg-emerald-950/20 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                              <CheckCircle2 size={16} />
                              <span>✅ SETTLED BY LIVE RAZORPAY WEBHOOK (source={liveSettledSource || "RAZORPAY_LIVE"})</span>
                            </div>
                            <Badge tone="success">LIVE VERIFIED</Badge>
                          </div>
                          <p className="text-zinc-300 text-xs">
                            Razorpay webhook verified with HMAC-SHA256 and permanently recorded on the Merkle Ledger.
                          </p>
                        </Panel>
                      )}
                    </div>

                    {/* ── RIGHT COLUMN: STORYBOARD & SPLIT VIEW (7 cols) ── */}
                    <div className="lg:col-span-7 flex flex-col space-y-4">

                      {/* Split View Tabs */}
                      <Panel className="p-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant={rightPanelTab === "STORYBOARD" ? "primary" : "ghost"}
                            size="sm"
                            onClick={() => setRightPanelTab("STORYBOARD")}
                            className="h-8 text-xs"
                          >
                            <Bot size={13} />
                            <span>A2A Storyboard</span>
                          </Button>
                          <Button
                            variant={rightPanelTab === "SPLIT" ? "primary" : "ghost"}
                            size="sm"
                            onClick={() => setRightPanelTab("SPLIT")}
                            className="h-8 text-xs"
                          >
                            <Zap size={13} />
                            <span>Split View</span>
                          </Button>
                          <Button
                            variant={rightPanelTab === "LEDGER" ? "primary" : "ghost"}
                            size="sm"
                            onClick={() => setRightPanelTab("LEDGER")}
                            className="h-8 text-xs"
                          >
                            <Link2 size={13} />
                            <span>Merkle Ledger</span>
                          </Button>
                        </div>

                        <div className="text-[11px] text-zinc-500 hidden sm:flex items-center gap-1.5 pr-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <span>Autonomous A2A Bus</span>
                        </div>
                      </Panel>

                      {/* Storyboard Component (visible in STORYBOARD and SPLIT tabs) */}
                      {(rightPanelTab === "STORYBOARD" || rightPanelTab === "SPLIT") && (
                        <NegotiationStoryboard 
                          entries={ledger} 
                          className={rightPanelTab === "STORYBOARD" ? "h-[75vh]" : "max-h-96"} 
                        />
                      )}

                      {/* Merkle Ledger (visible in LEDGER and SPLIT tabs) */}
                      {(rightPanelTab === "LEDGER" || rightPanelTab === "SPLIT") && renderAuditLedger(false)}

                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════ TAB 2: PROTOCOL MAP (TOPOLOGY) ══════════════ */}
              {activeTab === "topology" && (
                <div className="w-full animate-fade-in">
                  <ProtocolTopology />
                </div>
              )}

              {/* ══════════════ TAB 3: AUDIT LEDGER ══════════════ */}
              {activeTab === "ledger" && (
                <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                  {renderAuditLedger(true)}
                </div>
              )}

              {/* ══════════════ TAB 4: RED TEAM ARENA ══════════════ */}
              {activeTab === "redteam" && (
                <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                  <RedTeamArena />
                </div>
              )}

              {/* ══════════════ TAB 5: REVENUE RESCUE (ANALYTICS) ══════════════ */}
              {activeTab === "analytics" && (
                <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                  <Panel className="p-8 border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 via-zinc-900 to-zinc-950">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.06]">
                      <div>
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
                          <TrendingUp size={15} />
                          <span>Autonomous Commerce Analytics</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Merchant Revenue Rescue Engine</h2>
                        <p className="text-zinc-400 text-xs mt-1">
                          Live tracking of cart abandonment recovery via bilateral ZOPA negotiation and UPI Autopay.
                        </p>
                      </div>
                      <Button
                        variant="success"
                        size="md"
                        onClick={() => setShowRevenue(true)}
                        className="self-start sm:self-auto"
                      >
                        <TrendingUp size={15} />
                        <span>Open Full Command Center</span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="p-5 rounded-xl bg-zinc-950/80 border border-white/[0.04]">
                        <div className="text-xs text-zinc-400">ZOPA Algorithmic Recovery</div>
                        <div className="text-2xl font-mono font-bold text-emerald-400 mt-2">
                          Bilateral Pricing
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-1">Recovers price-sensitive buyers before dropoff</div>
                      </div>
                      <div className="p-5 rounded-xl bg-zinc-950/80 border border-white/[0.04]">
                        <div className="text-xs text-zinc-400">Payment Link Rescue</div>
                        <div className="text-2xl font-mono font-bold text-amber-400 mt-2">
                          Human-in-the-Loop
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-1">Instant shortfall payment links generated via Razorpay</div>
                      </div>
                      <div className="p-5 rounded-xl bg-zinc-950/80 border border-white/[0.04]">
                        <div className="text-xs text-zinc-400">Fraud Prevention</div>
                        <div className="text-2xl font-mono font-bold text-rose-400 mt-2">
                          Double Gate Guard
                        </div>
                        <div className="text-[11px] text-zinc-500 mt-1">Deterministic spend leash & prompt injection blocks</div>
                      </div>
                    </div>
                  </Panel>
                </div>
              )}

              {/* ══════════════ TAB 6: MERCHANT LIVE CATALOG ══════════════ */}
              {activeTab === "catalog" && (
                <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                  <Panel className="p-6">
                    <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
                      <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <Store size={18} className="text-violet-400" />
                          <span>Merchant Live Catalog</span>
                        </h2>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          A2A-Compliant inventory exposed to autonomous buyer agents with bundle pricing rules.
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge tone="success">{catalog.length} Products Active</Badge>
                        <Button variant="outline" size="sm" onClick={fetchCatalog}>
                          <RefreshCw size={13} />
                          <span>Refresh</span>
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                      {catalog.map(item => (
                        <Panel 
                          key={item.product_id} 
                          className="p-5 flex flex-col justify-between space-y-4 hover:border-violet-500/40 transition-colors"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-white text-sm">{item.name}</span>
                              <Badge tone="neutral" className="text-[10px]">
                                {item.category}
                              </Badge>
                            </div>
                            <p className="text-zinc-400 text-xs leading-relaxed">{item.description}</p>
                            {item.bundle_rules?.length > 0 && (
                              <div className="p-2 rounded-lg bg-violet-950/30 border border-violet-800/40 text-[11px] text-violet-300 font-mono">
                                Bundle: {item.bundle_rules[0].discount_pct}% off on {item.bundle_rules[0].min_qty}+ units
                              </div>
                            )}
                          </div>

                          <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between">
                            <div>
                              <div className="text-[10px] text-zinc-500 uppercase">Retail Price</div>
                              <div className="font-mono font-bold text-emerald-400 text-base">
                                ₹{item.price.toLocaleString("en-IN")}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] text-zinc-500 uppercase">In Stock</div>
                              <div className="font-mono text-xs text-zinc-300 font-semibold">{item.stock} units</div>
                            </div>
                          </div>
                        </Panel>
                      ))}
                    </div>
                  </Panel>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

        </div>
      </div>

      {/* ── MODALS (RENDERED OUTSIDE TAB CONDITIONALS) ── */}

      {/* Receipt Modal */}
      {showReceipt && receipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <Panel className="max-w-lg w-full p-6 space-y-5 shadow-2xl relative bg-zinc-900 border-zinc-700/60">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <ScrollText size={18} className="text-violet-400" />
                <h3 className="font-semibold text-white text-sm">Multi-Agent Transaction Receipt</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowReceipt(false)} className="h-7 px-2">
                ✕
              </Button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-zinc-950/80 rounded-xl space-y-1.5 border border-white/[0.04]">
                <div className="text-zinc-400">Mandate: <span className="text-violet-400 font-bold">{receipt.mandate_id}</span></div>
                <div className="text-zinc-400 font-sans">Intent: <span className="text-zinc-200">{receipt.intent}</span></div>
                <div className="text-zinc-400">UPI Token: <span className="text-zinc-300">{receipt.token_id || "N/A"}</span></div>
              </div>

              <div className="p-3 bg-zinc-950/80 rounded-xl space-y-1.5 border border-white/[0.04]">
                <div className="text-zinc-400">Authorized Cap: <span className="text-white font-bold">₹{receipt.total_authorized.toLocaleString("en-IN")}</span></div>
                <div className="text-zinc-400">Final Settled Amount: <span className="text-emerald-400 font-bold">₹{receipt.total_spent.toLocaleString("en-IN")}</span></div>
                <div className="text-zinc-400">Remaining Budget: <span className="text-violet-300 font-bold">₹{receipt.remaining_budget.toLocaleString("en-IN")}</span></div>
              </div>

              <div className="p-3 bg-zinc-950/80 rounded-xl space-y-1.5 border border-white/[0.04]">
                <div className="text-zinc-400">Semantic Gate: <span className="text-amber-400">{receipt.semantic_gate_score}</span></div>
                <div className="text-zinc-400">Financial Gate: <span className="text-emerald-400">{receipt.financial_gate_audit}</span></div>
              </div>

              <div className="p-3 bg-emerald-950/30 rounded-xl border border-emerald-500/30 text-emerald-300 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> Execution: Verified & Charged
                </div>
                <div className="text-[11px] text-zinc-300">{receipt.payment_confirmation}</div>
              </div>

              <div className="text-[10px] text-zinc-500 truncate">
                Ed25519 Signature: {receipt.signature}
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => setShowReceipt(false)}
              className="w-full"
            >
              Done
            </Button>
          </Panel>
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
