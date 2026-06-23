import { useState } from "react";
import { MapPin, Clock, Phone, Lock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  {
    id: "vernon",
    name: "Vernon",
    address: "123 Main St, Vernon, CT 06066",
    phone: "(860) 555-1001",
    hours: "11am - 9pm",
  },
  {
    id: "south-windsor",
    name: "South Windsor",
    address: "456 Oak Ave, South Windsor, CT 06074",
    phone: "(860) 555-1002",
    hours: "11am - 9pm",
  },
  {
    id: "windsor-locks",
    name: "Windsor Locks",
    address: "789 Elm St, Windsor Locks, CT 06096",
    phone: "(860) 555-1003",
    hours: "11am - 9pm",
  },
  {
    id: "bristol",
    name: "Bristol",
    address: "321 Pine Rd, Bristol, CT 06010",
    phone: "(860) 555-1004",
    hours: "11am - 9pm",
  },
  {
    id: "rocky-hill",
    name: "Rocky Hill",
    address: "654 Cedar Ln, Rocky Hill, CT 06067",
    phone: "(860) 555-1005",
    hours: "11am - 9pm",
  },
  {
    id: "enfield",
    name: "Enfield",
    address: "987 Maple Dr, Enfield, CT 06082",
    phone: "(860) 555-1006",
    hours: "11am - 9pm",
  },
];

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
      <Select value={selectedLocation} onValueChange={handleChange}>
        <SelectTrigger className="w-full bg-background">
          <SelectValue placeholder="Select a location" />
        </SelectTrigger>
        <SelectContent className="bg-popover">
          {locations.map((location) => (
            <SelectItem key={location.id} value={location.id}>
              {location.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

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
        <div className="mt-3 space-y-2 text-sm">
          <p className="text-muted-foreground">{currentLocation.address}</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              {currentLocation.hours}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Phone className="h-4 w-4" />
              {currentLocation.phone}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
