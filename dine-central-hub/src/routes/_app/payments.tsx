import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, formatMoney } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Landmark, CreditCard, Wallet, Smartphone, Banknote, Plug, CheckCircle2, AlertCircle, Plus, ShieldCheck, ArrowDownToLine, ArrowUpFromLine,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/payments")({
  component: PaymentsPage,
});

type Status = "connected" | "disconnected" | "action_required";

const initialBanks = [
  { id: "b1", name: "Chase Business Checking", mask: "•••• 4821", balance: 48230.55, status: "connected" as Status, primary: true },
  { id: "b2", name: "Bank of America Savings", mask: "•••• 9120", balance: 122500.00, status: "connected" as Status, primary: false },
];

const initialGateways = [
  { id: "stripe", name: "Stripe", desc: "Cards, Apple Pay, Google Pay", icon: CreditCard, status: "connected" as Status, fee: "2.9% + 30¢", volume: 18420 },
  { id: "square", name: "Square", desc: "In-store terminal & online", icon: Landmark, status: "connected" as Status, fee: "2.6% + 10¢", volume: 9210 },
  { id: "adyen", name: "Adyen", desc: "Global card processing", icon: CreditCard, status: "disconnected" as Status, fee: "Interchange++", volume: 0 },
  { id: "paypal", name: "PayPal", desc: "PayPal balance & Venmo", icon: Wallet, status: "action_required" as Status, fee: "3.49% + 49¢", volume: 2140 },
];

const initialThirdParty = [
  { id: "applepay", name: "Apple Pay", desc: "Wallet tokenization", icon: Smartphone, status: "connected" as Status },
  { id: "googlepay", name: "Google Pay", desc: "Wallet tokenization", icon: Smartphone, status: "connected" as Status },
  { id: "cashapp", name: "Cash App Pay", desc: "Block-powered wallet", icon: Wallet, status: "disconnected" as Status },
  { id: "afterpay", name: "Afterpay", desc: "Buy now, pay later", icon: Banknote, status: "disconnected" as Status },
];

const initialMarketplaces: Array<{ id: string; name: string; desc: string; status: Status; commission: string; pending: number; lastPayout: string; nextPayout: string }> = [];

