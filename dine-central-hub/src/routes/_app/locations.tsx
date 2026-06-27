import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, formatMoney } from "@/components/PageHeader";
import { useLiveLocations, useLiveOrders } from "@/lib/live-data";
import { setCurrentLocation } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { ChannelBadge } from "@/components/ChannelBadge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MapPin, Phone, Clock, User, Filter } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type { Location, Order } from "@/lib/types";

export const Route = createFileRoute("/_app/locations")({
  component: LocationsPage,
});

const ACTIVE_STATUSES = ["new", "accepted", "preparing", "ready", "out_for_delivery"];

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function statsFor(orders: Order[], locationId: string) {
  const locOrders = orders.filter((o) => o.locationId === locationId);
  const today = locOrders.filter((o) => isToday(o.createdAt));
  const revenue = locOrders.reduce((s, o) => s + o.total, 0);
  const todayRevenue = today.reduce((s, o) => s + o.total, 0);
  const active = locOrders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
  const web = locOrders.filter((o) => o.channel === "web").length;
  const app = locOrders.filter((o) => o.channel === "app").length;

  // Best sellers at this store, by quantity ordered.
  const itemCounts = new Map<string, number>();
  for (const o of locOrders) for (const it of o.items) itemCounts.set(it.name, (itemCounts.get(it.name) ?? 0) + it.qty);
  const topItems = [...itemCounts.entries()]
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  return {
    total: locOrders.length,
    todayCount: today.length,
    revenue,
    todayRevenue,
    active,
    aov: locOrders.length ? revenue / locOrders.length : 0,
    web,
    app,
    topItems,
  };
}

function LocationsPage() {
  const locations = useLiveLocations();
  const { orders } = useLiveOrders();
  const [selected, setSelected] = useState<Location | null>(null);

  const selectedStats = useMemo(
    () => (selected ? statsFor(orders, selected.id) : null),
    [selected, orders],
  );

  const applyFilter = (l: Location) => {
    setCurrentLocation(l.id);
    toast.success(`Dashboard filtered to ${l.name}`);
    setSelected(null);
  };

  return (
    <div>
      <PageHeader title="Locations" description="Multi-location management for the Jamaican Kitchen chain." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {locations.map((l) => {
          const active = orders.filter((o) => o.locationId === l.id && ACTIVE_STATUSES.includes(o.status)).length;
          return (
            <Card key={l.id}>
              <CardContent className="p-5 space-y-4">
                <div>
                  <div className="font-semibold text-lg">{l.name}</div>
                  <div className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{l.address}{l.city ? `, ${l.city}` : ""}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info icon={User} text={l.manager || "—"} />
                  <Info icon={Phone} text={l.phone || "—"} />
                  <Info icon={Clock} text={l.hours || "—"} />
                  <Info icon={MapPin} text={`${active} active now`} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Channels</div>
                  <div className="flex flex-wrap gap-1">
                    {l.channels.map((c) => <ChannelBadge key={c} channel={c} />)}
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setSelected(l)}>
                  View overview
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && selectedStats && (
            <>
              <SheetHeader className="text-left">
                <SheetTitle>{selected.name}</SheetTitle>
                <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{selected.address}{selected.city ? `, ${selected.city}` : ""}</span>
                </div>
              </SheetHeader>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Metric label="Active now" value={selectedStats.active.toString()} />
                <Metric label="Orders today" value={selectedStats.todayCount.toString()} />
                <Metric label="Revenue today" value={formatMoney(selectedStats.todayRevenue)} />
                <Metric label="Avg order value" value={formatMoney(selectedStats.aov)} />
                <Metric label="Total orders" value={selectedStats.total.toString()} />
                <Metric label="Total revenue" value={formatMoney(selectedStats.revenue)} />
              </div>

              <div className="mt-4 rounded-lg border p-3">
                <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Orders by channel</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><ChannelBadge channel="web" /> Website</span>
                  <span className="font-medium tabular-nums">{selectedStats.web}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><ChannelBadge channel="app" /> Mobile app</span>
                  <span className="font-medium tabular-nums">{selectedStats.app}</span>
                </div>
              </div>

              <div className="mt-4 rounded-lg border p-3">
                <div className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Best sellers here</div>
                {selectedStats.topItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders yet at this location.</p>
                ) : (
                  <ol className="space-y-1">
                    {selectedStats.topItems.map((it, i) => (
                      <li key={it.name} className="flex items-center justify-between text-sm">
                        <span className="truncate"><span className="text-muted-foreground">{i + 1}.</span> {it.name}</span>
                        <span className="tabular-nums text-muted-foreground">{it.qty} sold</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {selected.manager && <div className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" />{selected.manager}</div>}
                {selected.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />{selected.phone}</div>}
                {selected.hours && <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-4 w-4" />{selected.hours}</div>}
              </div>

              <Button className="mt-5 w-full" onClick={() => applyFilter(selected)}>
                <Filter className="mr-2 h-4 w-4" /> Filter dashboard to this store
              </Button>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Info({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      <span className="truncate text-foreground">{text}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
