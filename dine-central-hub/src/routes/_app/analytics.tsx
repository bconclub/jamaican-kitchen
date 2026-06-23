import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, formatMoney } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CHANNEL_META } from "@/lib/mock-data";
import { useLiveOrders } from "@/lib/live-data";
import { useCurrentLocation } from "@/lib/store";
import { useMemo, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  LineChart,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { Channel } from "@/lib/types";

export const Route = createFileRoute("/_app/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const loc = useCurrentLocation();
  const { orders: ALL_ORDERS } = useLiveOrders();
  const [range, setRange] = useState<"7" | "14" | "30">("14");
  const days = parseInt(range, 10);

  const orders = useMemo(
    () =>
      ALL_ORDERS.filter(
        (o) =>
          (loc === "all" || o.locationId === loc) &&
          new Date(o.createdAt).getTime() >= Date.now() - days * 86400000,
      ),
    [ALL_ORDERS, loc, days],
  );

  const revenue = useMemo(() => {
    const byDay = new Map<string, { day: string; web: number; app: number; total: number }>();
    for (const o of orders) {
      const day = new Date(o.createdAt).toLocaleDateString("en", { month: "short", day: "numeric" });
      const e = byDay.get(day) ?? { day, web: 0, app: 0, total: 0 };
      if (o.channel === "app") e.app += o.total;
      else e.web += o.total;
      e.total += o.total;
      byDay.set(day, e);
    }
    const arr = Array.from(byDay.values());
    return arr.length ? arr : [{ day: "-", web: 0, app: 0, total: 0 }];
  }, [orders]);

  const totalRevenue = revenue.reduce((s, d) => s + d.total, 0);
  const totalOrders = orders.length;
  const aov = totalOrders ? totalRevenue / totalOrders : 0;

  const channels: Channel[] = ["web", "app"];
  const channelMix = channels.map((c) => ({
    name: CHANNEL_META[c].label,
    value: revenue.reduce((s, d) => s + ((d as unknown as Record<string, number>)[c] ?? 0), 0),
    color: `var(--ch-${c})`,
  }));

  const topItems = useMemo(() => {
    const counts = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of orders) {
      for (const it of o.items) {
        const e = counts.get(it.name) ?? { name: it.name, qty: 0, revenue: 0 };
        e.qty += it.qty;
        e.revenue += it.qty * it.price;
        counts.set(it.name, e);
      }
    }
    return Array.from(counts.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [orders]);

  const allItemNames = useMemo(() => {
    const set = new Set<string>();
    for (const o of orders) for (const it of o.items) set.add(it.name);
    return Array.from(set).sort();
  }, [orders]);

  const [selectedItem, setSelectedItem] = useState<string>("");
  const activeItem = selectedItem || allItemNames[0] || "";

  const itemReport = useMemo(() => {
    if (!activeItem) return null;
    const matching = orders.filter((o) => o.items.some((it) => it.name === activeItem));
    let qty = 0;
    let revenue = 0;
    const byDay = new Map<string, { day: string; qty: number; revenue: number }>();
    const byLocation = new Map<string, { name: string; qty: number; revenue: number }>();
    const byFulfillment = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const o of matching) {
      const day = new Date(o.createdAt).toISOString().slice(5, 10);
      const dEntry = byDay.get(day) ?? { day, qty: 0, revenue: 0 };
      const locName = (o.locationId || "Unknown").toString();
      const lEntry = byLocation.get(locName) ?? { name: locName, qty: 0, revenue: 0 };
      const fName = o.type === "delivery" ? "Delivery" : "Pickup";
      const fEntry = byFulfillment.get(fName) ?? { name: fName, qty: 0, revenue: 0 };
      for (const it of o.items) {
        if (it.name !== activeItem) continue;
        const r = it.qty * it.price;
        qty += it.qty;
        revenue += r;
        dEntry.qty += it.qty;
        dEntry.revenue += r;
        lEntry.qty += it.qty;
        lEntry.revenue += r;
        fEntry.qty += it.qty;
        fEntry.revenue += r;
      }
      byDay.set(day, dEntry);
      byLocation.set(locName, lEntry);
      byFulfillment.set(fName, fEntry);
    }
    const trend = Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day));
    const locations = Array.from(byLocation.values()).sort((a, b) => b.revenue - a.revenue);
    const fulfillment = Array.from(byFulfillment.values());
    return {
      qty,
      revenue,
      orderCount: matching.length,
      avgPrice: qty ? revenue / qty : 0,
      trend,
      locations,
      fulfillment,
    };
  }, [orders, activeItem]);

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Revenue, channel mix, and top items across the chain."
        actions={
          <Tabs value={range} onValueChange={(v) => setRange(v as "7" | "14" | "30")}>
            <TabsList>
              <TabsTrigger value="7">7d</TabsTrigger>
              <TabsTrigger value="14">14d</TabsTrigger>
              <TabsTrigger value="30">30d</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Kpi label="Total revenue" value={formatMoney(totalRevenue)} />
        <Kpi label="Orders" value={totalOrders.toString()} />
        <Kpi label="Avg order value" value={formatMoney(aov)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue by channel</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenue}>
                <defs>
                  {channels.map((c) => (
                    <linearGradient key={c} id={`g-${c}`} x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor={`var(--ch-${c})`} stopOpacity={0.5} />
                      <stop offset="100%" stopColor={`var(--ch-${c})`} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Legend />
                {channels.map((c) => (
                  <Area
                    key={c}
                    type="monotone"
                    dataKey={c}
                    name={CHANNEL_META[c].label}
                    stackId="1"
                    stroke={`var(--ch-${c})`}
                    fill={`url(#g-${c})`}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Channel mix</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={channelMix} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                  {channelMix.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {channelMix.map((c) => (
                <div key={c.name} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                  <span className="text-muted-foreground">{c.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader><CardTitle>Top items by revenue</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topItems}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" interval={0} angle={-15} textAnchor="end" height={70} />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <div>
            <CardTitle>Item-wise sales report</CardTitle>
            <div className="text-sm text-muted-foreground mt-1">
              Pick any menu item to see its sales performance.
            </div>
          </div>
          <Select value={activeItem} onValueChange={setSelectedItem}>
            <SelectTrigger className="w-[260px]"><SelectValue placeholder="Select an item" /></SelectTrigger>
            <SelectContent>
              {allItemNames.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {!itemReport || itemReport.qty === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No sales for this item in the selected scope.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-4">
                <Kpi label="Units sold" value={itemReport.qty.toString()} />
                <Kpi label="Revenue" value={formatMoney(itemReport.revenue)} />
                <Kpi label="Orders" value={itemReport.orderCount.toString()} />
                <Kpi label="Avg price" value={formatMoney(itemReport.avgPrice)} />
              </div>

              <div>
                <div className="text-sm font-medium mb-2">Revenue trend</div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={itemReport.trend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="day" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="text-sm font-medium mb-2">By location</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={itemReport.locations} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis type="category" dataKey="name" className="text-xs" width={100} />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="var(--primary)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div className="text-sm font-medium mb-2">By fulfillment</div>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={itemReport.fulfillment} dataKey="revenue" nameKey="name" innerRadius={50} outerRadius={90}>
                        {itemReport.fulfillment.map((e, i) => (
                          <Cell key={i} fill={e.name === "Delivery" ? "oklch(0.58 0.2 35)" : "oklch(0.62 0.18 145)"} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}