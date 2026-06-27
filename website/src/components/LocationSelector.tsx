import { useState } from "react";
import { MapPin, Clock, Phone, Lock, Navigation } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCart } from "@/contexts/CartContext";

const locations = [
  { id: "vernon", name: "Vernon", address: "123 Main St, Vernon, CT 06066", phone: "(860) 555-1001", hours: "11am - 9pm", lat: 41.8195, lng: -72.4668 },
  { id: "south-windsor", name: "South Windsor", address: "456 Oak Ave, South Windsor, CT 06074", phone: "(860) 555-1002", hours: "11am - 9pm", lat: 41.8237, lng: -72.5634 },
  { id: "windsor-locks", name: "Windsor Locks", address: "789 Elm St, Windsor Locks, CT 06096", phone: "(860) 555-1003", hours: "11am - 9pm", lat: 41.9292, lng: -72.6287 },
  { id: "bristol", name: "Bristol", address: "321 Pine Rd, Bristol, CT 06010", phone: "(860) 555-1004", hours: "11am - 9pm", lat: 41.6718, lng: -72.9493 },
  { id: "rocky-hill", name: "Rocky Hill", address: "654 Cedar Ln, Rocky Hill, CT 06067", phone: "(860) 555-1005", hours: "11am - 9pm", lat: 41.6651, lng: -72.6393 },
  { id: "enfield", name: "Enfield", address: "987 Maple Dr, Enfield, CT 06082", phone: "(860) 555-1006", hours: "11am - 9pm", lat: 41.9764, lng: -72.5917 },
];

const mapSrc = (lat: number, lng: number) => {
  const d = 0.015;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
};

interface LocationSelectorProps {
  selectedLocation: string;
  onLocationChange: (locationId: string) => void;
}

export const LocationSelector = ({
  selectedLocation,
  onLocationChange,
}: LocationSelectorProps) => {
  const { items, clearCart } = useCart();
  const hasItems = items.length > 0;
  const [pending, setPending] = useState<string | null>(null);
  const currentLocation = locations.find((loc) => loc.id === selectedLocation);

  // Switching location while the order has items would mix items across stores,
  // so confirm and clear the order first.
  const handleChange = (next: string) => {
    if (next === selectedLocation) return;
    if (hasItems) {
      setPending(next);
      return;
    }
    onLocationChange(next);
  };

  const confirmSwitch = () => {
    if (pending) {
      clearCart();
      onLocationChange(pending);
    }
    setPending(null);
  };

  return (
    <div className="bg-card border-2 border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-5 w-5 text-secondary" />
        <span className="font-semibold">Pickup Location</span>
      </div>
      {/* Tap to switch — easier than a dropdown, especially on mobile */}
      <div className="flex flex-wrap gap-1.5">
        {locations.map((location) => {
          const active = location.id === selectedLocation;
          return (
            <button
              key={location.id}
              type="button"
              onClick={() => handleChange(location.id)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary"
              }`}
            >
              {location.name}
            </button>
          );
        })}
      </div>

      {hasItems && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Locked to this location while you have items. Changing it clears your order.
        </p>
      )}

      <AlertDialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change pickup location?</AlertDialogTitle>
            <AlertDialogDescription>
              Your order is set for{" "}
              <span className="font-semibold">{currentLocation?.name}</span>. Switching to{" "}
              <span className="font-semibold">
                {locations.find((l) => l.id === pending)?.name}
              </span>{" "}
              will clear the items in your order. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my order</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSwitch}>
              Clear order &amp; switch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {currentLocation && (
        <div className="mt-3 space-y-3 text-sm">
          {/* Small live map of the selected store */}
          <div className="overflow-hidden rounded-lg border border-border">
            <iframe
              key={currentLocation.id}
              title={`Map of ${currentLocation.name}`}
              src={mapSrc(currentLocation.lat, currentLocation.lng)}
              className="h-32 w-full"
              style={{ border: 0 }}
              loading="lazy"
            />
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
            <span className="font-medium">{currentLocation.address}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {currentLocation.hours}</span>
            <a href={`tel:${currentLocation.phone.replace(/[^0-9+]/g, "")}`} className="flex items-center gap-1 hover:text-primary">
              <Phone className="h-4 w-4" /> {currentLocation.phone}
            </a>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentLocation.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/90"
          >
            <Navigation className="h-3.5 w-3.5" /> Get directions
          </a>
        </div>
      )}
    </div>
  );
};
