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
import { useWalletAuth, recordOrder } from "@/contexts/WalletAuthContext";
import { WalletLoginDialog } from "@/components/WalletLoginDialog";
import { fetchMyWalletBalance, CASHBACK_RATE } from "@/lib/loyalty";
import { LogIn } from "lucide-react";
import { toast } from "sonner";

const TAX_RATE = 0.0635; // CT sales tax

export const CheckoutDialog = ({ trigger }: { trigger: React.ReactNode }) => {
  const { items, totalPrice, clearCart, pickupLocation, setCartOpen, setLastOrder } = useCart();
  const { data: locations } = useLocations();
  const { session } = useAuth();
  const { user: walletUser, balance: walletAuthBalance, reload: reloadWallet } = useWalletAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [locationSlug, setLocationSlug] = useState("");
  const [notes, setNotes] = useState("");

  const [sessionBalance, setSessionBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  // Logged-in customer = real Supabase session OR the demo wallet user.
  const loggedIn = !!session || !!walletUser;
  const walletBalance = session ? sessionBalance : walletAuthBalance;

  const tax = totalPrice * TAX_RATE;
  const total = totalPrice + tax;
  const cashback = Number((totalPrice * CASHBACK_RATE).toFixed(2));
  const redeem = useWallet ? Math.min(walletBalance, total) : 0;
  const payable = Math.max(0, total - redeem);

  const effectiveLocation = locationSlug || pickupLocation || locations?.[0]?.id || "vernon";

  // Prefill + load balance when checkout opens for a logged-in customer.
  useEffect(() => {
    if (!open) return;
    if (session) {
      fetchMyWalletBalance().then(setSessionBalance).catch(() => setSessionBalance(0));
      if (session.user.email) setEmail((e) => e || session.user.email!);
    } else if (walletUser) {
      reloadWallet(); // refresh balance from storage in case a prior order changed it
      setEmail((e) => e || walletUser.email);
      setName((n) => n || walletUser.name);
    }
  }, [open, session, walletUser, reloadWallet]);

  // Open the login popup in place — no redirect, so they stay in checkout.
  const goLogin = () => setLoginOpen(true);

  const reset = () => {
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
    setLocationSlug("");
    setUseWallet(false);
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
        // Real wallet redeem only with a Supabase session; demo redeem is applied below.
        walletRedeem: session && redeem > 0 ? Number(redeem.toFixed(2)) : 0,
      });

      // Demo wallet (no Supabase session): record the order against the customer's
      // EMAIL so it shows whenever that email logs in. Works for guests too.
      if (!session) {
        const orderEmail = email.trim() || walletUser?.email || "";
        if (orderEmail) {
          recordOrder(orderEmail, {
            order: {
              id: result.shortId,
              shortId: result.shortId,
              createdAt: new Date().toISOString(),
              status: "new",
              total: Number(payable.toFixed(2)),
              cashbackEarned: cashback,
              items: items.map((it) => ({ name: it.name, qty: it.quantity, price: it.price })),
            },
            cashback,
            redeem: redeem > 0 ? Number(redeem.toFixed(2)) : 0,
          });
          reloadWallet(); // reflect it in the header/wallet immediately
        }
      }

      const loc = (locations ?? []).find((l) => l.id === effectiveLocation);
      setLastOrder({
        shortId: result.shortId,
        items: items.map((it) => ({ name: it.name, quantity: it.quantity, price: it.price, image: it.image })),
        subtotal: Number(totalPrice.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        total: Number(payable.toFixed(2)),
        type: "pickup",
        customerName: name.trim(),
        locationName: loc?.name ?? "Jamaican Kitchen",
        locationAddress: loc?.address ?? "",
        locationPhone: loc?.phone ?? "",
        walletRedeemed: redeem > 0 ? Number(redeem.toFixed(2)) : 0,
        // Demo wallet has no Supabase result, so report the values we just applied.
        cashbackEarned: session ? result.cashbackEarned : cashback,
        walletBalance: session ? result.walletBalance : Number(Math.max(0, walletBalance - redeem + cashback).toFixed(2)),
      });

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
    <>
    <WalletLoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
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

          {/* Not logged in: offer to log in so they can redeem wallet credits */}
          {!loggedIn && (
            <button
              type="button"
              onClick={goLogin}
              className="flex w-full items-center justify-between rounded-lg border-2 border-dashed border-border p-3 text-left transition-colors hover:border-primary"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="h-4 w-4 text-secondary" />
                Log in to redeem your wallet credits
              </span>
              <LogIn className="h-4 w-4 text-muted-foreground" />
            </button>
          )}

          {/* Logged in with a balance: redeem toggle */}
          {loggedIn && walletBalance > 0 && (
            <button
              type="button"
              onClick={() => setUseWallet((v) => !v)}
              className={`w-full flex items-center justify-between rounded-lg border-2 p-3 text-left transition-colors ${
                useWallet ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                <Wallet className="h-4 w-4 text-secondary" />
                Use my wallet (${walletBalance.toFixed(2)})
              </span>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${useWallet ? "border-primary bg-primary" : "border-muted-foreground/40"}`}>
                {useWallet && <span className="h-2 w-2 rounded-full bg-primary-foreground" />}
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
            <p className="flex items-center gap-1.5 text-xs text-primary pt-1">
              <Wallet className="h-3.5 w-3.5" /> You'll earn ${cashback.toFixed(2)} cashback ({Math.round(CASHBACK_RATE * 100)}%) on this order.
            </p>
            <p className="text-xs text-muted-foreground">Pay at pickup.</p>
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
    </>
  );
};
