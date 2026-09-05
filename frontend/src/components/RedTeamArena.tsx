"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, XCircle, ChevronRight, Terminal } from "lucide-react";

const ATTACKS = [
  { id: "prompt_injection", name: "Prompt Injection (Buy Rolex)" },
  { id: "category_violation", name: "Category Violation (Luxury Scarf)" },
  { id: "mandate_escalation", name: "Mandate Escalation (₹50k Limit)" },
  { id: "replay_attack", name: "Replay Attack (Reuse Nonce)" },
  { id: "tool_poisoning", name: "Tool Poisoning (Malicious Metadata)" },
];

interface TraceStep {
  step: string;
  status: "pass" | "fail" | "info";
  detail: string;
}

interface AttackResult {
  blocked: boolean;
  razorpay_called: boolean;
  reason: string;
  attack_type?: string;
  attempted_amount_paise?: number;
  trace?: TraceStep[];
}

interface MerchantStats {
  fraud_blocked_count: number;
  fraud_blocked_paise: number;
  total_fraud_blocked_inr: number;
}

export default function RedTeamArena() {
  const [selected, setSelected] = useState(ATTACKS[0]);
  const [result, setResult] = useState<AttackResult | null>(null);
  const [trace, setTrace] = useState<TraceStep[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(0);
  const [showSummary, setShowSummary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<MerchantStats | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:8000/api/merchant/analytics");
      if (res.ok) {
        const data = await res.json();
        setStats({
          fraud_blocked_count: data.fraud_blocked_count || 0,
          fraud_blocked_paise: data.fraud_blocked_paise || 0,
          total_fraud_blocked_inr: data.total_fraud_blocked_inr || (data.fraud_blocked_paise ? data.fraud_blocked_paise / 100 : 0),
        });
      }
    } catch (e) {
      console.error("Failed to fetch merchant analytics in Red Team Arena:", e);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Animated trace: reveal steps one by one every 450ms
  useEffect(() => {
    if (trace.length > 0 && visibleCount < trace.length) {
      const timer = setTimeout(() => {
        setVisibleCount((prev) => prev + 1);
      }, 450);
      return () => clearTimeout(timer);
    } else if (trace.length > 0 && visibleCount === trace.length && !showSummary) {
      const timer = setTimeout(() => {
        setShowSummary(true);
        fetchStats();
      }, 450);
      return () => clearTimeout(timer);
    }
  }, [trace, visibleCount, showSummary, fetchStats]);

  const execute = async () => {
    setLoading(true);
    setResult(null);
    setTrace([]);
    setVisibleCount(0);
    setShowSummary(false);

    try {
      const res = await fetch("http://localhost:8000/api/redteam/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attack_type: selected.id }),
      });
      const data: AttackResult = await res.json();
      setResult(data);
      const steps = data.trace || [];
      setTrace(steps);
      if (steps.length > 0) {
        setVisibleCount(1);
      } else {
        setShowSummary(true);
      }
    } catch (e) {
      console.error("Attack execution error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/90 p-6 rounded-2xl border border-rose-800/80 shadow-2xl backdrop-blur-sm">
      {/* Top Stats Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-zinc-950/80 rounded-xl border border-rose-900/40 text-[11px] font-mono mb-4 text-zinc-300">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-zinc-400 font-medium">Live Defense Shield:</span>
        </div>
        <div className="flex items-center gap-2 md:gap-3 text-[11px]">
          <span>
            Attacks blocked:{" "}
            <strong className="text-rose-400 font-semibold">{stats ? stats.fraud_blocked_count : 0}</strong>
          </span>
          <span className="text-zinc-600">·</span>
          <span>
            Hostile ₹ protected:{" "}
            <strong className="text-emerald-400 font-semibold">
              ₹{(stats ? stats.total_fraud_blocked_inr : 0).toLocaleString("en-IN")}
            </strong>
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-rose-400 font-bold text-base flex items-center gap-2">
          <span>⚔️</span>
          <span>RED TEAM ARENA</span>
        </h3>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/60 border border-rose-700/60 text-rose-300">
          Adversarial Testbed
        </span>
      </div>
      
      <p className="text-xs text-zinc-400 mb-3">
        Inject hostile payloads to prove the Double Gate blocks exploits before Razorpay execution.
      </p>

      <select 
        value={selected.id} 
        onChange={(e) => setSelected(ATTACKS.find((a) => a.id === e.target.value)!)}
        className="w-full bg-zinc-950 text-zinc-200 text-xs p-3 rounded-xl mb-3 border border-zinc-800 focus:border-rose-500 outline-none font-medium"
      >
        {ATTACKS.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      
      <button 
        onClick={execute} 
        disabled={loading}
        className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl transition text-xs shadow-lg shadow-rose-950 disabled:opacity-50 flex items-center justify-center gap-1.5"
      >
        {loading ? (
          <span>Simulating Adversary...</span>
        ) : (
          <>
            <span>🔴</span>
            <span>INJECT ADVERSARIAL ATTACK</span>
          </>
        )}
      </button>

      {/* Pro tip hint line */}
      <div className="text-[11px] text-zinc-400 text-center mt-2 font-sans leading-tight">
        💡 Pro tip: open DevTools → Network tab and watch zero requests hit Razorpay during an attack.
      </div>

      {/* Animated Terminal-Style Step-by-Step Gate Pipeline Trace */}
      {trace.length > 0 && (
        <div className="mt-4 bg-zinc-950 border border-zinc-800/90 rounded-xl p-4 font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-800 text-[11px] text-zinc-500">
            <span className="flex items-center gap-1.5 text-zinc-300 font-semibold tracking-wide">
              <Terminal size={14} className="text-rose-400" />
              GATE PIPELINE EXECUTION TRACE
            </span>
            <span className="text-[10px] text-zinc-500">
              {visibleCount}/{trace.length} steps evaluated
            </span>
          </div>
          <div className="space-y-2.5">
            {trace.slice(0, visibleCount).map((step, idx) => (
              <div key={idx} className="flex items-start gap-2.5 animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="mt-0.5 shrink-0">
                  {step.status === "pass" && <CheckCircle2 size={14} className="text-emerald-400" />}
                  {step.status === "fail" && <XCircle size={14} className="text-rose-500" />}
                  {step.status === "info" && <ChevronRight size={14} className="text-zinc-400" />}
                </span>
                <div className="min-w-0 flex-1 leading-relaxed">
                  <span className={`font-semibold mr-2 ${
                    step.status === "fail" ? "text-rose-400" :
                    step.status === "pass" ? "text-emerald-400" : "text-cyan-400"
                  }`}>
                    [{step.step}]
                  </span>
                  <span className="text-zinc-300 text-[11px] break-words">
                    {step.detail}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Card — Shown after terminal trace animation finishes */}
      {showSummary && result && (
        <div className={`mt-4 p-4 rounded-xl border transition animate-in fade-in zoom-in-95 duration-500 ${result.blocked ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-rose-600 bg-rose-900/20'}`}>
          <div className="font-bold text-white text-xs mb-2 flex items-center gap-2">
            <span>{result.blocked ? '🛡️' : '🚨'}</span>
            <span>{result.blocked ? 'ATTACK NEUTRALIZED BY DOUBLE GATE' : 'BREACH DETECTED!'}</span>
          </div>
          <div className="text-[11px] font-mono text-zinc-300 space-y-1.5 border-t border-zinc-800/80 pt-2">
            <div className="flex justify-between">
              <span className="text-zinc-400">Gate Verdict:</span>
              <span className="text-rose-400 font-bold">BLOCKED</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Razorpay API Called:</span>
              <span className="text-emerald-400 font-bold">NO (Capital Safe)</span>
            </div>
            <div className="text-amber-300 mt-2 p-2 bg-zinc-950/60 rounded-lg border border-zinc-800">
              Reason: {result.reason}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

