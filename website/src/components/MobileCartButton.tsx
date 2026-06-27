import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

// Mobile-only floating cart button (sits above the chat sparkle). On mobile,
// adding an item just bumps this count instead of popping the slide-over.
export const MobileCartButton = () => {
  const { totalItems, openCart } = useCart();

  return (
    <button
      onClick={openCart}
      aria-label="Open cart"
      className="md:hidden fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-lg transition-transform hover:scale-105"
    >
      <ShoppingCart className="h-6 w-6" />
      {totalItems > 0 && (
        <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {totalItems}
        </span>
      )}
    </button>
  );
};
