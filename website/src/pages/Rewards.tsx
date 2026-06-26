import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Star, Trophy, Wallet, Loader2, Mail, LogOut, ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { fetchMyWallet, fetchMyOrders, type WalletSummary, type MyOrder, CASHBACK_RATE } from "@/lib/loyalty";

const perks = [
  { icon: Star, title: "Earn on every order", text: `Get ${Math.round(CASHBACK_RATE * 100)}% cashback into your wallet on every pickup order.` },
  { icon: Gift, title: "Spend it like cash", text: "Use your wallet balance to pay for future orders at checkout." },
  { icon: Trophy, title: "Member perks", text: "Early access to specials and birthday treats." },
];

const Rewards = () => {
  const { session, loading, signInWithEmail, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!session) {
      setWallet(null);
      setOrders([]);
      return;
    }
    setLoadingData(true);
    Promise.all([fetchMyWallet(), fetchMyOrders()])
      .then(([w, o]) => {
        setWallet(w);
        setOrders(o);
      })
      .finally(() => setLoadingData(false));
  }, [session]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    const { error } = await signInWithEmail(email);
    setSending(false);
    if (error) setError(error);
    else setSent(true);
  };

  const loggedIn = !!session;

  return (
    <PageLayout
      title="Your Wallet"
      subtitle={loggedIn ? undefined : `Earn ${Math.round(CASHBACK_RATE * 100)}% cashback on every order. Spend it on your next meal.`}
    >
      <div className="max-w-3xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !loggedIn ? (
          /* ---- Logged out: perks + magic-link sign in ---- */
          <>
            <div className="grid md:grid-cols-3 gap-6 mb-10">
              {perks.map((p) => (
                <Card key={p.title} className="text-center">
                  <CardContent className="pt-6">
                    <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                      <p.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-bold mb-2">{p.title}</h3>
                    <p className="text-sm text-muted-foreground">{p.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                {sent ? (
                  <div className="text-center py-4">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
                      <Mail className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">Check your email</h3>
                    <p className="text-sm text-muted-foreground">
                      We sent a sign-in link to <span className="font-medium">{email}</span>. Click it to
                      open your wallet, no password needed.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSend} className="space-y-3">
                    <h3 className="font-bold text-lg text-center">Sign in to your wallet</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Enter the email you order with and we'll send you a magic link.
                    </p>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      required
                    />
                    {error && <p className="text-sm text-destructive text-center">{error}</p>}
                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={sending}>
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Email me a sign-in link"}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          /* ---- Logged in: wallet + activity + past orders (lean) ---- */
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm opacity-90">
                    <Wallet className="h-5 w-5" /> Wallet balance
                  </div>
                  <Button variant="ghost" size="sm" className="text-secondary-foreground hover:bg-white/10" onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-1" /> Sign out
                  </Button>
                </div>
                <div className="mt-2 text-4xl font-bold">
                  {loadingData ? "…" : `$${(wallet?.balance ?? 0).toFixed(2)}`}
                </div>
                <p className="mt-1 text-sm opacity-80">{session.user.email}</p>
              </div>
            </Card>

            {/* Past orders */}
            <div>
              <h3 className="flex items-center gap-2 font-bold mb-3"><Receipt className="h-5 w-5 text-secondary" /> Your orders</h3>
              {loadingData ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : orders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No orders yet. <Link to="/order" className="text-primary font-medium underline">Place your first order</Link> and earn {Math.round(CASHBACK_RATE * 100)}% back.
                </p>
              ) : (
                <div className="space-y-2">
                  {orders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="text-sm font-semibold text-secondary">{o.shortId}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(o.createdAt).toLocaleDateString()} · <span className="capitalize">{o.status.replace(/_/g, " ")}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${o.total.toFixed(2)}</p>
                        {o.cashbackEarned > 0 && <p className="text-xs text-primary">+${o.cashbackEarned.toFixed(2)} back</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Wallet activity */}
            <div>
              <h3 className="font-bold mb-3">Wallet activity</h3>
              {loadingData ? null : (wallet?.transactions.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No wallet activity yet.</p>
              ) : (
                <div className="space-y-2">
                  {wallet!.transactions.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full ${t.amount >= 0 ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                          {t.amount >= 0 ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t.note ?? (t.kind === "earn" ? "Cashback" : t.kind === "redeem" ? "Redeemed" : "Adjustment")}</p>
                          <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`font-semibold ${t.amount >= 0 ? "text-primary" : "text-muted-foreground"}`}>
                        {t.amount >= 0 ? "+" : "-"}${Math.abs(t.amount).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Rewards;
