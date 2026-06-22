import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, MapPin } from "lucide-react";
import { LOCATIONS, ORDERS } from "@/lib/mock-data";
import { ChannelBadge } from "@/components/ChannelBadge";
import { PageHeader } from "@/components/PageHeader";
import { useCurrentLocation } from "@/lib/store";

export const Route = createFileRoute("/_app/delivery")({ component: DeliveryPage });

function DeliveryPage() {
  const loc = useCurrentLocation();
  const active = ORDERS.filter((o) => (loc === "all" || o.locationId === loc) && o.type === "delivery" && (o.status === "out_for_delivery" || o.status === "ready" || o.status === "preparing"));
  return (
    <>
      <PageHeader title="Delivery" description={`${active.length} active deliveries`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Live map</CardTitle></CardHeader>
          <CardContent>
            <div className="relative h-[420px] overflow-hidden rounded-lg border bg-gradient-to-br from-info/5 via-background to-primary/5">
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle, oklch(0.92 0.01 255) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
              {LOCATIONS.map((l, i) => (
                <div key={l.id} className="absolute" style={{ left: `${20 + i * 25}%`, top: `${30 + (i % 2) * 25}%` }}>
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/20"><MapPin className="h-5 w-5" /></div>
                    <div className="mt-1 rounded bg-background px-2 py-0.5 text-xs font-medium shadow">{l.name.replace("Jamaican Kitchen — ", "")}</div>
                  </div>
                </div>
              ))}
              {active.slice(0, 8).map((o, i) => (
                <div key={o.id} className="absolute animate-pulse" style={{ left: `${15 + i * 9}%`, top: `${55 + (i % 3) * 12}%` }}>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-success text-white shadow"><Truck className="h-3.5 w-3.5" /></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Active deliveries</CardTitle></CardHeader>
          <CardContent className="space-y-3 max-h-[420px] overflow-auto">
            {active.map((o) => (
              <div key={o.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><ChannelBadge channel={o.channel} /><span className="font-mono text-xs">{o.shortId}</span></div>
                  <span className="text-xs text-muted-foreground">{o.etaMinutes} min</span>
                </div>
                <div className="mt-1 text-sm font-medium">{o.customerName}</div>
                {o.address && <div className="text-xs text-muted-foreground">{o.address}</div>}
                {o.courier && <div className="mt-2 flex items-center gap-2 text-xs"><Truck className="h-3 w-3 text-success" /><span>{o.courier.name}</span></div>}
              </div>
            ))}
            {active.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No active deliveries.</div>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}