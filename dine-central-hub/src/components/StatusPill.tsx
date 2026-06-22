import { STATUS_META } from "@/lib/mock-data";
import type { OrderStatus } from "@/lib/types";

const TONE: Record<string, string> = {
  info: "bg-info/10 text-info border-info/30",
  warning: "bg-warning/15 text-warning-foreground border-warning/40",
  success: "bg-success/10 text-success border-success/30",
  muted: "bg-muted text-muted-foreground border-border",
  danger: "bg-destructive/10 text-destructive border-destructive/30",
};

export function StatusPill({ status }: { status: OrderStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONE[m.tone]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {m.label}
    </span>
  );
}