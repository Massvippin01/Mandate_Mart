"use client";

import { useRef, useState } from "react";

export interface PassportData {
  mandate_id: string;
  agent_id: string;
  intent: string;
  max_budget: number;
  spent: number;
  remaining: number;
  ed25519_public_key: string;
  ed25519_signature: string;
  merkle_root_hash: string;
  total_ledger_blocks: number;
  semantic_audit: string;
  financial_audit: string;
  payment_ref: string;
  timestamp: string;
  verification_url: string;
  status: string;
}

interface Props {
  data: PassportData;
  onClose: () => void;
}

export default function TransactionPassport({ data, onClose }: Props) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const downloadPNG = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(receiptRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#09090b",
      });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `MandateMart_Passport_${data.mandate_id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to generate passport image:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-xl w-full space-y-4 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Modal Controls */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-indigo-400">
              Enterprise Cryptographic Artifact
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-mono rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition"
          >
            ✕ Close
          </button>
        </div>

        {/* Printable Card Area */}
        <div
          ref={receiptRef}
          className="bg-zinc-950 border-2 border-indigo-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden font-mono text-zinc-100"
          style={{
            backgroundImage: "radial-gradient(ellipse at top right, rgba(99, 102, 241, 0.15), transparent 60%)"
          }}
        >
          {/* Watermark Grid Lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

          {/* Header */}
          <div className="border-b border-indigo-500/30 pb-4 mb-5 flex items-start justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-black rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 uppercase">
                  Agentic Commerce Standard
                </span>
                <span className="text-[10px] text-zinc-400">NPCI UAP / AP2 Compliant</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1 tracking-tight">
                MANDATEMART <span className="text-indigo-400">TRANSACTION PASSPORT</span>
              </h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Cryptographically Chained Audit Artifact • Ed25519 & Merkle Proved
              </p>
            </div>

            {/* Stylized Security Stamp */}
            <div className="text-right shrink-0">
              <div className="px-3 py-1 rounded-lg border-2 border-emerald-500/60 bg-emerald-950/40 text-emerald-400 text-xs font-black tracking-wider uppercase inline-block">
                VERIFIED ✓
              </div>
              <div className="text-[9px] text-zinc-400 mt-1">Status: {data.status}</div>
            </div>
          </div>

          {/* Core Body Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10 text-xs mb-5">
            <div className="sm:col-span-2 space-y-3">
              <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1">
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Delegated Intent</span>
                <p className="text-zinc-100 font-sans font-medium text-xs line-clamp-2">
                  &ldquo;{data.intent}&rdquo;
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <span className="text-[10px] text-zinc-400 uppercase block">Mandate Ceiling</span>
                  <span className="text-sm font-bold text-white">₹{data.max_budget}</span>
                </div>
                <div className="p-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                  <span className="text-[10px] text-zinc-400 uppercase block">Final Settlement</span>
                  <span className="text-sm font-bold text-emerald-400">₹{data.spent}</span>
                </div>
              </div>

              <div className="p-2.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
                <span className="text-[10px] text-zinc-400 uppercase block">Razorpay Order Reference</span>
                <span className="text-xs text-indigo-300 font-semibold truncate block">{data.payment_ref}</span>
              </div>
            </div>

            {/* Cyberpunk QR & Block Info */}
            <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl flex flex-col items-center justify-between text-center">
              <span className="text-[9px] text-zinc-400 uppercase font-bold">Cryptographic Anchor</span>
              
              {/* Stylized QR Matrix */}
              <div className="w-24 h-24 p-2 my-1 bg-white rounded-lg flex flex-col justify-between shadow-inner">
                <div className="grid grid-cols-6 gap-0.5 w-full h-full">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className={`${
                        (i % 2 === 0 && i % 3 !== 0) || i < 7 || i > 28 || i === 14 || i === 21
                          ? "bg-black"
                          : "bg-zinc-200"
                      } rounded-[1px]`}
                    />
                  ))}
                </div>
              </div>

              <div className="text-[9px] text-zinc-400 truncate max-w-full">
                {data.mandate_id}
              </div>
            </div>
          </div>

          {/* Cryptographic Proof Block */}
          <div className="p-4 bg-zinc-900/90 border border-indigo-500/30 rounded-2xl space-y-2 relative z-10 text-[11px]">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 pb-1 border-b border-zinc-800">
              <span className="font-bold text-indigo-300 uppercase">Cryptographic Audit Proofs</span>
              <span>Ledger Depth: {data.total_ledger_blocks} Blocks</span>
            </div>

            <div className="space-y-1 text-[10px]">
              <div className="flex justify-between items-center gap-2">
                <span className="text-zinc-400">Merkle Root Hash:</span>
                <span className="text-indigo-400 font-bold truncate max-w-[240px]">
                  {data.merkle_root_hash}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-zinc-400">Ed25519 Public Key:</span>
                <span className="text-zinc-300 truncate max-w-[240px]">
                  {data.ed25519_public_key}
                </span>
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-zinc-400">Signature Hash:</span>
                <span className="text-emerald-400 truncate max-w-[240px]">
                  {data.ed25519_signature}
                </span>
              </div>
            </div>
          </div>

          {/* Footer Timestamp */}
          <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between text-[10px] text-zinc-400 relative z-10">
            <span>Issued: {new Date(data.timestamp).toUTCString()}</span>
            <span className="text-indigo-400">SECURED BY RAZORPAY TEST RAILS</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={downloadPNG}
            disabled={downloading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            <span>📥</span>
            <span>{downloading ? "Rendering Image..." : "Download Cryptographic Passport (PNG)"}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