function PaymentsPage() {
  const [banks, setBanks] = useState(initialBanks);
  const [gateways, setGateways] = useState(initialGateways);
  const [thirdParty, setThirdParty] = useState(initialThirdParty);
  const [marketplaces, setMarketplaces] = useState(initialMarketplaces);

  const totalBalance = banks.reduce((s, b) => s + b.balance, 0);
  const monthlyVolume = gateways.reduce((s, g) => s + g.volume, 0);

  const toggle = <T extends { id: string; status: Status }>(list: T[], setList: (l: T[]) => void) => (id: string) => {
    setList(list.map((x) => x.id === id ? { ...x, status: x.status === "connected" ? "disconnected" : "connected" } : x));
    toast.success("Updated connection");
  };

  return (
    <>
      <PageHeader
        title="Payments"
        description="Connect bank accounts, payment gateways, and third-party wallets."
        actions={
          <AddBankDialog onAdd={(b) => setBanks([...banks, b])} />
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPI label="Total balance" value={formatMoney(totalBalance)} icon={<Landmark className="h-4 w-4" />} />
        <KPI label="Monthly volume" value={formatMoney(monthlyVolume)} icon={<ArrowDownToLine className="h-4 w-4" />} />
        <KPI label="Pending payouts" value={formatMoney(3240)} icon={<ArrowUpFromLine className="h-4 w-4" />} />
      </div>

      <Tabs defaultValue="banks" className="mt-6">
        <TabsList>
          <TabsTrigger value="banks">Bank accounts</TabsTrigger>
          <TabsTrigger value="gateways">Payment gateways</TabsTrigger>
          <TabsTrigger value="marketplaces">Delivery marketplaces</TabsTrigger>
          <TabsTrigger value="thirdparty">Third-party</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="banks" className="mt-4">
          <div className="grid gap-3 lg:grid-cols-2">
            {banks.map((b) => (
              <Card key={b.id}>
                <CardContent className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{b.name}</span>
                        {b.primary && <Badge variant="secondary" className="text-[10px]">Primary</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground">{b.mask} · ACH enabled</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold tabular-nums">{formatMoney(b.balance)}</div>
                    <StatusBadge status={b.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="gateways" className="mt-4">
          <div className="grid gap-3 lg:grid-cols-2">
            {gateways.map((g) => {
              const Icon = g.icon;
              return (
                <Card key={g.id}>
                  <CardContent className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-accent-foreground">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">{g.name}</div>
                        <div className="text-xs text-muted-foreground">{g.desc} · {g.fee}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs text-muted-foreground">
                        <div>30d volume</div>
                        <div className="font-semibold tabular-nums text-foreground">{formatMoney(g.volume)}</div>
                      </div>
                      <Button
                        size="sm"
                        variant={g.status === "connected" ? "outline" : "default"}
                        onClick={() => toggle(gateways, setGateways)(g.id)}
                      >
                        <Plug className="h-3.5 w-3.5" />
                        {g.status === "connected" ? "Disconnect" : "Connect"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="thirdparty" className="mt-4">
          <div className="grid gap-3 lg:grid-cols-2">
            {thirdParty.map((t) => {
              const Icon = t.icon;
              return (
                <Card key={t.id}>
                  <CardContent className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.desc}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={t.status} />
                      <Switch
                        checked={t.status === "connected"}
                        onCheckedChange={() => toggle(thirdParty, setThirdParty)(t.id)}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="marketplaces" className="mt-4 space-y-3">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground">
                    <tr className="border-b">
                      <th className="px-4 py-2">Platform</th>
                      <th className="px-4 py-2">Commission</th>
                      <th className="px-4 py-2 text-right">Pending payout</th>
                      <th className="px-4 py-2">Last payout</th>
                      <th className="px-4 py-2">Next payout</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketplaces.map((m) => (
                      <tr key={m.id} className="border-b last:border-0">
                        <td className="px-4 py-3">
                          <div className="font-medium">{m.name}</div>
                          <div className="text-xs text-muted-foreground">{m.desc}</div>
                        </td>
                        <td className="px-4 py-3 tabular-nums">{m.commission}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatMoney(m.pending)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{m.lastPayout}</td>
                        <td className="px-4 py-3 text-muted-foreground">{m.nextPayout}</td>
                        <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toast.success(`Reconciling ${m.name} payouts`)}
                            >Reconcile</Button>
                            <Button
                              size="sm"
                              variant={m.status === "connected" ? "outline" : "default"}
                              onClick={() => toggle(marketplaces, setMarketplaces)(m.id)}
                            >
                              <Plug className="h-3.5 w-3.5" />
                              {m.status === "connected" ? "Disconnect" : "Connect"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-3 sm:grid-cols-3">
            <KPI label="Pending across platforms" value={formatMoney(marketplaces.reduce((s, m) => s + m.pending, 0))} icon={<ArrowDownToLine className="h-4 w-4" />} />
            <KPI label="Avg. commission" value="27.3%" icon={<Banknote className="h-4 w-4" />} />
            <KPI label="Connected platforms" value={`${marketplaces.filter(m => m.status === "connected").length} / ${marketplaces.length}`} icon={<Plug className="h-4 w-4" />} />
          </div>
        </TabsContent>

        <TabsContent value="thirdparty-old" className="mt-4 hidden">
          <div />
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Payout & security</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Row label="Auto payout" desc="Send daily settlements to primary bank">
                <Switch defaultChecked />
              </Row>
              <Row label="Payout schedule" desc="When funds are released">
                <Input className="max-w-[160px]" defaultValue="Daily" />
              </Row>
              <Row label="Two-factor on payouts" desc="Require approval for transfers > $5,000">
                <Switch defaultChecked />
              </Row>
              <Row label="PCI compliance mode" desc="SAQ-A for hosted checkout">
                <Badge className="gap-1"><ShieldCheck className="h-3 w-3" /> Active</Badge>
              </Row>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function KPI({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">{icon}</span>
        </div>
        <div className="mt-2 text-2xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "connected") return <span className="inline-flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-3 w-3" /> Connected</span>;
  if (status === "action_required") return <span className="inline-flex items-center gap-1 text-xs text-warning-foreground"><AlertCircle className="h-3 w-3" /> Action needed</span>;
  return <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">Disconnected</span>;
}

function AddBankDialog({ onAdd }: { onAdd: (b: typeof initialBanks[number]) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [mask, setMask] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Connect bank</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect a bank account</DialogTitle>
          <DialogDescription>Linked via Plaid · routing & account numbers are encrypted.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Account name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Chase Business Checking" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Last 4 digits</Label>
            <Input value={mask} onChange={(e) => setMask(e.target.value)} placeholder="1234" maxLength={4} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (!name || mask.length !== 4) return toast.error("Fill all fields");
              onAdd({ id: crypto.randomUUID(), name, mask: `•••• ${mask}`, balance: 0, status: "connected", primary: false });
              toast.success("Bank connected");
              setOpen(false);
              setName(""); setMask("");
            }}
          >Connect</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}