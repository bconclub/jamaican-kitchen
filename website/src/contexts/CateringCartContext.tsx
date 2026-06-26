import { createContext, useContext, useState, ReactNode } from "react";

// A separate cart for catering, kept entirely apart from the online-ordering
// cart (CartContext) so the two flows never mix.
export interface CateringCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CateringCartType {
  items: CateringCartItem[];
  addItem: (item: Omit<CateringCartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  open: () => void;
}

const CateringCartContext = createContext<CateringCartType | undefined>(undefined);

export const CateringCartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CateringCartItem[]>([]);
  const [isOpen, setOpen] = useState(false);

  const addItem = (newItem: Omit<CateringCartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === newItem.id);
      if (existing) {
        return prev.map((i) => (i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
    setOpen(true); // open the catering panel so the selection is visible
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) return removeItem(id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CateringCartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, totalPrice, isOpen, setOpen, open: () => setOpen(true) }}
    >
      {children}
    </CateringCartContext.Provider>
  );
};

export const useCateringCart = () => {
  const ctx = useContext(CateringCartContext);
  if (!ctx) throw new Error("useCateringCart must be used within a CateringCartProvider");
  return ctx;
};
