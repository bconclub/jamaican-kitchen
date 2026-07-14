import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SpiceLevelBadge } from "@/components/SpiceLevelBadge";
import { CateringItem, PortionSize } from "@/data/cateringData";
import { Users, Plus } from "lucide-react";
import { useCateringCart } from "@/contexts/CateringCartContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CateringMenuCardProps {
  item: CateringItem;
}

export const CateringMenuCard = ({ item }: CateringMenuCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [flavor, setFlavor] = useState<string | null>(null);
  const { addItem } = useCateringCart();

  const lowestPrice = Math.min(...item.portions.map((p) => p.price));
  const highestPrice = Math.max(...item.portions.map((p) => p.price));
  const priceLabel =
    lowestPrice === highestPrice
      ? `$${lowestPrice.toFixed(2)}`
      : `$${lowestPrice.toFixed(2)} - $${highestPrice.toFixed(2)}`;

  const needsFlavor = !!item.modifier;
  const ready = !needsFlavor || !!flavor;

  const handleAddToCart = (portion: PortionSize) => {
    if (needsFlavor && !flavor) {
      toast.error(`Please choose a ${item.modifier!.name} first.`);
      return;
    }
    const suffix = flavor ? ` - ${flavor}` : "";
    const flavorId = flavor ? `-${flavor.toLowerCase().replace(/[^a-z0-9]+/g, "-")}` : "";
    // Only show the portion in the name when there's a real choice (trays); for
    // single-unit items (a dozen, a pack, a gallon) the name already says the unit.
    const portionLabel = item.portions.length > 1 ? ` (${portion.name})` : "";
    addItem({
      id: `${item.id}-${portion.id}${flavorId}`,
      name: `${item.name}${portionLabel}${suffix}`,
      price: portion.price,
      image: item.image,
    });
    toast.success(`${item.name}${suffix} added to your catering selection!`);
    setIsOpen(false);
    setFlavor(null);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(o) => {
        setIsOpen(o);
        if (!o) setFlavor(null);
      }}
    >
      <Card className="group overflow-hidden border-2 border-transparent hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
        <div className="relative overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-2 left-2">
            <SpiceLevelBadge level={item.spiceLevel} size="sm" />
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold text-base mb-1 line-clamp-1">{item.name}</h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2 min-h-[2.5rem]">
            {item.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-secondary">{priceLabel}</span>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
              >
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </DialogTrigger>
          </div>
        </CardContent>
      </Card>

      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Big hero image so the dish is clearly visible */}
        <img
          src={item.image}
          alt={item.name}
          className="h-48 w-full object-cover sm:h-56"
        />
        <div className="p-5 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2 text-2xl">
              {item.name}
              <SpiceLevelBadge level={item.spiceLevel} size="sm" />
            </DialogTitle>
          </DialogHeader>
          <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>

          {item.modifier && (
            <div className="mt-5">
              <div className="mb-2 flex items-baseline justify-between">
                <h4 className="font-semibold">{item.modifier.name}</h4>
                <span className="text-sm text-muted-foreground">Required</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {item.modifier.options.map((opt) => {
                  const selected = flavor === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFlavor(opt)}
                      className={`rounded-lg border p-2.5 text-left text-sm transition-colors ${
                        selected
                          ? "border-primary bg-primary/5 font-semibold"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-5 space-y-2">
            <h4 className="font-semibold">
              {item.portions.length > 1 ? "Select Portion Size" : "Add to Order"}
            </h4>
            {item.portions.map((portion) => (
              <div
                key={portion.id}
                aria-disabled={!ready}
                className={`flex items-center justify-between rounded-lg border border-border p-4 transition-colors ${
                  ready
                    ? "cursor-pointer hover:border-primary hover:bg-muted/50"
                    : "cursor-not-allowed opacity-50"
                }`}
                onClick={() => ready && handleAddToCart(portion)}
              >
                <div className="flex-1">
                  <span className="text-base font-semibold">{portion.name}</span>
                  <div className="mt-0.5 flex items-center text-sm text-muted-foreground">
                    <Users className="mr-1 h-4 w-4" />
                    Serves {portion.serves}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-primary">${portion.price.toFixed(2)}</span>
                  <Button size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {needsFlavor && !flavor && (
              <p className="text-sm text-muted-foreground">
                Choose a {item.modifier!.name.toLowerCase()} above to add this item.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
