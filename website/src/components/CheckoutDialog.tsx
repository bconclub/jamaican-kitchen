import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/contexts/CartContext";
import { useLocations } from "@/hooks/useMenu";
import { placeOrder } from "@/lib/api";
import { toast } from "sonner";

const TAX_RATE = 0.0635; // CT sales tax

export const CheckoutDialog = ({ trigger }: { trigger: React.ReactNode }) => {
  const { items, totalPrice, clearCart } = useCart();
  const { data: locations } = useLocations();

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<{ shortId: string } | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [locationSlug, setLocationSlug] = useState("");
  const [notes, setNotes] = useState("");

  const tax = totalPrice * TAX_RATE;
  const total = totalPrice + tax;

  const effectiveLocation = locationSlug || locations?.[0]?.id || "vernon";

  const reset = () => {
    setPlaced(null);
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setLocationSlug("");
  };

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error("Please enter your name and phone number.");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await placeOrder({
        locationSlug: effectiveLocation,
        customer: { name: name.trim(), email: email.trim(), phone: phone.trim() },
        type: "pickup",
        items: items.map((it) => ({
          name: it.name,
          qty: it.quantity,
          price: it.price,
          spice_level: it.spiceLevel,
          menu_item_slug: it.id,
        })),
        subtotal: Number(totalPrice.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        notes: notes.trim() || undefined,
      });
      setPlaced({ shortId: result.shortId });
      clearCart();
    } catch (err) {
      console.error(err);
      toast.error("Could not place your order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {placed ? (
          <div className="flex flex-col items-center text-center py-6">
            <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
            <DialogTitle className="text-2xl mb-2">Order Confirmed!</DialogTitle>
            <p className="text-muted-foreground mb-1">Your order number is</p>
            <p className="text-3xl font-bold text-secondary mb-4">{placed.shortId}</p>
            <p className="text-sm text-muted-foreground mb-6">
              We'll have it ready for pickup. Show this number at the counter.
            </p>
            <Button className="w-full" onClick={() => setOpen(false)}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Checkout — Pickup</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="co-name">Name *</Label>
                <Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="co-phone">Phone *</Label>
                  <Input id="co-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(860) 555-0123" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="co-email">Email</Label>
                  <Input id="co-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Pickup Location</Label>
                <Select value={effectiveLocation} onValueChange={setLocationSlug}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a location" />
                  </SelectTrigger>
                  <SelectContent>
                    {(locations ?? []).map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="co-notes">Notes (optional)</Label>
                <Textarea id="co-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, special requests…" rows={2} />
              </div>

              <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (6.35%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-1">
                  <span>Total</span>
                  <span className="text-secondary">${total.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground pt-1">Pay at pickup.</p>
              </div>
            </div>
            <DialogFooter>
              <Button className="w-full h-11 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold" onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Placing order…
                  </>
                ) : (
                  `Place Order — $${total.toFixed(2)}`
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
