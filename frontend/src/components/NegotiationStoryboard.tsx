"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bot, Shield, Sparkles, Clock, MessageSquare } from "lucide-react";

export interface LedgerBlock {
  seq: number;
  timestamp: string;
  actor: string;
  action: string;
  detail: string;
  gate_result: string | null;
  prev_hash: string;
  entry_hash: string;
}

interface Props {
  entries?: LedgerBlock[];
  onClose?: () => void;
  className?: string;
}

interface ChatMessage {
  id: string;
  seq: number;
  timestamp: string;
  sender: "buyer" | "merchant" | "gate" | "system";
  actorName: string;
  action: string;
  text: string;
  price?: number;
  gateResult?: string | null;
}

export default function NegotiationStoryboard({ entries, onClose, className = "" }: Props) {
  const [internalEntries, setInternalEntries] = useState<LedgerBlock[]>([]);
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // If parent passes entries, use those; otherwise connect to SSE stream
  useEffect(() => {
    if (entries && entries.length > 0) {
      setInternalEntries(entries);
      return;
    }

    const eventSource = new EventSource("http://localhost:8000/api/ledger");
    eventSource.onmessage = (event) => {
      try {
        const data: LedgerBlock = JSON.parse(event.data);
        setInternalEntries((prev) => {
          if (!prev.find((e) => e.seq === data.seq)) {
            const next = [...prev, data];
            return next.sort((a, b) => a.seq - b.seq);
          }
          return prev;
        });
      } catch (err) {
        console.error("SSE parse error in Storyboard:", err);
      }
    };

    return () => eventSource.close();
  }, [entries]);

  // Transform ledger blocks into structured chat messages
  const activeEntries = entries && entries.length > 0 ? entries : internalEntries;

  const messages: ChatMessage[] = activeEntries
    .filter((e) => {
      const a = (e.actor || "").toLowerCase();
      const act = (e.action || "").toUpperCase();
      return (
        a.includes("buyer") ||
        a.includes("merchant") ||
        a.includes("gate") ||
        act.includes("OFFER") ||
        act.includes("PROPOSE") ||
        act.includes("BARGAIN") ||
        act.includes("PAYMENT_EXECUTED") ||
        act.includes("CHECK")
      );
    })
    .map((e) => {
      const a = (e.actor || "").toLowerCase();
      let sender: "buyer" | "merchant" | "gate" | "system" = "system";

      if (a.includes("buyer")) sender = "buyer";
      else if (a.includes("merchant")) sender = "merchant";
      else if (a.includes("gate") || e.action.includes("CHECK")) sender = "gate";

      // Dialogue extraction from detail
      let extractedText = e.detail || "";
      let price: number | undefined;

      // Try JSON parsing
      if (extractedText.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(extractedText);
          extractedText =
            parsed.merchant_notes ||
            parsed.reason ||
            parsed.message ||
            parsed.detail ||
            parsed.instructions ||
            JSON.stringify(parsed);
          if (parsed.counter_price) price = parsed.counter_price;
          if (parsed.proposed_price) price = parsed.proposed_price;
        } catch {
          // Fall back to raw text
        }
      }

      // Extract price pattern (e.g. ₹2,500 or ₹2500)
      const priceMatch = extractedText.match(/₹\s?(\d[\d,]*)/);
      if (priceMatch) {
        price = parseInt(priceMatch[1].replace(/,/g, ""), 10);
      }

      // Pretty actor label
      let actorName = "System";
      if (sender === "buyer") actorName = "Buyer Agent (Gemini ReAct)";
      if (sender === "merchant") actorName = "Merchant Agent (ZOPA Engine)";
      if (sender === "gate") actorName = "Deterministic Double Gate";

      return {
        id: `msg-${e.seq}-${e.action}`,
        seq: e.seq,
        timestamp: e.timestamp ? e.timestamp.split("T")[1]?.slice(0, 8) || "" : "",
        sender,
        actorName,
        action: e.action,
        text: extractedText,
        price,
        gateResult: e.gate_result,
      };
    });

  // Calculate typing state based on recent actions
  useEffect(() => {
    if (messages.length === 0) {
      setIsTyping(null);
      return;
    }

    const last = messages[messages.length - 1];

    if (last.sender === "buyer" && (last.action.includes("REQUEST") || last.action.includes("PROPOSE"))) {
      setIsTyping("Merchant Agent is evaluating ZOPA reserve floor & bundle discounts...");
    } else if (last.action === "PROPOSE_PURCHASE") {
      setIsTyping("Double Gate is verifying Semantic alignment & Spend Cap leash...");
    } else {
      setIsTyping(null);
    }
  }, [messages]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages.length, isTyping]);

  return (
    <div className={`flex flex-col bg-zinc-950/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl ${className}`}>
      {/* ── HEADER ── */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border-b border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-amber-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-950/40">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                🤖 LIVE AGENT NEGOTIATION
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-cyan-400 border border-cyan-500/30">
                A2A Protocol
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-mono flex items-center gap-2 mt-0.5">
              <span>Bilateral ZOPA Bargaining</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Channel
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-3 text-[10px] font-mono bg-zinc-950/80 px-3 py-1.5 rounded-xl border border-zinc-800">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400" /> Buyer Agent
            </span>
            <span className="text-zinc-600">vs</span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Merchant Agent
            </span>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── CHAT SCROLL AREA ── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 p-4 md:p-5 space-y-4 overflow-y-auto max-h-96 min-h-[320px] custom-scrollbar bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/30 via-zinc-950/60 to-black"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 animate-pulse">
              <Bot className="w-6 h-6" />
            </div>
            <div className="text-zinc-400 text-xs font-mono font-medium">
              Waiting for A2A Autonomous Bargaining to begin...
            </div>
            <div className="text-zinc-600 text-[11px] max-w-sm">
              Authorize an e-Mandate and click &quot;Launch Autonomous Agent Haggling&quot; to observe live bilateral multi-agent offers and ZOPA counter-offers.
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            // ── BUYER AGENT MESSAGE (LEFT) ──
            if (msg.sender === "buyer") {
              return (
                <div key={msg.id} className="flex items-start gap-3 max-w-[85%] animate-fade-in">
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 shadow-md shadow-cyan-950/50">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold text-cyan-400">{msg.actorName}</span>
                      <span className="text-[9px] font-mono text-zinc-600">{msg.timestamp}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-800/40 text-cyan-300 uppercase">
                        {msg.action}
                      </span>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-cyan-950/40 via-zinc-900/80 to-zinc-900 border border-cyan-500/30 rounded-2xl rounded-tl-sm text-xs text-cyan-100/90 leading-relaxed shadow-lg shadow-cyan-950/20">
                      <p>{msg.text}</p>
                      {msg.price && (
                        <div className="mt-2 pt-1.5 border-t border-cyan-800/30 flex items-center justify-between text-[11px]">
                          <span className="text-cyan-400 font-mono">Proposed Offer:</span>
                          <span className="font-mono font-bold text-cyan-300 bg-cyan-900/50 px-2 py-0.5 rounded border border-cyan-700/50">
                            ₹{msg.price.toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // ── MERCHANT AGENT MESSAGE (RIGHT) ──
            if (msg.sender === "merchant") {
              return (
                <div key={msg.id} className="flex items-start justify-end gap-3 max-w-[85%] ml-auto animate-fade-in">
                  <div className="space-y-1 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-800/40 text-amber-300 uppercase">
                        {msg.action}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-600">{msg.timestamp}</span>
                      <span className="text-[10px] font-mono font-bold text-amber-400">{msg.actorName}</span>
                    </div>
                    <div className="p-3 bg-gradient-to-bl from-amber-950/40 via-zinc-900/80 to-zinc-900 border border-amber-500/30 rounded-2xl rounded-tr-sm text-xs text-amber-100/90 leading-relaxed text-left shadow-lg shadow-amber-950/20">
                      <p>{msg.text}</p>
                      {msg.price && (
                        <div className="mt-2 pt-1.5 border-t border-amber-800/30 flex items-center justify-between text-[11px]">
                          <span className="text-amber-400 font-mono">ZOPA Counter-Price:</span>
                          <span className="font-mono font-bold text-amber-300 bg-amber-900/50 px-2 py-0.5 rounded border border-amber-700/50">
                            ₹{msg.price.toLocaleString("en-IN")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-amber-950 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-md shadow-amber-950/50">
                    <Bot className="w-4 h-4" />
                  </div>
                </div>
              );
            }

            // ── GATE OR SYSTEM EVENT (CENTER) ──
            const isPassed = msg.gateResult === "PASS" || msg.action.includes("PASSED") || msg.action === "PAYMENT_EXECUTED";
            return (
              <div key={msg.id} className="flex justify-center my-2 animate-fade-in">
                <div
                  className={`px-3.5 py-1.5 rounded-full border text-[10px] font-mono flex items-center gap-2 shadow-md ${
                    isPassed
                      ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                      : "bg-indigo-950/50 border-indigo-500/30 text-indigo-300"
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span className="font-bold">{msg.action}:</span>
                  <span className="truncate max-w-md">{msg.text}</span>
                </div>
              </div>
            );
          })
        )}

        {/* ── TYPING / THINKING INDICATOR ── */}
        {isTyping && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/70 border border-zinc-800 max-w-fit animate-pulse text-[11px] font-mono text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>{isTyping}</span>
            <span className="flex gap-1 pl-1">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
            </span>
          </div>
        )}
      </div>

      {/* ── FOOTER STATUS ── */}
      <div className="px-5 py-2.5 bg-zinc-950 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-zinc-500">
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-zinc-600" />
          <span>Events Logged: {messages.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>Zero LLM Leakage</span>
          <span>•</span>
          <span className="text-zinc-400">SHA-256 Chained</span>
        </div>
      </div>
    </div>
  );
}
