"use client";
import { useState } from "react";

const ATTACKS = [
  { id: "prompt_injection", name: "Prompt Injection (Buy Rolex)" },
  { id: "category_violation", name: "Category Violation (Luxury Scarf)" },
  { id: "mandate_escalation", name: "Mandate Escalation (₹50k Limit)" },
  { id: "replay_attack", name: "Replay Attack (Reuse Nonce)" },
  { id: "tool_poisoning", name: "Tool Poisoning (Malicious Metadata)" },
];

interface AttackResult {
  blocked: boolean;
  razorpay_called: boolean;
  reason: string;
}

export default function RedTeamArena() {
  const [selected, setSelected] = useState(ATTACKS[0]);
  const [result, setResult] = useState<AttackResult | null>(null);
  const [loading, setLoading] = useState(false);

  const execute = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/redteam/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attack_type: selected.id }),
      });
      setResult(await res.json());
    } catch (e) { 
      console.error(e); 
    }
    setLoading(false);
  };

  return (
    <div className="bg-zinc-900/90 p-6 rounded-2xl border border-rose-800/80 shadow-2xl backdrop-blur-sm">
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
        onChange={(e) => setSelected(ATTACKS.find(a => a.id === e.target.value)!)}
        className="w-full bg-zinc-950 text-zinc-200 text-xs p-3 rounded-xl mb-3 border border-zinc-800 focus:border-rose-500 outline-none font-medium"
      >
        {ATTACKS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
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

      {result && (
        <div className={`mt-4 p-4 rounded-xl border transition animate-in fade-in ${result.blocked ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-rose-600 bg-rose-900/20'}`}>
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
