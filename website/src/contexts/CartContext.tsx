import { createContext, useContext, useState, useRef, ReactNode } from "react";

export interface SelectedModifier {
  group: string; // modifier group name (for display/grouping)
  name: string;  // chosen option name
  price: number; // per-unit add-on price
}

export interface CartItem {
  id: string; // line key — composite (base slug + chosen modifiers) so the same
  // dish with different options is a separate line
  baseId?: string; // the underlying menu item slug, for the order payload
  name: string;
  price: number; // unit price incl. selected modifier add-ons
  quantity: number;
  spiceLevel: "mild" | "medium" | "hot";
  image: string;
  modifiers?: SelectedModifier[];
}

// Snapshot of a completed order, kept after the cart is cleared so the
// confirmation / thank-you page can show what was ordered + next steps.
export interface PlacedOrderSummary {
  shortId: string;
  items: Array<{ name: string; quantity: number; price: number; image?: string }>;
  subtotal: number;
  tax: number;
  total: number;
  type: "pickup";
  customerName: string;
  locationName: string;
  locationAddress: string;
  locationPhone: string;
  walletRedeemed?: number;
  cashbackEarned?: number;
  walletBalance?: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  pickupLocation: string;
  setPickupLocation: (slug: string) => void;
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  openCart: () => void;
  keepCartOpen: () => void;
  lastOrder: PlacedOrderSummary | null;
  setLastOrder: (order: PlacedOrderSummary | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [pickupLocation, setPickupLocation] = useState<string>("vernon");
  const [isCartOpen, setCartOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<PlacedOrderSummary | null>(null);
  // Auto-close timer: after an add, the cart peeks open then closes itself.
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearAutoClose = () => {
    if (autoCloseRef.current) {
      clearTimeout(autoCloseRef.current);
      autoCloseRef.current = null;
    }
  };
  // Manual open (cart icon) stays open — cancel any pending auto-close.
  const openCart = () => {
    clearAutoClose();
    setCartOpen(true);
  };

  const addItem = (newItem: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === newItem.id);
      if (existing) {
        return prev.map((item) =>
          item.id === newItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
    // On desktop, peek the order panel then auto-close after ~1.8s (hovering it
    // cancels the close). On mobile, don't pop the slider — the floating cart
    // button's count just increments instead.
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 768;
    if (isDesktop) {
      setCartOpen(true);
      clearAutoClose();
      autoCloseRef.current = setTimeout(() => setCartOpen(false), 1800);
    }
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        pickupLocation,
        setPickupLocation,
        isCartOpen,
        setCartOpen,
        openCart,
        keepCartOpen: clearAutoClose,
        lastOrder,
        setLastOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
