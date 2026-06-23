import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SpiceLevelBadge } from "./SpiceLevelBadge";
import { useCart } from "@/contexts/CartContext";
import type { MenuItem } from "@/data/menuData";
import { toast } from "sonner";

interface MenuItemCardProps {
  item: MenuItem;
}

export const MenuItemCard = ({ item }: MenuItemCardProps) => {
  const { items, addItem, updateQuantity } = useCart();
  const qty = items.find((i) => i.id === item.id)?.quantity ?? 0;

  const handleAdd = () => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      spiceLevel: item.spiceLevel,
      image: item.image,
    });
    toast.success(`${item.name} added to your order!`);
  };

  return (
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
            ${item.price.toFixed(2)}
          </span>
          {qty === 0 ? (
            <Button
              size="sm"
              onClick={handleAdd}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1"
            >
              <Plus className="h-4 w-4" />
              Add to Order
            </Button>
          ) : (
            <div className="flex items-center gap-1 rounded-md bg-secondary text-secondary-foreground">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-secondary-foreground hover:bg-secondary-foreground/10"
                onClick={() => updateQuantity(item.id, qty - 1)}
                aria-label="Remove one"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-6 text-center font-bold tabular-nums">{qty}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-secondary-foreground hover:bg-secondary-foreground/10"
                onClick={() => updateQuantity(item.id, qty + 1)}
                aria-label="Add one"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
