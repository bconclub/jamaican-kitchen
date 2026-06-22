import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChannelBadge } from "@/components/ChannelBadge";
import { StatusPill } from "@/components/StatusPill";
import { PageHeader, formatMoney } from "@/components/PageHeader";
import { CHANNEL_META, LOCATIONS, ORDERS, STATUS_META } from "@/lib/mock-data";
import { useCurrentLocation } from "@/lib/store";
import type { Channel, OrderStatus } from "@/lib/types";
import { Check, X, ChefHat, CheckCheck, Search, ListFilter, Timer } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";

// Deterministic mock helpers — duration, staff comments, customer reviews.
function durationMinutes(o: { id: string; status: OrderStatus; createdAt: string }) {
  const seed = [...o.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  if (o.status === "completed") return 18 + (seed % 22); // 18-39 min total
  if (o.status === "cancelled") return 4 + (seed % 8);
  // in-progress: time elapsed since creation
  return Math.max(1, Math.round((Date.now() - new Date(o.createdAt).getTime()) / 60000));
}
// Live elapsed time in seconds since order placed — used for ticking countdown.
function liveElapsedSeconds(createdAt: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
}
function formatHMS(totalSeconds: number) {
  const s = Math.max(0, totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}
function isFinal(s: OrderStatus) {
  return s === "completed" || s === "cancelled";
}
const STAFF_NOTES = [
  "Double oxtail, extra gravy on the side.",
  "Customer is a regular — please prioritise.",
  "Allergy: shellfish. Confirmed with kitchen.",
  "Running 5 min behind, courier notified.",
  "Repacked patties — first batch was cold.",
];
const REVIEWS = [
  { rating: 5, text: "Best jerk chicken in CT, hands down." },
  { rating: 4, text: "Great food, slight delay on pickup." },
  { rating: 5, text: "Oxtail was fall-off-the-bone perfect." },
  { rating: 3, text: "Tasty but the rice was a bit dry today." },
  { rating: 5, text: "Festival was warm and fluffy 🔥" },
];
function staffNoteFor(id: string) {
  const seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  return STAFF_NOTES[seed % STAFF_NOTES.length];
}
function reviewFor(id: string) {
  const seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  return REVIEWS[seed % REVIEWS.length];
}
export { durationMinutes, isFinal, staffNoteFor, reviewFor, liveElapsedSeconds, formatHMS };

export const Route = createFileRoute("/_app/orders")({
  component: OrdersPage,
});

const ALL_STATUSES = Object.keys(STATUS_META) as OrderStatus[];
const ALL_CHANNELS = Object.keys(CHANNEL_META) as Channel[];

function OrdersPage() {
  const loc = useCurrentLocation();
  const [channelFilter, setChannelFilter] = useState<Channel | "all">("all");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [q, setQ] = useState("");
  // Tick once per second so live durations update in place.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    return ORDERS.filter((o) => {
      if (loc !== "all" && o.locationId !== loc) return false;
      if (channelFilter !== "all" && o.channel !== channelFilter) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (q && !(o.shortId.includes(q) || o.customerName.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [loc, channelFilter, statusFilter, q]);

  const counts = ALL_STATUSES.map((s) => ({
    status: s,
    count: ORDERS.filter((o) => (loc === "all" || o.locationId === loc) && o.status === s).length,
  }));

  return (
    <>
      <PageHeader
        title="Live Orders"
        description="Unified feed across every sales channel"
        actions={
          <Button onClick={() => toast.success("Refreshed feed")}>Refresh</Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7 mb-4">
        <button
          onClick={() => setStatusFilter("all")}
          className={`rounded-lg border bg-card p-3 text-left transition hover:border-primary ${statusFilter === "all" ? "border-primary" : ""}`}
        >
          <div className="text-xs text-muted-foreground">All</div>
          <div className="text-2xl font-semibold">{ORDERS.filter((o) => loc === "all" || o.locationId === loc).length}</div>
        </button>
        {counts.map((c) => (
          <button
            key={c.status}
            onClick={() => setStatusFilter(c.status)}
            className={`rounded-lg border bg-card p-3 text-left transition hover:border-primary ${statusFilter === c.status ? "border-primary" : ""}`}
          >
            <div className="text-xs text-muted-foreground">{STATUS_META[c.status].label}</div>
            <div className="text-2xl font-semibold tabular-nums">{c.count}</div>
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by order # or customer" className="h-9 pl-8" />
            </div>
            <div className="flex flex-wrap gap-1">
              <ChipBtn active={channelFilter === "all"} onClick={() => setChannelFilter("all")}>All channels</ChipBtn>
              {ALL_CHANNELS.map((c) => (
                <ChipBtn key={c} active={channelFilter === c} onClick={() => setChannelFilter(c)}>
                  <ChannelBadge channel={c} />
                </ChipBtn>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card text-left text-xs uppercase text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2">Order</th>
                  <th className="py-2">Channel</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Location</th>
                  <th className="py-2">Type</th>
                  <th className="py-2">Time</th>
                  <th className="py-2">Duration</th>
                  <th className="py-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                        >
                          Status
                          <ListFilter
                            className={`h-3 w-3 ${statusFilter !== "all" ? "text-primary" : "opacity-50"}`}
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                          All statuses
                          {statusFilter === "all" && <Check className="ml-auto h-3.5 w-3.5" />}
                        </DropdownMenuItem>
                        {ALL_STATUSES.map((s) => (
                          <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)}>
                            {STATUS_META[s].label}
                            {statusFilter === s && <Check className="ml-auto h-3.5 w-3.5" />}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </th>
                  <th className="py-2 text-right">Total</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const loc = LOCATIONS.find((l) => l.id === o.locationId);
                  return (
                    <tr key={o.id} className="border-b hover:bg-muted/50">
                      <td className="py-2.5">
                        <Link to="/orders/$id" params={{ id: o.id }} className="font-mono text-xs text-primary hover:underline">
                          {o.shortId}
                        </Link>
                      </td>
                      <td className="py-2.5"><ChannelBadge channel={o.channel} /></td>
                      <td className="py-2.5">{o.customerName}</td>
                      <td className="py-2.5 text-xs text-muted-foreground">{loc?.name.replace("Jamaican Kitchen — ", "")}</td>
                      <td className="py-2.5 text-xs capitalize">{o.type.replace("_", " ")}</td>
                      <td className="py-2.5 text-xs text-muted-foreground tabular-nums">{format(new Date(o.createdAt), "MMM d, h:mm a")}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs tabular-nums ${
                            isFinal(o.status)
                              ? "bg-muted text-foreground"
                              : "bg-warning/10 text-warning-foreground"
                          }`}
                        >
                          <Timer className="h-3 w-3" />
                          {isFinal(o.status)
                            ? `${durationMinutes(o)}m`
                            : formatHMS(liveElapsedSeconds(o.createdAt))}
                          {!isFinal(o.status) && <span className="opacity-60">· live</span>}
                        </span>
                      </td>
                      <td className="py-2.5"><StatusPill status={o.status} /></td>
                      <td className="py-2.5 text-right tabular-nums font-medium">{formatMoney(o.total)}</td>
                      <td className="py-2.5">
                        <div className="flex justify-end gap-1">
                          {o.status === "new" && (
                            <>
                              <Button size="sm" className="h-7 px-2" onClick={() => toast.success(`Accepted ${o.shortId}`)}>
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => toast.error(`Rejected ${o.shortId}`)}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {(o.status === "accepted" || o.status === "preparing") && (
                            <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => toast.success(`${o.shortId} marked ready`)}>
                              <CheckCheck className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {o.status === "ready" && (
                            <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => toast(`Print ticket ${o.shortId}`)}>
                              <ChefHat className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">No orders match your filters.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function ChipBtn({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md border px-2 py-1 text-xs transition ${active ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted"}`}
    >
      {children}
    </button>
  );
}