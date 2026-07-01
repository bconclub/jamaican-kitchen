import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChannelBadge } from "@/components/ChannelBadge";
import { StatusPill } from "@/components/StatusPill";
import { PageHeader, formatMoney } from "@/components/PageHeader";
import { CHANNEL_META, STATUS_META } from "@/lib/mock-data";
import { useLiveOrders, useLiveLocations, updateOrderStatus } from "@/lib/live-data";
import { useCurrentLocation } from "@/lib/store";
import type { Channel, Order, OrderStatus } from "@/lib/types";
import { Check, X, ChefHat, CheckCheck, Search, ListFilter, Timer, MapPin, ExternalLink, Truck, PackageCheck, Printer } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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

// Deterministic mock helpers, duration, staff comments, customer reviews.
function durationMinutes(o: { id: string; status: OrderStatus; createdAt: string }) {
  const seed = [...o.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  if (o.status === "completed") return 18 + (seed % 22); // 18-39 min total
  if (o.status === "cancelled") return 4 + (seed % 8);
  // in-progress: time elapsed since creation
  return Math.max(1, Math.round((Date.now() - new Date(o.createdAt).getTime()) / 60000));
}
// Live elapsed time in seconds since order placed, used for ticking countdown.
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
// The prep timer ticks only while the order is being worked on. Once it's
// Ready (or beyond), the timer freezes at the elapsed prep time.
function isTicking(s: OrderStatus) {
  return s === "new" || s === "accepted" || s === "preparing";
}
function frozenMinutes(o: { createdAt: string; updatedAt?: string }) {
  const end = o.updatedAt ? new Date(o.updatedAt).getTime() : Date.now();
  return Math.max(1, Math.round((end - new Date(o.createdAt).getTime()) / 60000));
}
const STAFF_NOTES = [
  "Double oxtail, extra gravy on the side.",
  "Customer is a regular, please prioritise.",
  "Allergy: shellfish. Confirmed with kitchen.",
  "Running 5 min behind, courier notified.",
  "Repacked patties, first batch was cold.",
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
export { durationMinutes, isFinal, staffNoteFor, reviewFor, liveElapsedSeconds, formatHMS, nextStatusAction, OrderStepper, printOrderTicket };

// The one real next step for an in-flight order. Delivery orders get an extra
// "Dispatch" stage between Ready and Completed; pickup/dine-in skip straight
// to Complete from Ready. Returns null once the order is in a final state.
function nextStatusAction(status: OrderStatus, type: Order["type"]) {
  switch (status) {
    case "accepted":
      return { status: "preparing" as OrderStatus, label: "Start preparing", Icon: ChefHat };
    case "preparing":
      return { status: "ready" as OrderStatus, label: "Mark ready", Icon: CheckCheck };
    case "ready":
      return type === "delivery"
        ? { status: "out_for_delivery" as OrderStatus, label: "Dispatch", Icon: Truck }
        : { status: "completed" as OrderStatus, label: "Complete", Icon: PackageCheck };
    case "out_for_delivery":
      return { status: "completed" as OrderStatus, label: "Mark delivered", Icon: PackageCheck };
    default:
      return null;
  }
}

// Full order-lifecycle stages, so staff can see at a glance how far an order
// has progressed (not just its current label).
const ORDER_FLOW: OrderStatus[] = ["new", "accepted", "preparing", "ready", "out_for_delivery", "completed"];

function OrderStepper({ status, type }: { status: OrderStatus; type: Order["type"] }) {
  if (status === "cancelled") {
    return <div className="mt-1 text-[10px] font-medium text-destructive">Cancelled</div>;
  }
  const steps = type === "delivery" ? ORDER_FLOW : ORDER_FLOW.filter((s) => s !== "out_for_delivery");
  const idx = steps.indexOf(status);
  return (
    <div className="mt-1 flex items-center gap-0.5">
      {steps.map((s, i) => (
        <span
          key={s}
          title={STATUS_META[s].label}
          className={`h-1.5 w-3 rounded-full ${i <= idx ? "bg-primary" : "bg-muted"}`}
        />
      ))}
    </div>
  );
}

function escapeHtml(v: string) {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// Opens a real, printable kitchen ticket in a new tab and triggers the
// browser's print dialog — replaces the old placeholder that just showed a toast.
function printOrderTicket(order: Order, locationName: string) {
  const win = window.open("", "_blank", "width=380,height=640");
  if (!win) return;
  const itemsHtml = order.items
    .map(
      (it) =>
        `<tr><td>${it.qty}&times; ${escapeHtml(it.name)}${
          it.modifiers && it.modifiers.length
            ? `<div style="font-size:11px;color:#666">${escapeHtml(it.modifiers.join(", "))}</div>`
            : ""
        }</td><td style="text-align:right;white-space:nowrap">$${(it.price * it.qty).toFixed(2)}</td></tr>`,
    )
    .join("");
  win.document.write(`<!doctype html><html><head><title>Ticket ${escapeHtml(order.shortId)}</title>
    <meta charset="utf-8" />
    <style>
      body { font-family: -apple-system, Arial, sans-serif; padding: 16px; color: #111; }
      h1 { font-size: 20px; margin: 0 0 2px; }
      .meta { font-size: 12px; color: #555; margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      td { padding: 5px 0; border-bottom: 1px dashed #ccc; vertical-align: top; }
      .total { display: flex; justify-content: space-between; font-weight: 700; margin-top: 10px; font-size: 15px; }
      .notes { margin-top: 10px; font-size: 12px; background: #f5f5f5; padding: 8px; border-radius: 6px; }
    </style></head>
    <body>
      <h1>${escapeHtml(order.shortId)}</h1>
      <div class="meta">${escapeHtml(locationName)} &middot; ${escapeHtml(order.type.replace("_", " "))} &middot; ${escapeHtml(order.customerName)}</div>
      <table>${itemsHtml}</table>
      <div class="total"><span>Total</span><span>$${order.total.toFixed(2)}</span></div>
      ${order.notes ? `<div class="notes"><strong>Notes:</strong> ${escapeHtml(order.notes)}</div>` : ""}
      <script>window.onload = () => window.print();</script>
    </body></html>`);
  win.document.close();
  win.focus();
}

export const Route = createFileRoute("/_app/orders")({
  component: OrdersPage,
});

const ALL_STATUSES = Object.keys(STATUS_META) as OrderStatus[];
// Completed/cancelled orders stay on the live board for 24h, then archive to history.
const RETENTION_MS = 24 * 60 * 60 * 1000;
const ALL_CHANNELS = Object.keys(CHANNEL_META) as Channel[];

function OrdersPage() {
  const loc = useCurrentLocation();
  const { orders: ORDERS } = useLiveOrders();
  const liveLocations = useLiveLocations();
  const locName = useMemo(
    () => new Map(liveLocations.map((l) => [l.id, l.name])),
    [liveLocations],
  );
  const [channelFilter, setChannelFilter] = useState<Channel | "all">("all");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [q, setQ] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const selectedOrder = useMemo(
    () => ORDERS.find((o) => o.id === selectedOrderId) ?? null,
    [ORDERS, selectedOrderId],
  );
  // Tick once per second so live durations update in place.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const handleStatus = async (id: string, status: OrderStatus, shortId: string, label: string) => {
    try {
      await updateOrderStatus(id, status);
      toast.success(`${shortId} ${label}`);
    } catch {
      toast.error(`Could not update ${shortId}`);
    }
  };

  const printTicket = (order: Order, locationName: string) => {
    printOrderTicket(order, locationName);
    toast.success(`Printing ${order.shortId}`);
  };

  const filtered = useMemo(() => {
    return ORDERS.filter((o) => {
      if (loc !== "all" && o.locationId !== loc) return false;
      if (channelFilter !== "all" && o.channel !== channelFilter) return false;
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      // Retention: on the live board (All), completed/cancelled orders drop off
      // after 24h. They stay accessible by filtering to that status (= history).
      if (statusFilter === "all" && isFinal(o.status)) {
        const ageMs = Date.now() - new Date(o.updatedAt ?? o.createdAt).getTime();
        if (ageMs > RETENTION_MS) return false;
      }
      if (q && !(o.shortId.includes(q) || o.customerName.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [ORDERS, loc, channelFilter, statusFilter, q]);

  const counts = ALL_STATUSES.map((s) => ({
    status: s,
    count: ORDERS.filter((o) => (loc === "all" || o.locationId === loc) && o.status === s).length,
  }));

  return (
    <>
      <PageHeader
        title="Live Orders"
        description="Live feed across every channel. Completed orders archive after 24h — filter by status to see full history."
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
                  const locationName = locName.get(o.locationId) ?? "-";
                  return (
                    <tr
                      key={o.id}
                      className="cursor-pointer border-b hover:bg-muted/50"
                      onClick={() => setSelectedOrderId(o.id)}
                    >
                      <td className="py-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderId(o.id);
                          }}
                          className="font-mono text-xs text-primary hover:underline"
                        >
                          {o.shortId}
                        </button>
                      </td>
                      <td className="py-2.5"><ChannelBadge channel={o.channel} /></td>
                      <td className="py-2.5">{o.customerName}</td>
                      <td className="py-2.5 text-xs text-muted-foreground">{locationName}</td>
                      <td className="py-2.5 text-xs capitalize">{o.type.replace("_", " ")}</td>
                      <td className="py-2.5 text-xs text-muted-foreground tabular-nums">{format(new Date(o.createdAt), "MMM d, h:mm a")}</td>
                      <td className="py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs tabular-nums ${
                            isTicking(o.status)
                              ? "bg-warning/10 text-warning-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <Timer className="h-3 w-3" />
                          {isTicking(o.status)
                            ? formatHMS(liveElapsedSeconds(o.createdAt))
                            : `${frozenMinutes(o)}m`}
                          {isTicking(o.status) && <span className="opacity-60">· live</span>}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <StatusPill status={o.status} />
                        <OrderStepper status={o.status} type={o.type} />
                      </td>
                      <td className="py-2.5 text-right tabular-nums font-medium">{formatMoney(o.total)}</td>
                      <td className="py-2.5" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          {o.status === "new" && (
                            <>
                              <Button size="sm" className="h-7 gap-1 px-2" onClick={() => handleStatus(o.id, "accepted", o.shortId, "accepted")}>
                                <Check className="h-3.5 w-3.5" /> Accept
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => handleStatus(o.id, "cancelled", o.shortId, "rejected")}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          {(() => {
                            const next = nextStatusAction(o.status, o.type);
                            if (!next) return null;
                            const Icon = next.Icon;
                            return (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 px-2"
                                onClick={() => handleStatus(o.id, next.status, o.shortId, next.label.toLowerCase())}
                              >
                                <Icon className="h-3.5 w-3.5" /> {next.label}
                              </Button>
                            );
                          })()}
                          {!isFinal(o.status) && o.status !== "new" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              title="Print ticket"
                              onClick={() => printTicket(o, locationName)}
                            >
                              <Printer className="h-3.5 w-3.5" />
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

      <OrderDetailSheet
        order={selectedOrder}
        locationName={selectedOrder ? (locName.get(selectedOrder.locationId) ?? "-") : "-"}
        onClose={() => setSelectedOrderId(null)}
        onStatus={handleStatus}
        onPrint={printTicket}
      />
    </>
  );
}

function OrderDetailSheet({
  order,
  locationName,
  onClose,
  onStatus,
  onPrint,
}: {
  order: Order | null;
  locationName: string;
  onClose: () => void;
  onStatus: (id: string, status: OrderStatus, shortId: string, label: string) => Promise<void>;
  onPrint: (order: Order, locationName: string) => void;
}) {
  return (
    <Sheet open={!!order} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {order && (
          <>
            <SheetHeader>
              <SheetTitle className="flex flex-wrap items-center gap-2 pr-6">
                <span className="font-mono">{order.shortId}</span>
                <ChannelBadge channel={order.channel} />
                <StatusPill status={order.status} />
              </SheetTitle>
              <OrderStepper status={order.status} type={order.type} />
            </SheetHeader>

            <div className="mt-4 space-y-4 text-sm">
              <div className="space-y-1">
                <div className="font-medium">{order.customerName}</div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  {locationName} · {order.type.replace("_", " ")}
                </div>
                {order.address && <div className="text-xs text-muted-foreground">{order.address}</div>}
                <div className="text-xs text-muted-foreground">
                  {format(new Date(order.createdAt), "MMM d, h:mm a")}
                </div>
              </div>

              <div>
                <div className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Order items</div>
                <div className="rounded-lg border divide-y">
                  {order.items.map((it) => (
                    <div key={it.id} className="px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-muted-foreground">{it.qty}x</span> {it.name}
                          {it.modifiers && it.modifiers.length > 0 && (
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {it.modifiers.join(", ")}
                            </div>
                          )}
                        </div>
                        <span className="shrink-0 tabular-nums">{formatMoney(it.price * it.qty)}</span>
                      </div>
                    </div>
                  ))}
                  {order.items.length === 0 && (
                    <div className="px-3 py-2 text-muted-foreground">No line items</div>
                  )}
                </div>
              </div>

              <div className="space-y-1 rounded-lg border p-3">
                <DetailRow label="Subtotal" value={formatMoney(order.subtotal)} />
                <DetailRow label="Tax" value={formatMoney(order.tax)} />
                {order.fees > 0 && <DetailRow label="Fees" value={formatMoney(order.fees)} />}
                {order.tip > 0 && <DetailRow label="Tip" value={formatMoney(order.tip)} />}
                <div className="flex justify-between border-t pt-2 font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatMoney(order.total)}</span>
                </div>
              </div>

              {order.notes && (
                <div className="rounded-md bg-muted/50 p-3 text-xs">
                  <span className="font-medium">Notes: </span>
                  {order.notes}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {order.status === "new" && (
                  <>
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => onStatus(order.id, "accepted", order.shortId, "accepted")}
                    >
                      <Check className="h-3.5 w-3.5" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => onStatus(order.id, "cancelled", order.shortId, "rejected")}
                    >
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </>
                )}
                {(() => {
                  const next = nextStatusAction(order.status, order.type);
                  if (!next) return null;
                  const Icon = next.Icon;
                  return (
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => onStatus(order.id, next.status, order.shortId, next.label.toLowerCase())}
                    >
                      <Icon className="h-3.5 w-3.5" /> {next.label}
                    </Button>
                  );
                })()}
                {!isFinal(order.status) && order.status !== "new" && (
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => onPrint(order, locationName)}>
                    <Printer className="h-3.5 w-3.5" /> Print ticket
                  </Button>
                )}
                <Button size="sm" variant="ghost" className="gap-1" asChild>
                  <Link to="/orders/$id" params={{ id: order.id }} onClick={onClose}>
                    <ExternalLink className="h-3.5 w-3.5" /> Full page
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
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
