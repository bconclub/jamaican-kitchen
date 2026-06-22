import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { LOCATIONS, ORDERS } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { ChannelBadge } from "@/components/ChannelBadge";
import { Button } from "@/components/ui/button";
import { setCurrentLocation } from "@/lib/store";
import { MapPin, Phone, Clock, User } from "lucide-react";

export const Route = createFileRoute("/_app/locations")({
  component: LocationsPage,
});

function LocationsPage() {
  return (
    <div>
      <PageHeader title="Locations" description="Multi-location management for the Jamaican Kitchen chain." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {LOCATIONS.map((l) => {
          const orderCount = ORDERS.filter((o) => o.locationId === l.id).length;
          return (
            <Card key={l.id}>
              <CardContent className="p-5 space-y-4">
                <div>
                  <div className="font-semibold text-lg">{l.name}</div>
                  <div className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{l.address}, {l.city}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Info icon={User} text={l.manager} />
                  <Info icon={Phone} text={l.phone} />
                  <Info icon={Clock} text={l.hours} />
                  <Info icon={MapPin} text={`${orderCount} active`} />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Channels</div>
                  <div className="flex flex-wrap gap-1">
                    {l.channels.map((c) => <ChannelBadge key={c} channel={c} />)}
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setCurrentLocation(l.id)}>
                  View this location
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
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