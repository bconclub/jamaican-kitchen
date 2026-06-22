import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  MarkerType,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { PageHeader } from "@/components/PageHeader";

export const Route = createFileRoute("/_app/system")({ component: SystemPage });

// Palette per layer
const C = {
  customer: { background: "#16a34a", color: "white", border: "#15803d" },
  rpc: { background: "#f59e0b", color: "#1c1917", border: "#d97706" },
  db: { background: "#2563eb", color: "white", border: "#1d4ed8" },
  realtime: { background: "#7c3aed", color: "white", border: "#6d28d9" },
  admin: { background: "#0d9488", color: "white", border: "#0f766e" },
  auth: { background: "#475569", color: "white", border: "#334155" },
  pending: { background: "#e5e7eb", color: "#6b7280", border: "#9ca3af" },
};

function node(id: string, label: string, x: number, y: number, c: typeof C.db, w = 190): Node {
  return {
    id,
    position: { x, y },
    data: { label },
    style: {
      background: c.background,
      color: c.color,
      border: `1px solid ${c.border}`,
      borderRadius: 10,
      fontSize: 12,
      fontWeight: 600,
      width: w,
      padding: 10,
      textAlign: "center" as const,
      whiteSpace: "pre-line" as const,
    },
  };
}

const NODES: Node[] = [
  // Customer layer (website)
  node("web-order", "🛒 Website — Order page\n(cart + checkout)", 0, 40, C.customer),
  node("web-cater", "🎉 Website — Catering form", 0, 180, C.customer),
  node("web-contact", "✉️ Website — Contact form", 0, 300, C.customer),
  node("web-menu", "📖 Website — Menu (reads live)", 0, 420, C.customer),

  // RPC / write layer
  node("rpc", "place_order() RPC\nSECURITY DEFINER", 260, 40, C.rpc),
  node("cater-insert", "insert catering_requests", 260, 180, C.rpc),
  node("contact-insert", "insert contact_messages", 260, 300, C.rpc),

  // Database layer
  node("db-orders", "🗄️ orders + order_items\n+ order_status_events", 520, 40, C.db),
  node("db-cater", "🗄️ catering_requests", 520, 180, C.db),
  node("db-contact", "🗄️ contact_messages\n(pending apply)", 520, 300, C.pending),
  node("db-menu", "🗄️ menu_items + locations", 520, 420, C.db),

  // Realtime + security
  node("realtime", "⚡ Supabase Realtime\n(postgres_changes)", 800, 40, C.realtime),
  node("auth", "🔐 Auth + user_roles + RLS\n(staff-only reads)", 800, 470, C.auth, 220),

  // Admin layer
  node("adm-orders", "📊 Admin — Live Orders feed", 1080, 40, C.admin),
  node("adm-cater", "📊 Admin — Catering", 1080, 180, C.admin),
  node("adm-msgs", "📊 Admin — Messages\n(pending)", 1080, 300, C.pending),
  node("adm-menu", "📊 Admin — Menu / Locations", 1080, 420, C.admin),

  // Staff action loop
  node("staff", "👩‍🍳 Staff actions\naccept / ready / cancel", 1080, 560, C.admin),
];

const e = (id: string, s: string, t: string, label?: string, animated = false, dashed = false): Edge => ({
  id,
  source: s,
  target: t,
  label,
  animated,
  markerEnd: { type: MarkerType.ArrowClosed },
  style: dashed ? { strokeDasharray: "5 5", stroke: "#94a3b8" } : undefined,
  labelStyle: { fontSize: 10, fill: "#475569" },
  labelBgStyle: { fill: "#f1f5f9" },
});

const EDGES: Edge[] = [
  e("e1", "web-order", "rpc", "place order", true),
  e("e2", "rpc", "db-orders", "insert"),
  e("e3", "db-orders", "realtime", "change event", true),
  e("e4", "realtime", "adm-orders", "live push", true),
  e("e5", "adm-orders", "staff", "act on order"),
  e("e6", "staff", "db-orders", "update status", true),

  e("e7", "web-cater", "cater-insert", "submit"),
  e("e8", "cater-insert", "db-cater"),
  e("e9", "db-cater", "adm-cater", "read"),

  e("e10", "web-contact", "contact-insert", "submit"),
  e("e11", "contact-insert", "db-contact"),
  e("e12", "db-contact", "adm-msgs", "read"),

  e("e13", "db-menu", "web-menu", "read menu", false, false),
  e("e14", "db-menu", "adm-menu", "manage"),

  e("e15", "auth", "adm-orders", "RLS gate", false, true),
  e("e16", "auth", "adm-cater", "RLS gate", false, true),
  e("e17", "auth", "adm-menu", "RLS gate", false, true),
];

function SystemPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const nodes = useMemo(() => NODES, []);
  const edges = useMemo(() => EDGES, []);

  return (
    <div>
      <PageHeader
        title="System Flow"
        description="End-to-end data flow: website → Supabase → realtime → admin. Green = customer, amber = write, blue = database, purple = realtime, teal = admin."
      />
      <div className="rounded-lg border bg-card" style={{ height: "72vh" }}>
        {mounted ? (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            nodesDraggable
            proOptions={{ hideAttribution: true }}
          >
            <Background />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading system map…
          </div>
        )}
      </div>
    </div>
  );
}
