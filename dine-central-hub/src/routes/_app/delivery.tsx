import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChannelBadge } from "@/components/ChannelBadge";
import { PageHeader } from "@/components/PageHeader";
import { useLiveLocations, useLiveOrders } from "@/lib/live-data";
import { useCurrentLocation } from "@/lib/store";
import { useEffect, useMemo, useRef } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";

export const Route = createFileRoute("/_app/delivery")({ component: DeliveryPage });

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

type LocationPin = {
  id: string;
  name: string;
  coords: { lat: number; lng: number };
};

function shortName(name: string) {
  return name.replace("Jamaican Kitchen, ", "").replace("Jamaican Kitchen ", "");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function LocationsMap({ pins }: { pins: LocationPin[] }) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderMap() {
      if (!elementRef.current) return;

      const L = await import("leaflet");
      if (cancelled || !elementRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(elementRef.current, {
          scrollWheelZoom: false,
          zoomControl: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "Map data © OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(mapRef.current);
      }

      markerLayerRef.current?.remove();
      markerLayerRef.current = L.layerGroup().addTo(mapRef.current);

      const markerIcon = (label: string) =>
        L.divIcon({
          className: "",
          html: `
            <div class="flex -translate-x-1/2 -translate-y-full flex-col items-center">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/25">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div class="mt-0.5 whitespace-nowrap rounded bg-background/95 px-1.5 py-0.5 text-[11px] font-medium shadow">
                ${escapeHtml(label)}
              </div>
            </div>
          `,
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        });

      pins.forEach((pin) => {
        L.marker([pin.coords.lat, pin.coords.lng], { icon: markerIcon(shortName(pin.name)) }).addTo(
          markerLayerRef.current!,
        );
      });

      if (pins.length > 0) {
        const bounds = L.latLngBounds(pins.map((pin) => [pin.coords.lat, pin.coords.lng]));
        mapRef.current.fitBounds(bounds.pad(0.25), { maxZoom: 10 });
      } else {
        mapRef.current.setView([41.6, -72.7], 8);
      }
    }

    renderMap();

    return () => {
      cancelled = true;
    };
  }, [pins]);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return <div ref={elementRef} className="h-[420px] rounded-lg border" />;
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

  const pins = useMemo(
    () =>
      locations
        .filter((l) => loc === "all" || l.id === loc)
        .map((l): LocationPin | null => {
          const coords = resolveCoords(l);
          return coords ? { id: l.id, name: l.name, coords } : null;
        })
        .filter((l): l is LocationPin => l !== null),
    [locations, loc],
  );

  return (
    <>
      <PageHeader title="Delivery" description={`${active.length} active deliveries`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Our locations</CardTitle></CardHeader>
          <CardContent>
            <LocationsMap pins={pins} />
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
