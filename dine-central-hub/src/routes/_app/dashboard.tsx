import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
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
import { ArrowDownRight, ArrowUpRight, DollarSign, ShoppingBag, Users, Receipt, CalendarRange, CreditCard, Banknote, Smartphone, Wallet, Bike, ShoppingBasket } from "lucide-react";
import { ORDERS, revenueByDay } from "@/lib/mock-data";
import { useCurrentLocation } from "@/lib/store";
import { StatusPill } from "@/components/StatusPill";
import { PageHeader, formatMoney } from "@/components/PageHeader";

export const Route = createFileRoute("/_app/dashboard")({
  component: Dashboard,
});

type RangeKey = "today" | "week" | "month" | "ytd" | "custom";

const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "today", label: "Today", days: 1 },
  { key: "week", label: "This week", days: 7 },
  { key: "month", label: "This month", days: 30 },
  { key: "ytd", label: "Year to date", days: 365 },
];

function Dashboard() {
  const loc = useCurrentLocation();
  const [range, setRange] = useState<RangeKey>("today");
  const [customStart, setCustomStart] = useState(() => isoDateTime(daysAgo(7)));
  const [customEnd, setCustomEnd] = useState(() => isoDateTime(new Date()));
  const [fulfillment, setFulfillment] = useState<"all" | "pickup" | "delivery">("all");

  const days = useMemo(() => {
    if (range === "custom") {
      const ms = new Date(customEnd).getTime() - new Date(customStart).getTime();
      return Math.max(1 / 24, ms / 86400000);
    }
    return RANGES.find((r) => r.key === range)!.days;
  }, [range, customStart, customEnd]);

  // Website-only dashboard: hard-filter to the web channel and pickup/delivery.
  const orders = ORDERS.filter(
    (o) =>
      o.channel === "web" &&
      (o.type === "pickup" || o.type === "delivery") &&
      (loc === "all" || o.locationId === loc),
  );
  const channelOrders = orders.filter((o) => fulfillment === "all" || o.type === fulfillment);
  const sampleSize = Math.min(
    channelOrders.length,
    Math.max(channelOrders.length / 4, Math.floor((channelOrders.length * days) / 30)),
  );
  const windowOrders = channelOrders.slice(0, Math.max(1, Math.floor(sampleSize)));

  const revenue = windowOrders.reduce((s, o) => s + o.total, 0);
  const aov = windowOrders.length ? revenue / windowOrders.length : 0;
  const customers = new Set(windowOrders.map((o) => o.customerId)).size;

  // Comparison ("vs previous period") deltas — deterministic per range
  const deltas = useMemo(() => {
    const seed = days * 7;
    return {
      revenue: ((seed * 13) % 25) - 5,
      orders: ((seed * 19) % 22) - 4,
      aov: ((seed * 7) % 14) - 6,
      customers: ((seed * 23) % 18) - 8,
    };
  }, [days]);

  const trend = revenueByDay(Math.min(60, Math.max(7, days)));
  const fulfillmentMix = (["pickup", "delivery"] as const).map((t) => ({
    key: t,
    name: t === "pickup" ? "Pickup" : "Delivery",
    value: windowOrders.filter((o) => o.type === t).reduce((s, o) => s + o.total, 0),
    color: t === "pickup" ? "oklch(0.62 0.18 145)" : "oklch(0.58 0.2 35)",
  }));

  const rangeLabel =
    range === "custom"
      ? `${fmtShortDT(customStart)} – ${fmtShortDT(customEnd)}`
      : RANGES.find((r) => r.key === range)!.label;
  const fulfillmentLabel =
    fulfillment === "all" ? "pickup & delivery" : fulfillment === "pickup" ? "pickup only" : "delivery only";

  return (
    <>
      <PageHeader
        title="Website Sales"
        description={`${rangeLabel} · ${fulfillmentLabel}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
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
            <div className="flex flex-wrap items-center gap-1 rounded-lg border bg-card p-1">
            {RANGES.map((r) => (
              <Button
                key={r.key}
                size="sm"
                variant={range === r.key ? "default" : "ghost"}
                onClick={() => setRange(r.key)}
              >
                {r.label}
              </Button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant={range === "custom" ? "default" : "ghost"} className="gap-1">
                  <CalendarRange className="h-3.5 w-3.5" /> Custom
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 space-y-3" align="end">
                <div className="space-y-1.5">
                  <Label className="text-xs">From</Label>
                  <Input type="datetime-local" value={customStart} max={customEnd} onChange={(e) => setCustomStart(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">To</Label>
                  <Input type="datetime-local" value={customEnd} min={customStart} max={isoDateTime(new Date())} onChange={(e) => setCustomEnd(e.target.value)} />
                </div>
                <Button className="w-full" size="sm" onClick={() => setRange("custom")}>Apply range</Button>
              </PopoverContent>
            </Popover>
            </div>
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
            <CardTitle>Revenue trend · {rangeLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={trend}>
                  <CartesianGrid stroke="oklch(0.92 0.01 255)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
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
                <BarChart data={["loc_1", "loc_2", "loc_3"].map((id) => ({
                  name: id === "loc_1" ? "Hartford" : id === "loc_2" ? "New Haven" : "Bridgeport",
                  revenue: ORDERS.filter((o) => o.locationId === id && o.channel === "web").reduce((s, o) => s + o.total, 0),
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

function KPI({ label, value, delta, icon, compare }: { label: string; value: string; delta: number; icon: React.ReactNode; compare?: string }) {
  const up = delta >= 0;
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</span>
        </div>
        <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
        <div className={`mt-1 flex items-center gap-1 text-xs ${up ? "text-success" : "text-destructive"}`}>
          {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(delta).toFixed(1)}% vs previous {compare?.toLowerCase() ?? "period"}
        </div>
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

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}
function isoDate(d: Date | string) {
  const x = typeof d === "string" ? new Date(d) : d;
  return x.toISOString().slice(0, 10);
}
function isoDateTime(d: Date | string) {
  const x = typeof d === "string" ? new Date(d) : d;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
}
function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}
function fmtShortDT(iso: string) {
  return new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}