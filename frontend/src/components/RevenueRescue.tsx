"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Store, Link2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { NumberTicker } from "@/components/magicui/number-ticker";

interface Analytics {
  zopa_recovered_paise: number;
  zopa_recovered_count: number;
  payment_link_rescued_paise: number;
  payment_link_rescued_count: number;
  fraud_blocked_paise: number;
  fraud_blocked_count: number;
  total_revenue_rescued_inr: number;
  total_fraud_blocked_inr: number;
  legacy_abandonment_loss_inr: number;
}

export default function RevenueRescue({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch("http://localhost:8000/api/merchant/analytics")
        .then(r => r.json())
        .then(setData)
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const fmt = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in backdrop-blur-sm">
      <div className="bg-zinc-900 rounded-2xl border border-emerald-500/40 p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-emerald-950/40">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp size={18} />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Revenue Rescue Command Center</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-zinc-400 hover:text-white text-sm w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {data ? (
          <>
            {/* Hero Metric */}
            <div className="bg-gradient-to-r from-emerald-950/50 via-zinc-900 to-cyan-950/50 border border-emerald-500/40 rounded-2xl p-6 mb-6 text-center shadow-inner">
              <div className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
                Total Merchant Revenue Rescued Today
              </div>
              <div className="text-4xl md:text-5xl font-extrabold text-emerald-400 font-mono tracking-tight">
                <NumberTicker value={data.total_revenue_rescued_inr} currency />
              </div>
              <div className="text-zinc-400 text-xs md:text-sm mt-2">
                Legacy checkout would have <span className="text-rose-400 font-semibold">LOST</span> this revenue to cart abandonment
              </div>
            </div>

            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-zinc-950/70 rounded-2xl p-5 border border-cyan-800/40 hover:border-cyan-500/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-cyan-950/50 border border-cyan-800/60 flex items-center justify-center text-cyan-400 mb-3">
                  <Store size={18} />
                </div>
                <div className="text-cyan-400 font-bold text-lg font-mono">{fmt(data.zopa_recovered_paise)}</div>
                <div className="text-zinc-300 text-xs font-medium mt-0.5">ZOPA Bargaining Recovery</div>
                <div className="text-zinc-500 text-[11px] mt-1 font-mono">{data.zopa_recovered_count} sales rescued</div>
              </div>

              <div className="bg-zinc-950/70 rounded-2xl p-5 border border-amber-800/40 hover:border-amber-500/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-950/50 border border-amber-800/60 flex items-center justify-center text-amber-400 mb-3">
                  <Link2 size={18} />
                </div>
                <div className="text-amber-400 font-bold text-lg font-mono">{fmt(data.payment_link_rescued_paise)}</div>
                <div className="text-zinc-300 text-xs font-medium mt-0.5">Payment Link Rescue</div>
                <div className="text-zinc-500 text-[11px] mt-1 font-mono">{data.payment_link_rescued_count} shortfalls converted</div>
              </div>

              <div className="bg-zinc-950/70 rounded-2xl p-5 border border-rose-800/40 hover:border-rose-500/50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-rose-950/50 border border-rose-800/60 flex items-center justify-center text-rose-400 mb-3">
                  <ShieldCheck size={18} />
                </div>
                <div className="text-rose-400 font-bold text-lg font-mono">{fmt(data.fraud_blocked_paise)}</div>
                <div className="text-zinc-300 text-xs font-medium mt-0.5">Fraudulent Spend Blocked</div>
                <div className="text-zinc-500 text-[11px] mt-1 font-mono">{data.fraud_blocked_count} attacks neutralized</div>
              </div>
            </div>

            {/* Comparison Bar */}
            <div className="bg-zinc-950/80 rounded-2xl p-5 border border-zinc-800">
              <div className="text-xs font-semibold mb-4 uppercase tracking-wider text-zinc-400">
                Legacy Checkout vs MandateMart
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-rose-400">Legacy: Cart Abandoned</span>
                    <span className="text-rose-400 font-mono">-₹{data.total_revenue_rescued_inr.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-rose-500 rounded-full" style={{ width: "100%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5 font-medium">
                    <span className="text-emerald-400">MandateMart: Revenue Rescued</span>
                    <span className="text-emerald-400 font-mono">+₹{data.total_revenue_rescued_inr.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: "100%" }} />
                  </div>
                </div>
              </div>
              <div className="mt-5 pt-4 border-t border-zinc-800/60 text-center text-emerald-400 font-semibold text-xs flex items-center justify-center gap-1.5">
                <CheckCircle2 size={16} />
                <span>100% Recovery Rate — ₹0 Lost to Cart Abandonment</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-zinc-500 py-12 text-xs font-mono">Loading revenue rescue analytics...</div>
        )}
      </div>
    </div>
  );
}
