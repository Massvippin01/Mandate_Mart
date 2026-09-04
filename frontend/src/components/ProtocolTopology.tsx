"use client";

import React, { useEffect, useState } from "react";
import { 
  ReactFlow, 
  Background, 
  Controls, 
  BackgroundVariant, 
  Handle, 
  Position, 
  Node, 
  Edge,
  NodeProps 
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { 
  User, 
  FileJson, 
  KeyRound, 
  Bot, 
  Store, 
  ShieldCheck, 
  CreditCard, 
  Link2,
  LucideIcon,
  Activity
} from "lucide-react";

// Icon mapping
const ICON_MAP: Record<string, LucideIcon> = {
  User,
  FileJson,
  KeyRound,
  Bot,
  Store,
  ShieldCheck,
  CreditCard,
  Link2,
};

export type NodeStatus = "idle" | "active" | "pass" | "fail";

export interface ProtocolNodeData {
  label: string;
  sub: string;
  icon: string;
  status: NodeStatus;
  [key: string]: unknown;
}

// Custom ProtocolNode
const ProtocolNode = ({ data }: NodeProps) => {
  const nodeData = data as unknown as ProtocolNodeData;
  const IconComponent = ICON_MAP[nodeData.icon] || Bot;
  const status = nodeData.status || "idle";

  // Status-based styling
  let containerStyle = "border-gray-700 bg-gray-900/90 text-gray-200 shadow-lg";
  let dotStyle = "bg-gray-500";
  let iconStyle = "text-gray-400 bg-gray-800/80 border-gray-700";

  if (status === "active") {
    containerStyle = "border-cyan-400 bg-cyan-950/40 text-cyan-100 shadow-[0_0_22px_rgba(6,182,212,0.4)] ring-1 ring-cyan-500/50";
    dotStyle = "bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.9)]";
    iconStyle = "text-cyan-400 bg-cyan-900/40 border-cyan-500/40";
  } else if (status === "pass") {
    containerStyle = "border-green-500 bg-emerald-950/40 text-emerald-100 shadow-[0_0_22px_rgba(34,197,94,0.4)] ring-1 ring-green-500/50";
    dotStyle = "bg-green-400 shadow-[0_0_8px_rgba(34,197,94,0.9)]";
    iconStyle = "text-green-400 bg-green-900/40 border-green-500/40";
  } else if (status === "fail") {
    containerStyle = "border-red-500 bg-rose-950/40 text-rose-100 shadow-[0_0_22px_rgba(239,68,68,0.4)] ring-1 ring-red-500/50";
    dotStyle = "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]";
    iconStyle = "text-red-400 bg-rose-900/40 border-red-500/40";
  }

  return (
    <div className={`relative px-4 py-3.5 rounded-2xl border transition-all duration-300 min-w-[210px] backdrop-blur-md ${containerStyle}`}>
      {/* Target Handles */}
      <Handle type="target" position={Position.Left} className="w-2.5 h-2.5 !bg-zinc-600 !border-zinc-800" />
      <Handle type="target" position={Position.Top} id="top-target" className="w-2.5 h-2.5 !bg-zinc-600 !border-zinc-800" />
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="w-2.5 h-2.5 !bg-zinc-600 !border-zinc-800" />

      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${iconStyle}`}>
          <IconComponent size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1.5">
            <span className="font-bold text-xs tracking-tight truncate">{nodeData.label}</span>
            <span className={`w-2 h-2 rounded-full shrink-0 ${dotStyle}`} />
          </div>
          <div className="text-[10px] text-zinc-400 truncate mt-0.5 font-mono">{nodeData.sub}</div>
        </div>
      </div>

      {/* Source Handles */}
      <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 !bg-zinc-600 !border-zinc-800" />
      <Handle type="source" position={Position.Bottom} id="bottom-source" className="w-2.5 h-2.5 !bg-zinc-600 !border-zinc-800" />
      <Handle type="source" position={Position.Top} id="top-source" className="w-2.5 h-2.5 !bg-zinc-600 !border-zinc-800" />
    </div>
  );
};

const INITIAL_NODES: Node[] = [
  // Column 1: HUMAN
  {
    id: "human",
    type: "protocol",
    position: { x: 40, y: 220 },
    data: { label: "HUMAN", sub: "Sets intent + leash", icon: "User", status: "idle" },
  },
  // Column 2: POLICY, PASSPORT
  {
    id: "policy",
    type: "protocol",
    position: { x: 300, y: 110 },
    data: { label: "POLICY", sub: "NL → JSON mandate", icon: "FileJson", status: "idle" },
  },
  {
    id: "passport",
    type: "protocol",
    position: { x: 300, y: 330 },
    data: { label: "PASSPORT", sub: "Ed25519 signed", icon: "KeyRound", status: "idle" },
  },
  // Column 3: BUYER, MERCHANT
  {
    id: "buyer",
    type: "protocol",
    position: { x: 580, y: 110 },
    data: { label: "BUYER AGENT", sub: "Gemini negotiator", icon: "Bot", status: "idle" },
  },
  {
    id: "merchant",
    type: "protocol",
    position: { x: 580, y: 330 },
    data: { label: "MERCHANT AGENT", sub: "ZOPA + reserve floor", icon: "Store", status: "idle" },
  },
  // Column 4: GATE, RAZORPAY, LEDGER
  {
    id: "gate",
    type: "protocol",
    position: { x: 880, y: 80 },
    data: { label: "DOUBLE GATE", sub: "Semantic + Deterministic", icon: "ShieldCheck", status: "idle" },
  },
  {
    id: "razorpay",
    type: "protocol",
    position: { x: 880, y: 240 },
    data: { label: "RAZORPAY RAILS", sub: "Orders + Links", icon: "CreditCard", status: "idle" },
  },
  {
    id: "ledger",
    type: "protocol",
    position: { x: 880, y: 400 },
    data: { label: "MERKLE LEDGER", sub: "SHA-256 chain", icon: "Link2", status: "idle" },
  },
];

const INITIAL_EDGES: Edge[] = [
  { id: "human-policy", source: "human", target: "policy", animated: false, style: { stroke: "#4b5563", strokeWidth: 2 } },
  { id: "policy-passport", source: "policy", target: "passport", sourceHandle: "bottom-source", targetHandle: "top-target", animated: false, style: { stroke: "#4b5563", strokeWidth: 2 } },
  { id: "passport-buyer", source: "passport", target: "buyer", animated: false, style: { stroke: "#4b5563", strokeWidth: 2 } },
  { id: "negotiation", source: "buyer", target: "merchant", sourceHandle: "bottom-source", targetHandle: "top-target", animated: false, style: { stroke: "#4b5563", strokeWidth: 2 } },
  { id: "buyer-gate", source: "buyer", target: "gate", animated: false, style: { stroke: "#4b5563", strokeWidth: 2 } },
  { id: "merchant-gate", source: "merchant", target: "gate", animated: false, style: { stroke: "#4b5563", strokeWidth: 2 } },
  { id: "money", source: "gate", target: "razorpay", sourceHandle: "bottom-source", targetHandle: "top-target", animated: false, style: { stroke: "#4b5563", strokeWidth: 2 } },
  { id: "gate-ledger", source: "gate", target: "ledger", animated: false, style: { stroke: "#4b5563", strokeWidth: 2 } },
  { id: "razorpay-ledger", source: "razorpay", target: "ledger", sourceHandle: "bottom-source", targetHandle: "top-target", animated: false, style: { stroke: "#4b5563", strokeWidth: 2 } },
];

const nodeTypes = {
  protocol: ProtocolNode,
};

export default function ProtocolTopology() {
  const [nodes, setNodes] = useState<Node[]>(INITIAL_NODES);
  const [edges, setEdges] = useState<Edge[]>(INITIAL_EDGES);

  useEffect(() => {
    const eventSource = new EventSource("http://localhost:8000/api/ledger");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const action = (data.action || "").toUpperCase();
        const gateResult = (data.gate_result || "").toUpperCase();

        const nodeStatusUpdates: Record<string, NodeStatus> = {};
        const edgeUpdates: Record<string, { stroke: string; animated?: boolean; strokeDasharray?: string }> = {};

        // 1. MANDATE or POLICY → POLICY node active, HUMAN→POLICY edge animated cyan
        if (action.includes("MANDATE") || action.includes("POLICY")) {
          nodeStatusUpdates["policy"] = "active";
          nodeStatusUpdates["human"] = "active";
          edgeUpdates["human-policy"] = { stroke: "#06b6d4", animated: true };
        }

        // 2. PASSPORT_ISSUED → PASSPORT node active
        if (action.includes("PASSPORT")) {
          nodeStatusUpdates["passport"] = "active";
          edgeUpdates["policy-passport"] = { stroke: "#06b6d4", animated: true };
          edgeUpdates["passport-buyer"] = { stroke: "#06b6d4", animated: true };
        }

        // 3. QUERY_CATALOG, REQUEST_PRICE, COUNTER_OFFER, NEGOTIATION → BUYER and MERCHANT active, negotiation edge amber
        if (
          action.includes("QUERY_CATALOG") ||
          action.includes("REQUEST_PRICE") ||
          action.includes("COUNTER_OFFER") ||
          action.includes("NEGOTIATION") ||
          action.includes("BARGAIN") ||
          action.includes("PROPOSE")
        ) {
          nodeStatusUpdates["buyer"] = "active";
          nodeStatusUpdates["merchant"] = "active";
          edgeUpdates["negotiation"] = { stroke: "#f59e0b", animated: true };
        }

        // 4. SEMANTIC or FINANCIAL or GATE → GATE node pass or fail
        if (action.includes("SEMANTIC") || action.includes("FINANCIAL") || action.includes("GATE")) {
          const isPass = gateResult === "PASS" || action.includes("PASSED");
          nodeStatusUpdates["gate"] = isPass ? "pass" : "fail";
          edgeUpdates["buyer-gate"] = { stroke: isPass ? "#10b981" : "#ef4444", animated: true };
          edgeUpdates["merchant-gate"] = { stroke: isPass ? "#10b981" : "#ef4444", animated: true };
        }

        // 5. ORDER or PAYMENT_EXECUTED → RAZORPAY pass, money edge green
        if (action.includes("ORDER") || action.includes("PAYMENT_EXECUTED") || action.includes("SETTLED")) {
          nodeStatusUpdates["gate"] = "pass";
          nodeStatusUpdates["razorpay"] = "pass";
          edgeUpdates["money"] = { stroke: "#10b981", animated: true, strokeDasharray: undefined };
          edgeUpdates["razorpay-ledger"] = { stroke: "#10b981", animated: true };
        }

        // 6. ATTACK or BLOCKED or KILL → GATE fail, money edge red dashed, NOT animated
        if (action.includes("ATTACK") || action.includes("BLOCKED") || action.includes("KILL") || gateResult === "FAIL") {
          nodeStatusUpdates["gate"] = "fail";
          edgeUpdates["money"] = { stroke: "#ef4444", strokeDasharray: "5 5", animated: false };
        }

        // 7. Every event → LEDGER node pulses active for 1s
        nodeStatusUpdates["ledger"] = "active";
        edgeUpdates["gate-ledger"] = { stroke: "#818cf8", animated: true };

        // Apply node updates
        setNodes((prev) =>
          prev.map((n) => {
            if (nodeStatusUpdates[n.id]) {
              return { ...n, data: { ...n.data, status: nodeStatusUpdates[n.id] } };
            }
            return n;
          })
        );

        // Apply edge updates
        setEdges((prev) =>
          prev.map((e) => {
            if (edgeUpdates[e.id]) {
              return {
                ...e,
                animated: edgeUpdates[e.id].animated ?? false,
                style: {
                  ...e.style,
                  stroke: edgeUpdates[e.id].stroke,
                  strokeDasharray: edgeUpdates[e.id].strokeDasharray,
                  strokeWidth: 2.5,
                },
              };
            }
            return e;
          })
        );

        // Reset ledger status after 1s
        setTimeout(() => {
          setNodes((prev) =>
            prev.map((n) => (n.id === "ledger" ? { ...n, data: { ...n.data, status: "idle" } } : n))
          );
        }, 1000);

        // Reset all statuses after 3s
        setTimeout(() => {
          setNodes((prev) =>
            prev.map((n) => ({ ...n, data: { ...n.data, status: "idle" } }))
          );
          setEdges((prev) =>
            prev.map((e) => ({
              ...e,
              animated: false,
              style: { stroke: "#4b5563", strokeWidth: 2, strokeDasharray: undefined },
            }))
          );
        }, 3000);

      } catch (err) {
        console.error("SSE parse error in ProtocolTopology:", err);
      }
    };

    return () => eventSource.close();
  }, []);

  return (
    <div className="h-[calc(100vh-140px)] w-full flex flex-col glass-card border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
      {/* ── TOP LEGEND ROW ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-zinc-950/90 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-mono text-xs font-bold shadow-inner">
            <Activity size={14} className="animate-pulse" />
            <span>PROTOCOL TOPOLOGY</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>LIVE A2A TOPOLOGY</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono text-zinc-400 bg-zinc-900/80 px-4 py-1.5 rounded-xl border border-zinc-800">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" /> pass
          </span>
          <span className="text-zinc-600">•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" /> blocked
          </span>
          <span className="text-zinc-600">•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" /> negotiating
          </span>
          <span className="text-zinc-600">•</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-500" /> idle
          </span>
        </div>
      </div>

      {/* ── GRAPH CANVAS ── */}
      <div className="flex-1 w-full relative bg-[#09090e]">
        <ReactFlow 
          nodes={nodes} 
          edges={edges} 
          nodeTypes={nodeTypes} 
          fitView 
          proOptions={{ hideAttribution: true }}
          minZoom={0.6}
          maxZoom={1.4}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} color="#1e1e30" />
          <Controls showInteractive={false} className="!bg-zinc-900 !border-zinc-800 !fill-zinc-400 [&>button]:!border-zinc-800" />
        </ReactFlow>
      </div>
    </div>
  );
}
