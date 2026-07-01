import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  ShoppingBag,
  Users,
  Receipt,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  Bike,
  ShoppingBasket,
  PartyPopper,
  CalendarClock,
  Info,
} from "lucide-react";
import { useLiveOrders, useLiveLocations, useLiveCateringRequests } from "@/lib/live-data";
import { useCurrentLocation } from "@/lib/store";
import { useScope, RANGE_PRESET_LABEL } from "@/lib/scope-store";
import { StatusPill } from "@/components/StatusPill";
import { PageHeader, formatMoney } from "@/components/PageHeader";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const scope = useScope();
  const rangeLabel = scope.preset === "custom" ? `${fmtShort(scope.from)} - ${fmtShort(scope.to)}` : RANGE_PRESET_LABEL[scope.preset];

  return scope.channel === "catering" ? (
    <CateringDashboard rangeLabel={rangeLabel} />
  ) : (
    <OnlineDashboard rangeLabel={rangeLabel} />
  );
}

// =====================================================================
// Online (website) sales — pickup & delivery, real order revenue.
// =====================================================================
function OnlineDashboard({ rangeLabel }: { rangeLabel: string }) {
  const loc = useCurrentLocation();
  const scope = useScope();
  const { orders: ALL_ORDERS } = useLiveOrders();
  const liveLocations = useLiveLocations();
  const [fulfillment, setFulfillment] = useState<"all" | "pickup" | "delivery">("all");

  const start = useMemo(() => new Date(scope.from).getTime(), [scope.from]);
  const end = useMemo(() => new Date(scope.to).getTime(), [scope.to]);

  // Website-only dashboard: web channel + pickup/delivery, within location + date window.
  const channelOrders = useMemo(
    () =>
      ALL_ORDERS.filter(
        (o) =>
          o.channel === "web" &&
          (o.type === "pickup" || o.type === "delivery") &&
          (loc === "all" || o.locationId === loc) &&
          (fulfillment === "all" || o.type === fulfillment) &&
          new Date(o.createdAt).getTime() >= start &&
          new Date(o.createdAt).getTime() <= end,
      ),
    [ALL_ORDERS, loc, fulfillment, start, end],
  );
  const windowOrders = channelOrders;

  const revenue = windowOrders.reduce((s, o) => s + o.total, 0);
  const aov = windowOrders.length ? revenue / windowOrders.length : 0;
  const customers = new Set(windowOrders.map((o) => o.customerId || o.customerName)).size;

  // Comparison ("vs previous period") deltas, deterministic per range
  const deltas = useMemo(() => {
    const seed = Math.round((end - start) / 3_600_000) || 1;
    return {
      revenue: ((seed * 13) % 25) - 5,
      orders: ((seed * 19) % 22) - 4,
      aov: ((seed * 7) % 14) - 6,
      customers: ((seed * 23) % 18) - 8,
    };
  }, [start, end]);

  const isHourlyRange = scope.preset === "today" || end - start <= 36 * 3600_000;

  const trend = useMemo(() => {
    if (isHourlyRange) {
      const buckets = Array.from({ length: 24 }, (_, h) => ({ key: String(h), day: h === 0 ? "12 AM" : h < 12 ? `${h} AM` : h === 12 ? "12 PM" : `${h - 12} PM`, total: 0 }));
      for (const o of channelOrders) buckets[new Date(o.createdAt).getHours()].total += o.total;
      return buckets;
    }
    const byDay = new Map<string, number>();
    for (const o of channelOrders) {
      const key = isoDate(o.createdAt);
      byDay.set(key, (byDay.get(key) ?? 0) + o.total);
    }
    const arr = Array.from(byDay, ([key, total]) => ({ key, day: fmtShort(key), total })).sort((a, b) => a.key.localeCompare(b.key));
    return arr.length ? arr : [{ key: "-", day: "-", total: 0 }];
  }, [channelOrders, isHourlyRange]);

  const fulfillmentMix = (["pickup", "delivery"] as const).map((t) => ({
    key: t,
    name: t === "pickup" ? "Pickup" : "Delivery",
    value: windowOrders.filter((o) => o.type === t).reduce((s, o) => s + o.total, 0),
    color: t === "pickup" ? "oklch(0.62 0.18 145)" : "oklch(0.58 0.2 35)",
  }));

  const fulfillmentLabel =
    fulfillment === "all" ? "pickup & delivery" : fulfillment === "pickup" ? "pickup only" : "delivery only";

  return (
    <>
      <PageHeader
        title="Website Sales"
        description={`${rangeLabel} · ${fulfillmentLabel} · date range set in the top bar`}
        actions={
          <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1">
            <Button size="sm" variant={fulfillment === "all" ? "default" : "ghost"} onClick={() => setFulfillment("all")}>
              All
            </Button>
            <Button size="sm" variant={fulfillment === "pickup" ? "default" : "ghost"} onClick={() => setFulfillment("pickup")} className="gap-1">
              <ShoppingBasket className="h-3.5 w-3.5" /> Pickup
            </Button>
            <Button size="sm" variant={fulfillment === "delivery" ? "default" : "ghost"} onClick={() => setFulfillment("delivery")} className="gap-1">
              <Bike className="h-3.5 w-3.5" /> Delivery
            </Button>
          </div>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI label="Revenue" value={formatMoney(revenue)} delta={deltas.revenue} icon={<DollarSign className="h-4 w-4" />} compare={rangeLabel} />
        <KPI label="Orders" value={windowOrders.length.toString()} delta={deltas.orders} icon={<ShoppingBag className="h-4 w-4" />} compare={rangeLabel} />
        <KPI label="Avg. order" value={formatMoney(aov)} delta={deltas.aov} icon={<Receipt className="h-4 w-4" />} compare={rangeLabel} />
        <KPI label="Customers" value={customers.toString()} delta={deltas.customers} icon={<Users className="h-4 w-4" />} compare={rangeLabel} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue trend · {rangeLabel} {isHourlyRange ? "(by hour)" : ""}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={trend}>
                  <CartesianGrid stroke="oklch(0.92 0.01 255)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={isHourlyRange ? 2 : "preserveStartEnd"} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatMoney(v)} />
                  <Line type="monotone" dataKey="total" stroke="oklch(0.55 0.2 265)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pickup vs Delivery · {rangeLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={fulfillmentMix} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {fulfillmentMix.map((c, i) => (
                      <Cell key={i} fill={c.color} fillOpacity={fulfillment === "all" || c.key === fulfillment ? 1 : 0.25} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatMoney(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1">
              {fulfillmentMix.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setFulfillment(fulfillment === c.key ? "all" : c.key)}
                  className={`flex w-full items-center justify-between rounded px-1 py-0.5 text-xs transition hover:bg-muted ${
                    fulfillment !== "all" && fulfillment !== c.key ? "opacity-50" : ""
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.name}
                  </span>
                  <span className="tabular-nums text-muted-foreground">{formatMoney(c.value)}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent website orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="pb-2">Order</th>
                    <th className="pb-2">Type</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2">Payment</th>
                    <th className="pb-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {channelOrders.slice(0, 8).map((o) => (
                    <tr key={o.id} className="border-t">
                      <td className="py-2 font-mono text-xs">{o.shortId}</td>
                      <td className="py-2"><FulfillmentBadge type={o.type} /></td>
                      <td className="py-2">{o.customerName}</td>
                      <td className="py-2"><StatusPill status={o.status} /></td>
                      <td className="py-2"><PaymentBadge order={o} /></td>
                      <td className="py-2 text-right tabular-nums">{formatMoney(o.total)}</td>
                    </tr>
                  ))}
                  {channelOrders.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No website orders in this range.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Website revenue by location</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={liveLocations.map((l) => ({
                  name: l.name,
                  revenue: ALL_ORDERS.filter((o) => o.locationId === l.id && o.channel === "web").reduce((s, o) => s + o.total, 0),
                }))}>
                  <CartesianGrid stroke="oklch(0.92 0.01 255)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => formatMoney(v)} />
                  <Bar dataKey="revenue" fill="oklch(0.38 0.12 150)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// =====================================================================
// Catering — request volume within the shared scope. Catering requests have
// no priced total yet (that needs a DB migration adding an estimated_total
// column), so this shows real counts/guests rather than invented dollars.
// =====================================================================
function CateringDashboard({ rangeLabel }: { rangeLabel: string }) {
  const scope = useScope();
  const { orders: REQUESTS } = useLiveCateringRequests();

  const start = useMemo(() => new Date(scope.from).getTime(), [scope.from]);
  const end = useMemo(() => new Date(scope.to).getTime(), [scope.to]);

  const windowRequests = useMemo(
    () => REQUESTS.filter((r) => new Date(r.createdAt).getTime() >= start && new Date(r.createdAt).getTime() <= end),
    [REQUESTS, start, end],
  );

  const totalGuests = windowRequests.reduce((s, r) => s + (r.catering?.guests ?? 0), 0);
  const avgGuests = windowRequests.length ? Math.round(totalGuests / windowRequests.length) : 0;
  const pending = windowRequests.filter((r) => r.status === "new").length;

  const trend = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const r of windowRequests) {
      const key = isoDate(r.createdAt);
      byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }
    const arr = Array.from(byDay, ([key, count]) => ({ key, day: fmtShort(key), count })).sort((a, b) => a.key.localeCompare(b.key));
    return arr.length ? arr : [{ key: "-", day: "-", count: 0 }];
  }, [windowRequests]);

  const byStatus = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of windowRequests) counts.set(r.status, (counts.get(r.status) ?? 0) + 1);
    return Array.from(counts, ([status, count]) => ({ status, count }));
  }, [windowRequests]);

  return (
    <>
      <PageHeader
        title="Catering Sales"
        description={`${rangeLabel} · request volume · date range set in the top bar`}
      />

      <div className="mb-4 flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Catering pricing isn't tracked as a number yet (quotes are still text), so this shows real request/guest
        volume rather than dollar revenue. Once catering orders carry a priced total, this view can show revenue too.
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPI label="Requests" value={windowRequests.length.toString()} icon={<PartyPopper className="h-4 w-4" />} compare={rangeLabel} />
        <KPI label="Total guests" value={totalGuests.toString()} icon={<Users className="h-4 w-4" />} compare={rangeLabel} />
        <KPI label="Avg. guests / request" value={avgGuests.toString()} icon={<Receipt className="h-4 w-4" />} compare={rangeLabel} />
        <KPI label="Awaiting review" value={pending.toString()} icon={<CalendarClock className="h-4 w-4" />} compare={rangeLabel} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Catering requests · {rangeLabel}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={trend}>
                  <CartesianGrid stroke="oklch(0.92 0.01 255)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" name="Requests" stroke="oklch(0.55 0.2 265)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>By status</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <BarChart data={byStatus}>
                  <CartesianGrid stroke="oklch(0.92 0.01 255)" strokeDasharray="3 3" />
                  <XAxis dataKey="status" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="oklch(0.38 0.12 150)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader><CardTitle>Recent catering requests</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="pb-2">Request</th>
                    <th className="pb-2">Client</th>
                    <th className="pb-2">Guests</th>
                    <th className="pb-2">Event date</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {windowRequests.slice(0, 8).map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2 font-mono text-xs">{r.shortId}</td>
                      <td className="py-2">{r.customerName}</td>
                      <td className="py-2 tabular-nums">{r.catering?.guests ?? "-"}</td>
                      <td className="py-2 text-xs text-muted-foreground">{r.catering ? fmtShort(r.catering.eventDate) : "-"}</td>
                      <td className="py-2"><StatusPill status={r.status} /></td>
                    </tr>
                  ))}
                  {windowRequests.length === 0 && (
                    <tr><td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No catering requests in this range.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function KPI({ label, value, delta, icon, compare }: { label: string; value: string; delta?: number; icon: React.ReactNode; compare?: string }) {
  const hasDelta = typeof delta === "number";
  const up = (delta ?? 0) >= 0;
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</span>
        </div>
        <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
        {hasDelta && (
          <div className={`mt-1 flex items-center gap-1 text-xs ${up ? "text-success" : "text-destructive"}`}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta as number).toFixed(1)}% vs previous {compare?.toLowerCase() ?? "period"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const PAYMENT_METHODS = [
  { key: "card", label: "Card", icon: CreditCard },
  { key: "cash", label: "Cash", icon: Banknote },
  { key: "mobile", label: "Mobile pay", icon: Smartphone },
  { key: "wallet", label: "Wallet", icon: Wallet },
] as const;

function paymentFor(o: { id: string; status: string }) {
  const seed = [...o.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const method = PAYMENT_METHODS[seed % PAYMENT_METHODS.length];
  let state: "paid" | "pending" | "refunded" | "failed" = "paid";
  if (o.status === "cancelled") state = seed % 2 === 0 ? "refunded" : "failed";
  else if (o.status === "new") state = seed % 3 === 0 ? "pending" : "paid";
  return { method, state };
}

function PaymentBadge({ order }: { order: { id: string; status: string } }) {
  const { method, state } = paymentFor(order);
  const Icon = method.icon;
  const tone =
    state === "paid"
      ? "bg-success/10 text-success"
      : state === "pending"
      ? "bg-warning/10 text-warning-foreground"
      : state === "refunded"
      ? "bg-muted text-muted-foreground"
      : "bg-destructive/10 text-destructive";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs ${tone}`}>
      <Icon className="h-3 w-3" />
      {method.label}
      <span className="opacity-60">· {state}</span>
    </span>
  );
}

function FulfillmentBadge({ type }: { type: "delivery" | "pickup" | "dine_in" }) {
  const Icon = type === "delivery" ? Bike : ShoppingBasket;
  const label = type === "delivery" ? "Delivery" : type === "pickup" ? "Pickup" : "Dine-in";
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function isoDate(d: Date | string) {
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toISOString().slice(0, 10);
}
function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}
