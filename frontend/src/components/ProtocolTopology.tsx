"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap,
  BackgroundVariant, 
  Handle, 
  Position, 
  Node, 
  Edge,
  NodeProps,
  applyNodeChanges,
  NodeChange
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
  Activity,
  AlertTriangle,
  RotateCcw
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

// Error Boundary
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Topology ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center space-y-4 bg-zinc-950/80 border border-zinc-800 rounded-2xl">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/50 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-white font-mono">Topology stream error</h4>
            <p className="text-xs text-zinc-400 max-w-sm">
              Click below to retry and reconnect the protocol topology stream.
            </p>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold transition-all shadow-md hover:scale-[1.02]"
          >
            ↻ Retry Stream
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initial node positions constant for layout reset
const DEFAULT_POSITIONS: Record<string, { x: number; y: number }> = {
  human: { x: 40, y: 220 },
  policy: { x: 300, y: 110 },
  passport: { x: 300, y: 330 },
  buyer: { x: 580, y: 110 },
  merchant: { x: 580, y: 330 },
  gate: { x: 880, y: 80 },
  razorpay: { x: 880, y: 240 },
  ledger: { x: 880, y: 400 },
};

const INITIAL_NODES: Node[] = [
  // Column 1: HUMAN
  {
    id: "human",
    type: "protocol",
    position: DEFAULT_POSITIONS.human,
    data: { label: "HUMAN", sub: "Sets intent + leash", icon: "User", status: "idle" },
  },
  // Column 2: POLICY, PASSPORT
  {
    id: "policy",
    type: "protocol",
    position: DEFAULT_POSITIONS.policy,
    data: { label: "POLICY", sub: "NL → JSON mandate", icon: "FileJson", status: "idle" },
  },
  {
    id: "passport",
    type: "protocol",
    position: DEFAULT_POSITIONS.passport,
    data: { label: "PASSPORT", sub: "Ed25519 signed", icon: "KeyRound", status: "idle" },
  },
  // Column 3: BUYER, MERCHANT
  {
    id: "buyer",
    type: "protocol",
    position: DEFAULT_POSITIONS.buyer,
    data: { label: "BUYER AGENT", sub: "Gemini negotiator", icon: "Bot", status: "idle" },
  },
  {
    id: "merchant",
    type: "protocol",
    position: DEFAULT_POSITIONS.merchant,
    data: { label: "MERCHANT AGENT", sub: "ZOPA + reserve floor", icon: "Store", status: "idle" },
  },
  // Column 4: GATE, RAZORPAY, LEDGER
  {
    id: "gate",
    type: "protocol",
    position: DEFAULT_POSITIONS.gate,
    data: { label: "DOUBLE GATE", sub: "Semantic + Deterministic", icon: "ShieldCheck", status: "idle" },
  },
  {
    id: "razorpay",
    type: "protocol",
    position: DEFAULT_POSITIONS.razorpay,
    data: { label: "RAZORPAY RAILS", sub: "Orders + Links", icon: "CreditCard", status: "idle" },
  },
  {
    id: "ledger",
    type: "protocol",
    position: DEFAULT_POSITIONS.ledger,
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
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Enable dragging: update node positions when dragged
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    []
  );

  // Reset node positions back to DEFAULT_POSITIONS without affecting live status colors
  const resetLayout = useCallback(() => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        position: DEFAULT_POSITIONS[n.id] ?? n.position,
      }))
    );
  }, []);

  useEffect(() => {
    // Guard against double-mount by creating inside effect and closing in cleanup
    const eventSource = new EventSource("http://localhost:8000/api/ledger");

    // Helper to register timer for cleanup
    const registerTimer = (fn: () => void, ms: number) => {
      const t = setTimeout(fn, ms);
      timersRef.current.push(t);
      return t;
    };

    eventSource.onmessage = (event) => {
      // 1. Entire body wrapped in try/catch to NEVER throw
      try {
        let block: Record<string, unknown> | null = null;
        try {
          block = JSON.parse(event.data);
        } catch {
          return;
        }

        // 5. Guard all property access
        const action = String(block?.action ?? "").toUpperCase();
        const gate = String(block?.gate_result ?? "").toUpperCase();

        const nodeStatusUpdates: Record<string, NodeStatus> = {};
        const edgeUpdates: Record<string, { stroke: string; animated?: boolean; strokeDasharray?: string }> = {};

        // action contains MANDATE or POLICY → POLICY node active for 3s, HUMAN→POLICY edge animated cyan
        if (action.includes("MANDATE") || action.includes("POLICY")) {
          nodeStatusUpdates["policy"] = "active";
          nodeStatusUpdates["human"] = "active";
          edgeUpdates["human-policy"] = { stroke: "#06b6d4", animated: true };
        }

        // PASSPORT_ISSUED → PASSPORT node active
        if (action.includes("PASSPORT")) {
          nodeStatusUpdates["passport"] = "active";
          edgeUpdates["policy-passport"] = { stroke: "#06b6d4", animated: true };
          edgeUpdates["passport-buyer"] = { stroke: "#06b6d4", animated: true };
        }

        // action contains QUERY_CATALOG, REQUEST_PRICE, COUNTER_OFFER, NEGOTIATION → BUYER and MERCHANT active, negotiation edge amber
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

        // action contains SEMANTIC or FINANCIAL or GATE → GATE node pass or fail
        if (action.includes("SEMANTIC") || action.includes("FINANCIAL") || action.includes("GATE")) {
          const isPass = gate === "PASS" || action.includes("PASSED");
          nodeStatusUpdates["gate"] = isPass ? "pass" : "fail";
          edgeUpdates["buyer-gate"] = { stroke: isPass ? "#10b981" : "#ef4444", animated: true };
          edgeUpdates["merchant-gate"] = { stroke: isPass ? "#10b981" : "#ef4444", animated: true };
        }

        // action contains ORDER or PAYMENT_EXECUTED → RAZORPAY pass, money edge green
        if (action.includes("ORDER") || action.includes("PAYMENT_EXECUTED") || action.includes("SETTLED")) {
          nodeStatusUpdates["gate"] = "pass";
          nodeStatusUpdates["razorpay"] = "pass";
          edgeUpdates["money"] = { stroke: "#10b981", animated: true, strokeDasharray: undefined };
          edgeUpdates["razorpay-ledger"] = { stroke: "#10b981", animated: true };
        }

        // action contains ATTACK or BLOCKED or KILL → GATE fail, money edge red dashed, NOT animated
        if (action.includes("ATTACK") || action.includes("BLOCKED") || action.includes("KILL") || gate === "FAIL") {
          nodeStatusUpdates["gate"] = "fail";
          edgeUpdates["money"] = { stroke: "#ef4444", strokeDasharray: "5 5", animated: false };
        }

        // Every event → LEDGER node pulses active for 1s
        nodeStatusUpdates["ledger"] = "active";
        edgeUpdates["gate-ledger"] = { stroke: "#818cf8", animated: true };

        // 2. NEVER replace nodes/edges arrays wholesale. Only mutate via functional updates
        setNodes((prevNodes) =>
          prevNodes.map((n) => {
            if (nodeStatusUpdates[n.id]) {
              return { ...n, data: { ...n.data, status: nodeStatusUpdates[n.id] } };
            }
            return n;
          })
        );

        setEdges((prevEdges) =>
          prevEdges.map((e) => {
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

        // Reset ledger node status after 1s
        registerTimer(() => {
          setNodes((prevNodes) =>
            prevNodes.map((n) => (n.id === "ledger" ? { ...n, data: { ...n.data, status: "idle" } } : n))
          );
        }, 1000);

        // Reset updated nodes back to idle after 3s
        const updatedNodeKeys = Object.keys(nodeStatusUpdates);
        const updatedEdgeKeys = Object.keys(edgeUpdates);

        registerTimer(() => {
          setNodes((prevNodes) =>
            prevNodes.map((n) => {
              if (updatedNodeKeys.includes(n.id) && n.id !== "ledger") {
                return { ...n, data: { ...n.data, status: "idle" } };
              }
              return n;
            })
          );
          setEdges((prevEdges) =>
            prevEdges.map((e) => {
              if (updatedEdgeKeys.includes(e.id)) {
                return {
                  ...e,
                  animated: false,
                  style: { stroke: "#4b5563", strokeWidth: 2, strokeDasharray: undefined },
                };
              }
              return e;
            })
          );
        }, 3000);

      } catch (e) {
        console.warn("topology event skipped", e);
      }
    };

    // 3 & 4. Cleanup on unmount: close EventSource and clear ALL registered timers
    return () => {
      eventSource.close();
      timersRef.current.forEach((id) => clearTimeout(id));
      timersRef.current = [];
    };
  }, []);

  return (
    /* Sizing wrapper div */
    <div className="h-[calc(100vh-240px)] min-h-[540px] w-full flex flex-col glass-card border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
      {/* ── TOP LEGEND & CONTROLS ROW ── */}
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

        <div className="flex flex-wrap items-center gap-3">
          {/* Legend: 🟢 pass · 🔴 blocked · 🟡 negotiating · ⚪ idle */}
          <div className="flex items-center gap-3 text-xs font-mono text-zinc-400 bg-zinc-900/80 px-3.5 py-1.5 rounded-xl border border-zinc-800">
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

          {/* Reset Layout button */}
          <button
            type="button"
            onClick={resetLayout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-mono transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Reset node layout to original positions"
          >
            <RotateCcw size={13} className="text-indigo-400" />
            <span>⟲ Reset Layout</span>
          </button>
        </div>
      </div>

      {/* ── GRAPH CANVAS WITH ERROR BOUNDARY ── */}
      <div className="flex-1 w-full relative bg-[#09090e]">
        {/* Tiny hint chip in top-right corner */}
        <div className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 text-[11px] font-mono text-zinc-400 backdrop-blur-md shadow-lg pointer-events-none flex items-center gap-1.5">
          <span>🖱️ Drag nodes · Scroll to zoom · ⟲ to reset</span>
        </div>

        <ErrorBoundary>
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            fitView 
            panOnDrag={true}
            zoomOnScroll={true}
            colorMode="dark"
            nodesConnectable={false}
            edgesReconnectable={false}
            proOptions={{ hideAttribution: true }}
            minZoom={0.5}
            maxZoom={1.6}
          >
            <Background variant={BackgroundVariant.Dots} gap={24} color="#1e1e30" />
            <Controls className="!bg-zinc-900 !border-zinc-800 !fill-zinc-400 [&>button]:!border-zinc-800" />
            <MiniMap 
              className="!bg-zinc-900/90 !border !border-zinc-800 !rounded-xl overflow-hidden" 
              nodeColor={(n) => {
                const s = (n.data as unknown as ProtocolNodeData)?.status;
                if (s === "active") return "#06b6d4";
                if (s === "pass") return "#22c55e";
                if (s === "fail") return "#ef4444";
                return "#3f3f46";
              }}
              maskColor="rgba(9, 9, 14, 0.7)"
            />
          </ReactFlow>
        </ErrorBoundary>
      </div>
    </div>
  );
}

