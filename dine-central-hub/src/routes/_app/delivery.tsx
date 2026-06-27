import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, MapPin } from "lucide-react";
import { ChannelBadge } from "@/components/ChannelBadge";
import { PageHeader } from "@/components/PageHeader";
import { useLiveLocations, useLiveOrders } from "@/lib/live-data";
import { useCurrentLocation } from "@/lib/store";

export const Route = createFileRoute("/_app/delivery")({ component: DeliveryPage });

// Connecticut bounding box used for both the embedded OSM map and marker projection,
// so the pins line up with the real map underneath.
const CT_BBOX = { lonMin: -73.75, lonMax: -71.78, latMin: 40.98, latMax: 42.06 };
const OSM_SRC = `https://www.openstreetmap.org/export/embed.html?bbox=${CT_BBOX.lonMin},${CT_BBOX.latMin},${CT_BBOX.lonMax},${CT_BBOX.latMax}&layer=mapnik`;

// Real CT coordinates for our six towns — fallback when a location row has no lat/lng.
const TOWN_COORDS: Record<string, { lat: number; lng: number }> = {
  vernon: { lat: 41.8195, lng: -72.4668 },
  "south windsor": { lat: 41.8237, lng: -72.5634 },
  "windsor locks": { lat: 41.9292, lng: -72.6287 },
  bristol: { lat: 41.6718, lng: -72.9493 },
  "rocky hill": { lat: 41.6651, lng: -72.6393 },
  enfield: { lat: 41.9764, lng: -72.5917 },
};

function resolveCoords(loc: { name: string; city: string; lat: number; lng: number }) {
  if (loc.lat && loc.lng) return { lat: loc.lat, lng: loc.lng };
  const hay = `${loc.name} ${loc.city}`.toLowerCase();
  for (const [town, c] of Object.entries(TOWN_COORDS)) {
    if (hay.includes(town)) return c;
  }
  return null;
}

function project(lat: number, lng: number) {
  const x = ((lng - CT_BBOX.lonMin) / (CT_BBOX.lonMax - CT_BBOX.lonMin)) * 100;
  const y = ((CT_BBOX.latMax - lat) / (CT_BBOX.latMax - CT_BBOX.latMin)) * 100;
  return { x, y };
}

function DeliveryPage() {
  const loc = useCurrentLocation();
  const locations = useLiveLocations();
  const { orders } = useLiveOrders();
  const active = orders.filter(
    (o) =>
      (loc === "all" || o.locationId === loc) &&
      o.type === "delivery" &&
      (o.status === "out_for_delivery" || o.status === "ready" || o.status === "preparing"),
  );

  const pins = locations
    .filter((l) => loc === "all" || l.id === loc)
    .map((l) => ({ ...l, coords: resolveCoords(l) }))
    .filter((l) => l.coords);

  return (
    <>
      <PageHeader title="Delivery" description={`${active.length} active deliveries`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Our locations</CardTitle></CardHeader>
          <CardContent>
            <div className="relative h-[420px] overflow-hidden rounded-lg border">
              <iframe
                title="Jamaican Kitchen delivery locations"
                src={OSM_SRC}
                className="absolute inset-0 h-full w-full"
                style={{ border: 0 }}
                loading="lazy"
              />
              {/* Store markers projected onto the same CT bounding box as the map */}
              <div className="pointer-events-none absolute inset-0">
                {pins.map((l) => {
                  const { x, y } = project(l.coords!.lat, l.coords!.lng);
                  return (
                    <div
                      key={l.id}
                      className="absolute -translate-x-1/2 -translate-y-full"
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      <div className="flex flex-col items-center">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/25">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div className="mt-0.5 whitespace-nowrap rounded bg-background/95 px-1.5 py-0.5 text-[11px] font-medium shadow">
                          {l.name.replace("Jamaican Kitchen, ", "").replace("Jamaican Kitchen ", "")}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Pins show our {pins.length} Connecticut locations. Live courier GPS can be layered on once a delivery
              integration is connected.
            </p>
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
              </div>
            ))}
            {active.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No active deliveries.</div>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
