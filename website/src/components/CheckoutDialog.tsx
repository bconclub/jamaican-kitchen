import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Wallet } from "lucide-react";
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
import { useAuth } from "@/lib/auth";
import { fetchMyWalletBalance, CASHBACK_RATE } from "@/lib/loyalty";
import { toast } from "sonner";

const TAX_RATE = 0.0635; // CT sales tax

export const CheckoutDialog = ({ trigger }: { trigger: React.ReactNode }) => {
  const { items, totalPrice, clearCart, pickupLocation, setCartOpen, setLastOrder } = useCart();
  const { data: locations } = useLocations();
  const { session } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [locationSlug, setLocationSlug] = useState("");
  const [notes, setNotes] = useState("");

  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);

  const tax = totalPrice * TAX_RATE;
  const total = totalPrice + tax;

  const cashbackPreview = Number((totalPrice * CASHBACK_RATE).toFixed(2));
  const redeemable = Math.min(walletBalance, total);
  const redeem = useWallet ? Number(redeemable.toFixed(2)) : 0;
  const payable = Number((total - redeem).toFixed(2));

  const effectiveLocation = locationSlug || pickupLocation || locations?.[0]?.id || "vernon";

  // Load the signed-in customer's wallet balance to offer redemption.
  useEffect(() => {
    if (open && session) {
      fetchMyWalletBalance().then(setWalletBalance).catch(() => setWalletBalance(0));
    } else if (!session) {
      setWalletBalance(0);
      setUseWallet(false);
    }
  }, [open, session]);

  const reset = () => {
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
        walletRedeem: redeem,
      });

      // Snapshot the order (before clearing the cart) so the confirmation page
      // can show what was ordered + next steps.
      const loc = (locations ?? []).find((l) => l.id === effectiveLocation);
      setLastOrder({
        shortId: result.shortId,
        items: items.map((it) => ({
          name: it.name,
          quantity: it.quantity,
          price: it.price,
          image: it.image,
        })),
        subtotal: Number(totalPrice.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        total: payable,
        type: "pickup",
        customerName: name.trim(),
        locationName: loc?.name ?? "Jamaican Kitchen",
        locationAddress: loc?.address ?? "",
        locationPhone: loc?.phone ?? "",
        walletRedeemed: redeem,
        cashbackEarned: result.cashbackEarned,
        walletBalance: result.walletBalance,
        signedIn: !!session,
      });

      // Close everything, clear the cart, and go to the proper thank-you page.
      setOpen(false);
      setCartOpen(false);
      clearCart();
      reset();
      navigate("/order-confirmation");
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
        <DialogHeader>
          <DialogTitle>Checkout (Pickup)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Test helper, pre-fills customer details so orders can be placed quickly. */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full border-dashed text-muted-foreground"
            onClick={() => {
              setName("Test Customer");
              setPhone("(860) 555-0100");
              setEmail("test@jamaicankitchenct.com");
              setNotes("Test order");
            }}
          >
            Pre-fill test details
          </Button>

          <div className="space-y-2">
            <Label htmlFor="co-name">Name *</Label>
            <Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

          {/* Wallet redemption (signed-in customers with a balance) */}
          {session && walletBalance > 0 && (
            <button
              type="button"
              onClick={() => setUseWallet((v) => !v)}
              className={`flex w-full items-center justify-between rounded-lg border-2 p-3 text-sm transition-colors ${
                useWallet ? "border-primary bg-primary/5" : "border-border bg-background"
              }`}
            >
              <span className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-secondary" />
                Use wallet balance (${walletBalance.toFixed(2)})
              </span>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${useWallet ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40"}`}>
                {useWallet ? "✓" : ""}
              </span>
            </button>
          )}

          <div className="rounded-lg bg-muted/50 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (6.35%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>
            {redeem > 0 && (
              <div className="flex justify-between text-primary">
                <span>Wallet applied</span>
                <span>-${redeem.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1">
              <span>Total</span>
              <span className="text-secondary">${payable.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-muted-foreground">Pay at pickup.</span>
              <span className="font-medium text-primary">You'll earn ${cashbackPreview.toFixed(2)} cashback</span>
            </div>
            {!session && (
              <p className="text-xs text-muted-foreground pt-1">
                Order with your email to start earning — sign in on the Rewards page to use your wallet.
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button className="w-full h-11 bg-secondary text-secondary-foreground hover:bg-secondary/90 font-semibold" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Placing order…
              </>
            ) : (
              `Place Order  ·  $${payable.toFixed(2)}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
