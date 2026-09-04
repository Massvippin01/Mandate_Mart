"use client";

import { useState } from "react";
import NegotiationStoryboard from "./NegotiationStoryboard";

interface LedgerBlock {
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
  entries: LedgerBlock[];
  onClose: () => void;
}

function JsonCodeViewer({ jsonStr }: { jsonStr: string }) {
  // Ultra-reliable tokenized JSON syntax highlighter for Next.js 15
  const lines = jsonStr.split("\n");
  return (
    <pre className="m-0 p-3 text-[11px] font-mono leading-relaxed bg-black/90 border border-zinc-800 rounded-xl overflow-x-auto text-zinc-300">
      <code>
        {lines.map((line, idx) => {
          const formatted = line.replace(
            /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
            (match) => {
              let cls = "text-amber-300"; // numbers
              if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                  cls = "text-indigo-400 font-semibold"; // object keys
                } else {
                  cls = "text-emerald-400"; // string values
                }
              } else if (/true|false/.test(match)) {
                cls = "text-purple-400 font-bold"; // booleans
              } else if (/null/.test(match)) {
                cls = "text-zinc-500 italic"; // null
              }
              return `<span class="${cls}">${match}</span>`;
            }
          );
          return (
            <div
              key={idx}
              className="table-row"
              dangerouslySetInnerHTML={{ __html: formatted }}
            />
          );
        })}
      </code>
    </pre>
  );
}

export default function WarRoomTerminal({ entries, onClose }: Props) {
  const [viewMode, setViewMode] = useState<"STORYBOARD" | "CLI">("STORYBOARD");
  const [filter, setFilter] = useState<"ALL" | "AGENTS" | "GATES" | "ATTACKS">("ALL");

  const filteredEntries = entries.filter(e => {
    if (filter === "AGENTS") return e.actor.includes("agent");
    if (filter === "GATES") return e.actor.includes("gate");
    if (filter === "ATTACKS") return e.actor === "red_team" || e.action.includes("ATTACK");
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-hidden">
      <div className="w-full max-w-6xl h-[88vh] bg-black border-2 border-emerald-500/50 rounded-2xl shadow-2xl flex flex-col font-mono text-xs overflow-hidden relative">
        
        {/* Terminal Scanline Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px] pointer-events-none z-20 opacity-40" />

        {/* Top Header Bar */}
        <div className="bg-zinc-950 border-b border-emerald-500/30 px-4 py-3 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <span className="text-emerald-400 font-bold">WAR_ROOM://AGENT_TELEMETRY</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-[10px] text-emerald-400 border border-emerald-800 animate-pulse">
                LIVE BUS ACTIVE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle: A2A Storyboard vs CLI Terminal */}
            <div className="flex bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-[10px]">
              <button
                onClick={() => setViewMode("STORYBOARD")}
                className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
                  viewMode === "STORYBOARD"
                    ? "bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>💬</span>
                <span>A2A Storyboard</span>
              </button>
              <button
                onClick={() => setViewMode("CLI")}
                className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
                  viewMode === "CLI"
                    ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <span>💻</span>
                <span>CLI Terminal</span>
              </button>
            </div>

            {/* Filter Tabs (shown when in CLI mode) */}
            {viewMode === "CLI" && (
              <div className="hidden sm:flex bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-[10px]">
                {(["ALL", "AGENTS", "GATES", "ATTACKS"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`px-2.5 py-1 rounded transition ${
                      filter === tab
                        ? "bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={onClose}
              className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-700 text-xs transition"
            >
              ✕ Exit Terminal
            </button>
          </div>
        </div>

        {/* View Mode Content */}
        {viewMode === "STORYBOARD" ? (
          <div className="flex-1 overflow-hidden z-10 p-2 md:p-4 bg-zinc-950/70">
            <NegotiationStoryboard entries={entries} className="h-full max-h-none border-zinc-800/80 bg-zinc-950/90" />
          </div>
        ) : (
          /* Terminal Output Body */
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar z-10 bg-zinc-950/90 text-zinc-300">
          <div className="text-[11px] text-emerald-400/80 pb-2 border-b border-zinc-900 font-mono">
            &gt; Initialized telemetry stream. Capturing A2A negotiation packets, double gate evaluations, and SHA-256 Merkle payloads...
          </div>

          {filteredEntries.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-zinc-600">
              Awaiting live agent telemetry packet...
            </div>
          ) : (
            filteredEntries.map((block) => {
              // Attempt to parse JSON payload in detail
              let formattedJson: string | null = null;
              try {
                if (block.detail.startsWith("{") || block.detail.startsWith("[")) {
                  formattedJson = JSON.stringify(JSON.parse(block.detail), null, 2);
                }
              } catch {
                formattedJson = null;
              }

              const isBuyer = block.actor === "buyer_agent";
              const isMerchant = block.actor === "merchant_agent";
              const isGate = block.actor.includes("gate");
              const isAttack = block.actor === "red_team";

              return (
                <div
                  key={block.seq}
                  className={`p-3 rounded-xl border transition ${
                    isAttack
                      ? "bg-rose-950/20 border-rose-800/60"
                      : isMerchant
                      ? "bg-purple-950/20 border-purple-900/40"
                      : isBuyer
                      ? "bg-blue-950/20 border-blue-900/40"
                      : isGate
                      ? "bg-emerald-950/20 border-emerald-900/40"
                      : "bg-zinc-900/50 border-zinc-800"
                  }`}
                >
                  {/* Packet Header */}
                  <div className="flex flex-wrap items-center justify-between pb-1.5 mb-2 border-b border-zinc-800/60 text-[10px]">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500 font-bold">BLOCK#{block.seq}</span>
                      <span className={`px-2 py-0.5 rounded font-black uppercase ${
                        isAttack ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" :
                        isMerchant ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" :
                        isBuyer ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" :
                        "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}>
                        {block.actor}
                      </span>
                      <span className="text-zinc-200 font-bold font-mono">[{block.action}]</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {block.gate_result && (
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                          block.gate_result === "PASS"
                            ? "text-emerald-400 bg-emerald-950 border border-emerald-800"
                            : "text-rose-400 bg-rose-950 border border-rose-800"
                        }`}>
                          GATE: {block.gate_result}
                        </span>
                      )}
                      <span className="text-zinc-600">{new Date(block.timestamp).toISOString()}</span>
                    </div>
                  </div>

                  {/* Packet Content */}
                  {formattedJson ? (
                    <div className="my-1">
                      <JsonCodeViewer jsonStr={formattedJson} />
                    </div>
                  ) : (
                    <p className="text-zinc-300 text-xs font-mono leading-relaxed pl-1 py-1">
                      {block.detail}
                    </p>
                  )}

                  {/* Cryptographic Hashes */}
                  <div className="flex justify-between items-center text-[9px] text-zinc-400 pt-1.5 border-t border-zinc-900 mt-1">
                    <span className="truncate max-w-[45%]">PREV: {block.prev_hash}</span>
                    <span className="truncate max-w-[45%] text-emerald-400/80">HASH: {block.entry_hash}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        )}

        {/* Footer Status Bar */}
        <div className="bg-zinc-950 border-t border-emerald-500/30 px-4 py-2 flex items-center justify-between text-[10px] text-zinc-400 z-10 shrink-0">
          <span>PORT: 8000 (FASTAPI SSE STREAM)</span>
          <span className="text-emerald-400">ENCRYPTION: ED25519 + SHA-256 MERKLE</span>
        </div>

      </div>
    </div>
  );
}
