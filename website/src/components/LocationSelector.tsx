import { MapPin, Clock, Phone } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const currentLocation = locations.find((loc) => loc.id === selectedLocation);

  return (
    <div className="bg-card border-2 border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPin className="h-5 w-5 text-secondary" />
        <span className="font-semibold">Pickup Location</span>
      </div>
      <Select value={selectedLocation} onValueChange={onLocationChange}>
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
