import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/contexts/CartContext";
import { CheckCircle2, MapPin, Phone, Receipt, Clock, CreditCard, ShoppingBag, Wallet, Star } from "lucide-react";
import { submitReview } from "@/lib/api";
import { toast } from "sonner";

const OrderConfirmation = () => {
  const { lastOrder } = useCart();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewBody, setReviewBody] = useState("");
  const [reviewSent, setReviewSent] = useState(false);
  const [sendingReview, setSendingReview] = useState(false);

  // Direct visit with no recent order → send people back to the menu.
  if (!lastOrder) return <Navigate to="/order" replace />;

  const o = lastOrder;

  const sendReview = async () => {
    if (rating === 0) return;
    setSendingReview(true);
    try {
      await submitReview({ customerName: o.customerName, rating, body: reviewBody, orderShortId: o.shortId });
      setReviewSent(true);
    } catch {
      toast.error("Couldn't submit your review, please try again.");
    } finally {
      setSendingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="min-h-screen pt-16 md:pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Success header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/15">
              <CheckCircle2 className="h-12 w-12 text-primary" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-semibold mb-2">
              Thank you{o.customerName ? `, ${o.customerName.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-muted-foreground">Your order is confirmed and we've started preparing it.</p>
            <div className="mt-5 inline-flex flex-col items-center rounded-2xl border-2 border-primary/30 bg-primary/5 px-8 py-4">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Order number</span>
              <span className="text-3xl font-bold text-secondary">{o.shortId}</span>
            </div>
          </div>

          {/* Cashback / wallet */}
          {(o.cashbackEarned ?? 0) > 0 && (
            <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <Wallet className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-bold">You earned ${(o.cashbackEarned ?? 0).toFixed(2)} cashback!</p>
                  <p className="text-sm text-muted-foreground">
                    {(o.walletRedeemed ?? 0) > 0 && <>Used ${(o.walletRedeemed ?? 0).toFixed(2)} from your wallet. </>}
                    It's in your wallet. Sign in with your email to spend it on your next order.
                  </p>
                </div>
                <Link to="/account">
                  <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary/10">
                    View wallet
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* What you ordered */}
          <div className="rounded-2xl border-2 border-border bg-card p-5 md:p-6 mb-6">
            <h2 className="flex items-center gap-2 font-bold text-lg mb-4">
              <Receipt className="h-5 w-5 text-secondary" /> Your order
            </h2>
            <div className="space-y-3">
              {o.items.map((it, i) => (
                <div key={i} className="flex items-center gap-3">
                  {it.image ? (
                    <img src={it.image} alt={it.name} className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-1">{it.name}</p>
                    <p className="text-sm text-muted-foreground">Qty {it.quantity}</p>
                  </div>
                  <span className="font-semibold">${(it.price * it.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-1 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${o.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>${o.tax.toFixed(2)}</span>
              </div>
              {(o.walletRedeemed ?? 0) > 0 && (
                <div className="flex justify-between text-secondary">
                  <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Wallet credit applied</span>
                  <span>-${(o.walletRedeemed ?? 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Total</span>
                <span className="text-secondary">${o.total.toFixed(2)}</span>
              </div>
              {(o.cashbackEarned ?? 0) > 0 && (
                <div className="flex justify-between pt-1 text-primary">
                  <span>Cashback earned</span>
                  <span>+${(o.cashbackEarned ?? 0).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Pickup details */}
          <div className="rounded-2xl border-2 border-border bg-card p-5 md:p-6 mb-6">
            <h2 className="flex items-center gap-2 font-bold text-lg mb-3">
              <MapPin className="h-5 w-5 text-secondary" /> Pickup location
            </h2>
            <p className="font-semibold">{o.locationName}</p>
            {o.locationAddress && <p className="text-sm text-muted-foreground">{o.locationAddress}</p>}
            {o.locationPhone && (
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" /> {o.locationPhone}
              </p>
            )}
          </div>

          {/* Next steps */}
          <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-5 md:p-6 mb-8">
            <h2 className="font-bold text-lg mb-4">What happens next</h2>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">1</span>
                <div>
                  <p className="font-medium">We're preparing your order</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> Usually ready in about 20–30 minutes.
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">2</span>
                <div>
                  <p className="font-medium">Show your order number at the counter</p>
                  <p className="text-sm text-muted-foreground">Give them <span className="font-semibold text-secondary">{o.shortId}</span> to collect your food.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">3</span>
                <div>
                  <p className="font-medium flex items-center gap-1.5"><CreditCard className="h-4 w-4" /> Pay at pickup</p>
                  <p className="text-sm text-muted-foreground">Pay when you collect your order, cash or card.</p>
                </div>
              </li>
            </ol>
          </div>

          {/* Review prompt */}
          <div className="rounded-2xl border-2 border-border bg-card p-5 md:p-6 mb-6">
            {reviewSent ? (
              <div className="text-center py-2">
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <p className="font-medium">Thanks for the feedback!</p>
                <p className="text-sm text-muted-foreground">Your review helps other customers and our team.</p>
              </div>
            ) : (
              <>
                <h2 className="font-bold text-lg mb-1">How was your order?</h2>
                <p className="text-sm text-muted-foreground mb-3">Rate your experience with {o.shortId}.</p>
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`${n} star${n === 1 ? "" : "s"}`}
                    >
                      <Star
                        className={`h-8 w-8 transition-colors ${
                          n <= (hoverRating || rating) ? "fill-primary text-primary" : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <>
                    <Textarea
                      value={reviewBody}
                      onChange={(e) => setReviewBody(e.target.value)}
                      placeholder="Tell us more (optional)…"
                      rows={2}
                      className="mb-3"
                    />
                    <Button onClick={sendReview} disabled={sendingReview} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      {sendingReview ? "Submitting…" : "Submit review"}
                    </Button>
                  </>
                )}
              </>
            )}
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/order" className="flex-1">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Order more</Button>
            </Link>
            <Link to="/" className="flex-1">
              <Button variant="outline" className="w-full">Back to home</Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderConfirmation;
