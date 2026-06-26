import { Minus, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCateringCart } from "@/contexts/CateringCartContext";

// The catering selection drawer. Separate from the online-ordering cart.
// "Continue" takes the customer to the quote request form (catering is a quote flow).
export const CateringCartSidebar = () => {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart, isOpen, setOpen } = useCateringCart();

  const goToQuote = () => {
    setOpen(false);
    setTimeout(() => {
      document.getElementById("catering-quote")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:w-[420px] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            Catering Selection ({totalItems})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <UtensilsCrossed className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="font-semibold text-lg mb-2">No catering items yet</h3>
            <p className="text-muted-foreground text-sm">Add trays from the catering menu to build your event order.</p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 bg-muted/50 rounded-lg p-3">
                    {item.image && <img src={item.image} alt={item.name} className="h-16 w-16 object-cover rounded-md" />}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm">{item.name}</h4>
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-secondary">${(item.price * item.quantity).toFixed(2)}</span>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity - 1)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.id, item.quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeItem(item.id)}>
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
              <div className="flex justify-between font-bold text-lg">
                <span>Estimated total</span>
                <span className="text-secondary">${totalPrice.toFixed(2)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Final pricing is confirmed in your custom catering quote.</p>
              <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold text-lg h-12" onClick={goToQuote}>
                Continue to quote request
              </Button>
              <Button variant="ghost" className="w-full mt-2 text-muted-foreground" onClick={clearCart}>
                Clear selection
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};
