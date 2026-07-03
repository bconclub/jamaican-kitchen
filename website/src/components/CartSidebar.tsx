import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { SpiceLevelBadge } from "./SpiceLevelBadge";
import { CheckoutDialog } from "./CheckoutDialog";
import { useEffect, useState } from "react";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(query.matches);

    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return isMobile;
}

// Global cart drawer, opened from the header cart icon, mounted once in App.
export const CartSidebar = () => {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart, isCartOpen, setCartOpen, keepCartOpen } = useCart();
  const isMobile = useIsMobile();

  return (
    <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        onMouseEnter={keepCartOpen}
        className="flex max-h-[88vh] w-full flex-col p-0 sm:h-full sm:w-[420px] sm:max-h-none"
      >
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your Order ({totalItems})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-lg mb-2">Your order is empty</h3>
            <p className="text-muted-foreground text-sm">
              Add some delicious Jamaican dishes to get started!
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 bg-muted/50 rounded-lg p-3">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-20 w-20 object-cover rounded-md"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/20 to-secondary/20">
                        <ShoppingBag className="h-6 w-6 text-secondary/50" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm line-clamp-1">{item.name}</h4>
                      {item.modifiers && item.modifiers.length > 0 && (
                        <ul className="mt-0.5 text-xs text-muted-foreground">
                          {item.modifiers.map((m, i) => (
                            <li key={i} className="line-clamp-1">
                              {m.name}
                              {m.price > 0 ? ` (+$${m.price.toFixed(2)})` : ""}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-1">
                        <SpiceLevelBadge level={item.spiceLevel} size="sm" />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-secondary">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border bg-muted/30">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax (6.35%)</span>
                  <span>${(totalPrice * 0.0635).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-secondary">${(totalPrice * 1.0635).toFixed(2)}</span>
                </div>
              </div>

              <CheckoutDialog
                trigger={
                  <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold text-lg h-12">
                    Checkout
                  </Button>
                }
              />

              <Button
                variant="ghost"
                className="w-full mt-2 text-muted-foreground"
                onClick={clearCart}
              >
                Clear Order
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
