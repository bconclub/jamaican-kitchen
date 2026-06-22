import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SpiceLevelBadge } from "@/components/SpiceLevelBadge";
import { CateringItem, PortionSize } from "@/data/cateringData";
import { Users, Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
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
  const { addItem } = useCart();

  const lowestPrice = Math.min(...item.portions.map((p) => p.price));
  const highestPrice = Math.max(...item.portions.map((p) => p.price));

  const handleAddToCart = (portion: PortionSize) => {
    addItem({
      id: `${item.id}-${portion.id}`,
      name: `${item.name} (${portion.name})`,
      price: portion.price,
      spiceLevel: item.spiceLevel,
      image: item.image,
    });
    toast.success(`${item.name} (${portion.name}) added to cart!`);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            <span className="text-lg font-bold text-secondary">
              ${lowestPrice.toFixed(2)} - ${highestPrice.toFixed(2)}
            </span>
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

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <img
              src={item.image}
              alt={item.name}
              className="w-16 h-16 object-cover rounded-lg"
            />
            <div>
              <span className="block">{item.name}</span>
              <SpiceLevelBadge level={item.spiceLevel} size="sm" />
            </div>
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{item.description}</p>
        <div className="space-y-2 mt-4">
          <h4 className="font-semibold text-sm">Select Portion Size</h4>
          {item.portions.map((portion) => (
            <div
              key={portion.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleAddToCart(portion)}
            >
              <div className="flex-1">
                <span className="font-medium">{portion.name}</span>
                <div className="flex items-center text-sm text-muted-foreground mt-0.5">
                  <Users className="h-3.5 w-3.5 mr-1" />
                  Serves {portion.serves}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-primary text-lg">
                  ${portion.price.toFixed(2)}
                </span>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
