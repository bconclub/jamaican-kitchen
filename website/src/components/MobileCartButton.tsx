import { UtensilsCrossed } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

// Mobile-only floating cart button (sits above the chat sparkle). On mobile,
// adding an item just bumps this count instead of popping the slide-over.
export const MobileCartButton = () => {
  const { totalItems, openCart } = useCart();

  // Only appears once there's something in the order.
  if (totalItems === 0) return null;

  return (
    <button
      onClick={openCart}
      aria-label="Open cart"
      className="md:hidden fixed bottom-6 right-24 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 animate-in zoom-in"
    >
      <UtensilsCrossed className="h-6 w-6" />
      <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
        {totalItems}
      </span>
    </button>
  );
};
