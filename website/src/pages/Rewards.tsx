import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, Star, Trophy, Wallet, Loader2, Mail, LogOut, ArrowDownLeft, ArrowUpRight, Receipt, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useWalletAuth } from "@/contexts/WalletAuthContext";
import { fetchMyWallet, fetchMyOrders, type WalletSummary, type MyOrder, CASHBACK_RATE } from "@/lib/loyalty";

const perks = [
  { icon: Star, title: "Earn on every order", text: `Get ${Math.round(CASHBACK_RATE * 100)}% cashback into your wallet on every pickup order.` },
  { icon: Gift, title: "Spend it like cash", text: "Use your wallet balance to pay for future orders at checkout." },
  { icon: Trophy, title: "Member perks", text: "Early access to specials and birthday treats." },
];

// DEMO auth: fully local, no backend. We generate a one-time code on screen,
// verify it locally; login state + balance live in WalletAuthContext (shared with
// the header + checkout). Swap for supabase OTP + live wallet when email is wired.

// Sample wallet activity shown in demo mode so the rewards screen looks alive.
const DEMO_TRANSACTIONS: WalletSummary["transactions"] = [
  { id: "d-tx-1", amount: 3.05, kind: "earn", note: "Cashback on JK-DEMO1", created_at: new Date().toISOString() },
];
const DEMO_ORDERS: MyOrder[] = [
  {
    id: "d-ord-1",
    shortId: "JK-DEMO1",
    createdAt: new Date().toISOString(),
    status: "completed",
    total: 61.0,
    cashbackEarned: 3.05,
    items: [
      { name: "Oxtail Dinner", qty: 1, price: 22.0 },
      { name: "Jerk Chicken Dinner", qty: 2, price: 19.5 },
    ],
  },
];

const Rewards = () => {
  const { session, loading, signOut } = useAuth();
  const { user: demoUser, balance: demoBalance, login, logout } = useWalletAuth();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [orders, setOrders] = useState<MyOrder[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [openOrder, setOpenOrder] = useState<string | null>(null);

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

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setOtp("");
    // DEMO: generate a random 6-digit code and show it on the next screen.
    setGeneratedOtp(String(Math.floor(100000 + Math.random() * 900000)));
    setStep("otp");
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim() !== generatedOtp) {
      setError("Incorrect code. Try again.");
      return;
    }
    setError(null);
    login(email, name);
  };

  const handleSignOut = async () => {
    logout();
    setStep("email");
    setOtp("");
    if (session) await signOut();
  };

  const loggedIn = !!session || !!demoUser;
  // In demo mode (no real session) show the sample wallet + orders.
  const effWallet = session ? wallet : { balance: demoBalance, transactions: DEMO_TRANSACTIONS };
  const effOrders = session ? orders : DEMO_ORDERS;
  const effLoadingData = session ? loadingData : false;
  const effEmail = session ? session.user.email : demoUser?.email;

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
                {step === "email" ? (
                  <form onSubmit={handleSendCode} className="space-y-3">
                    <h3 className="font-bold text-lg text-center">Sign in to your wallet</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      Enter your details and we'll send a one-time code to verify you.
                    </p>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                    />
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      autoComplete="email"
                      required
                    />
                    {error && <p className="text-sm text-destructive text-center">{error}</p>}
                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      Send code
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleVerify} className="space-y-3">
                    <div className="mx-auto mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-primary/15">
                      <Mail className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg text-center">Enter your code</h3>
                    <p className="text-sm text-muted-foreground text-center">
                      We sent a 6-digit code to <span className="font-medium">{email}</span>.
                    </p>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      className="text-center text-lg tracking-[0.5em]"
                      autoFocus
                    />
                    {/* DEMO hint — remove once real OTP email is wired */}
                    <p className="text-center text-xs text-muted-foreground">
                      Demo code: <span className="font-mono font-semibold">{generatedOtp}</span>
                    </p>
                    {error && <p className="text-sm text-destructive text-center">{error}</p>}
                    <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" disabled={sending}>
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & open wallet"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("email");
                        setError(null);
                      }}
                      className="block w-full text-center text-sm text-primary font-medium underline"
                    >
                      Use a different email
                    </button>
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
                  <Button variant="ghost" size="sm" className="text-secondary-foreground hover:bg-white/10" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4 mr-1" /> Sign out
                  </Button>
                </div>
                <div className="mt-2 text-4xl font-bold">
                  {effLoadingData ? "…" : `$${(effWallet?.balance ?? 0).toFixed(2)}`}
                </div>
                <p className="mt-1 text-sm opacity-80">{effEmail}</p>
              </div>
            </Card>

            {/* Past orders */}
            <div>
              <h3 className="flex items-center gap-2 font-bold mb-3"><Receipt className="h-5 w-5 text-secondary" /> Your orders</h3>
              {effLoadingData ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : effOrders.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No orders yet. <Link to="/order" className="text-primary font-medium underline">Place your first order</Link> and earn {Math.round(CASHBACK_RATE * 100)}% back.
                </p>
              ) : (
                <div className="space-y-2">
                  {effOrders.map((o) => {
                    const open = openOrder === o.id;
                    return (
                      <div key={o.id} className="rounded-lg border border-border overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setOpenOrder(open ? null : o.id)}
                          className="w-full flex items-center justify-between p-3 text-left hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
                            <div>
                              <p className="text-sm font-semibold text-secondary">{o.shortId}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(o.createdAt).toLocaleDateString()} · <span className="capitalize">{o.status.replace(/_/g, " ")}</span> · {o.items.reduce((n, it) => n + it.qty, 0)} item{o.items.reduce((n, it) => n + it.qty, 0) === 1 ? "" : "s"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${o.total.toFixed(2)}</p>
                            {o.cashbackEarned > 0 && <p className="text-xs text-primary">+${o.cashbackEarned.toFixed(2)} back</p>}
                          </div>
                        </button>
                        {open && (
                          <div className="border-t border-border bg-muted/30 px-3 py-2 space-y-1">
                            {o.items.length === 0 ? (
                              <p className="text-xs text-muted-foreground">Item details unavailable.</p>
                            ) : (
                              o.items.map((it, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                  <span>{it.qty} × {it.name}</span>
                                  <span className="text-muted-foreground">${(it.price * it.qty).toFixed(2)}</span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Wallet activity */}
            <div>
              <h3 className="font-bold mb-3">Wallet activity</h3>
              {effLoadingData ? null : (effWallet?.transactions.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No wallet activity yet.</p>
              ) : (
                <div className="space-y-2">
                  {effWallet!.transactions.map((t) => (
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
