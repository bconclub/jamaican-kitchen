import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Loader2, CheckCircle2, AlertTriangle, MapPin, Truck, ShoppingBasket } from "lucide-react";
import { useCateringCart } from "@/contexts/CateringCartContext";
import { useLocations } from "@/hooks/useMenu";
import { placeOrder, submitCateringRequest } from "@/lib/api";
import { eventTypes } from "@/data/cateringData";
import { CATERING_DELIVERY_TIERS } from "@/data/cateringDeliveryFees";
import { toast } from "sonner";

const TAX_RATE = 0.0635; // CT sales tax
const URGENT_HOURS = 24;

type Service = "pickup" | "delivery";

export const CateringCheckoutDialog = ({ trigger }: { trigger: React.ReactNode }) => {
  const { items, totalPrice, clearCart } = useCateringCart();
  const { data: locations } = useLocations();

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ mode: "checkout" | "request"; shortId?: string } | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [eventType, setEventType] = useState("");
  const [eventDateTime, setEventDateTime] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [service, setService] = useState<Service>("pickup");
  const [locationSlug, setLocationSlug] = useState("");
  const [deliveryTierId, setDeliveryTierId] = useState(CATERING_DELIVERY_TIERS[0].id);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [tip, setTip] = useState(""); // open amount, customer's choice — no preset %

  const effectiveLocation = locationSlug || locations?.[0]?.id || "vernon";
  const deliveryTier = CATERING_DELIVERY_TIERS.find((t) => t.id === deliveryTierId) ?? CATERING_DELIVERY_TIERS[0];
  const deliveryFee = service === "delivery" ? deliveryTier.fee : 0;
  const tipAmount = Math.max(0, Number(tip) || 0);

  const tax = totalPrice * TAX_RATE;
  const total = totalPrice + tax + deliveryFee + tipAmount;

  const hoursUntilEvent = useMemo(() => {
    if (!eventDateTime) return null;
    return (new Date(eventDateTime).getTime() - Date.now()) / 3_600_000;
  }, [eventDateTime]);

  const hasEventTime = hoursUntilEvent !== null;
  const isPast = hasEventTime && (hoursUntilEvent as number) < 0;
  const isUrgent = hasEventTime && !isPast && (hoursUntilEvent as number) < URGENT_HOURS;
  const canCheckout = hasEventTime && !isPast && !isUrgent;

  const reset = () => {
    setName("");
    setPhone("");
    setEmail("");
    setEventType("");
    setEventDateTime("");
    setGuestCount("");
    setService("pickup");
    setLocationSlug("");
    setDeliveryTierId(CATERING_DELIVERY_TIERS[0].id);
    setAddress("");
    setNotes("");
    setTip("");
    setResult(null);
  };

  const buildNotes = (prefix: string) => {
    const parts = [
      prefix,
      eventType && `Event type: ${eventType}`,
      `Event date/time: ${new Date(eventDateTime).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}`,
      guestCount && `Guests: ${guestCount}`,
      service === "delivery" ? `Delivery (${deliveryTier.label}): ${address.trim() || "(address pending)"}` : "Pickup",
      tipAmount > 0 && `Tip: $${tipAmount.toFixed(2)}`,
      notes.trim(),
    ];
    return parts.filter(Boolean).join("\n");
  };

  const validate = () => {
    if (!name.trim() || !phone.trim()) {
      toast.error("Please enter your name and phone number.");
      return false;
    }
    if (!eventDateTime) {
      toast.error("Please choose your event date and time.");
      return false;
    }
    if (isPast) {
      toast.error("Event date/time must be in the future.");
      return false;
    }
    if (service === "delivery" && !address.trim()) {
      toast.error("Please enter a delivery address.");
      return false;
    }
    if (items.length === 0) {
      toast.error("Your catering selection is empty.");
      return false;
    }
    return true;
  };

  // 24h+ out: a real, priced checkout — same place_order RPC as online orders.
  const handleCheckout = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const placed = await placeOrder({
        locationSlug: effectiveLocation,
        customer: { name: name.trim(), email: email.trim(), phone: phone.trim() },
        type: service,
        items: items.map((it) => ({ name: it.name, qty: it.quantity, price: it.price })),
        subtotal: Number(totalPrice.toFixed(2)),
        tax: Number(tax.toFixed(2)),
        tip: Number(tipAmount.toFixed(2)),
        fees: Number(deliveryFee.toFixed(2)),
        address: service === "delivery" ? address.trim() : undefined,
        notes: buildNotes("🎉 CATERING ORDER"),
      });
      // Defer clearing the cart until the confirmation is dismissed: this dialog's
      // trigger lives inside the sidebar's "cart has items" branch, so clearing
      // immediately would unmount this whole dialog (and its confirmation) the
      // instant the cart goes empty.
      setResult({ mode: "checkout", shortId: placed.shortId });
    } catch (err) {
      console.error(err);
      toast.error("We couldn't place your catering order. Please try again or call us.");
    } finally {
      setSubmitting(false);
    }
  };

  // Under 24h: too tight to guarantee automatic confirmation — goes to the
  // catering team as an urgent request instead of a self-serve checkout.
  const handleUrgentRequest = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const locationName = locations?.find((l) => l.id === effectiveLocation)?.name;
      const itemsLine = `Requested items: ${items.map((i) => `${i.quantity}x ${i.name}`).join(", ")} (est. $${total.toFixed(2)})`;
      await submitCateringRequest({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        event_type: eventType || undefined,
        event_date: eventDateTime.slice(0, 10),
        guest_count: guestCount ? Number(guestCount) : undefined,
        location: service === "delivery" ? address.trim() : locationName,
        message: [buildNotes("⚠️ URGENT — event within 24 hours"), itemsLine].join("\n\n"),
      });
      // Deferred for the same reason as handleCheckout above.
      setResult({ mode: "request" });
    } catch (err) {
      console.error(err);
      toast.error("We couldn't submit your request. Please try again or call us.");
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {result ? (
          <div className="py-4 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            {result.mode === "checkout" ? (
              <>
                <h3 className="text-xl font-bold mb-1">Catering order confirmed!</h3>
                <p className="text-sm text-muted-foreground">
                  Order <span className="font-semibold text-secondary">{result.shortId}</span> is booked for your event.
                  Pay at {service === "delivery" ? "delivery" : "pickup"}, cash or card.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold mb-1">Request received!</h3>
                <p className="text-sm text-muted-foreground">
                  Since your event is within 24 hours, our catering team will call you shortly to confirm availability
                  and finalize your order.
                </p>
              </>
            )}
            <Button
              className="mt-5"
              onClick={() => {
                // Clear directly here (not via onOpenChange — Radix doesn't fire
                // it on this programmatic close) now that it's safe to unmount.
                clearCart();
                setOpen(false);
              }}
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Catering Checkout</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cc-name">Name *</Label>
                <Input id="cc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cc-phone">Phone *</Label>
                  <Input id="cc-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(860) 555-0123" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cc-email">Email</Label>
                  <Input id="cc-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Event type</Label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger><SelectValue placeholder="Select event type" /></SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cc-guests">Guest count</Label>
                  <Input id="cc-guests" type="number" min="1" value={guestCount} onChange={(e) => setGuestCount(e.target.value)} placeholder="e.g. 30" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cc-datetime">Event date & time *</Label>
                <Input
                  id="cc-datetime"
                  type="datetime-local"
                  value={eventDateTime}
                  onChange={(e) => setEventDateTime(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setService("pickup")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border-2 p-2.5 text-sm font-medium transition-colors ${
                    service === "pickup" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <ShoppingBasket className="h-4 w-4" /> Pickup
                </button>
                <button
                  type="button"
                  onClick={() => setService("delivery")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border-2 p-2.5 text-sm font-medium transition-colors ${
                    service === "delivery" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <Truck className="h-4 w-4" /> Delivery
                </button>
              </div>

              {service === "pickup" ? (
                <div className="space-y-2">
                  <Label>Pickup location</Label>
                  <Select value={effectiveLocation} onValueChange={setLocationSlug}>
                    <SelectTrigger><SelectValue placeholder="Select a location" /></SelectTrigger>
                    <SelectContent>
                      {(locations ?? []).map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Delivery distance</Label>
                    <Select value={deliveryTierId} onValueChange={setDeliveryTierId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CATERING_DELIVERY_TIERS.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.label} — ${t.fee.toFixed(2)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Rough distance from our nearest location — we'll confirm the exact fee if it differs.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cc-address">Delivery address *</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="cc-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, city, ZIP" className="pl-9" />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="cc-notes">Notes (optional)</Label>
                <Textarea id="cc-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, setup needs, special requests…" rows={2} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cc-tip">Add a tip (optional)</Label>
                <div className="flex flex-wrap items-center gap-2">
                  {[0.1, 0.15, 0.2].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setTip((totalPrice * pct).toFixed(2))}
                      className="rounded-full border px-3 py-1 text-xs font-medium transition-colors hover:border-primary"
                    >
                      {Math.round(pct * 100)}%
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTip("")}
                    className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary"
                  >
                    No tip
                  </button>
                  <div className="relative w-28">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                    <Input
                      id="cc-tip"
                      type="number"
                      min="0"
                      step="0.01"
                      value={tip}
                      onChange={(e) => setTip(e.target.value)}
                      placeholder="0.00"
                      className="pl-6"
                    />
                  </div>
                </div>
              </div>

              {/* Order summary */}
              <div className="space-y-1 rounded-lg border bg-muted/30 p-3 text-sm">
                <Row label="Items subtotal" value={`$${totalPrice.toFixed(2)}`} />
                <Row label="Tax" value={`$${tax.toFixed(2)}`} />
                {service === "delivery" && <Row label={`Delivery (${deliveryTier.label})`} value={`$${deliveryFee.toFixed(2)}`} />}
                {tipAmount > 0 && <Row label="Tip" value={`$${tipAmount.toFixed(2)}`} />}
                <div className="flex justify-between border-t pt-1.5 font-semibold">
                  <span>Total</span>
                  <span className="text-secondary">${total.toFixed(2)}</span>
                </div>
              </div>

              {!hasEventTime ? (
                <p className="text-center text-sm text-muted-foreground">Choose your event date &amp; time to continue.</p>
              ) : isPast ? (
                <p className="text-center text-sm text-destructive">That date has already passed — please choose a future date.</p>
              ) : isUrgent ? (
                <div className="rounded-lg border-2 border-warning/40 bg-warning/10 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-warning-foreground">
                    <AlertTriangle className="h-4 w-4" /> Event is within 24 hours
                  </div>
                  <p className="mb-3 text-xs text-muted-foreground">
                    We can't guarantee automatic confirmation this close to your event. Submit your request now and our
                    catering team will call you within the hour to confirm availability and finalize pricing.
                  </p>
                  <Button className="w-full" disabled={submitting} onClick={handleUrgentRequest}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit urgent request"}
                  </Button>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={submitting}
                  onClick={handleCheckout}
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Confirm & pay $${total.toFixed(2)}`}
                </Button>
              )}
              {canCheckout && (
                <p className="text-center text-xs text-muted-foreground">Pay at {service === "delivery" ? "delivery" : "pickup"}, cash or card.</p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums text-foreground">{value}</span>
    </div>
  );
}
