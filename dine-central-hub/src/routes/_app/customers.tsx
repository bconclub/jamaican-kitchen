import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, formatMoney } from "@/components/PageHeader";
import { useLiveCustomers } from "@/lib/live-data";
import { supabase } from "@/integrations/supabase/client";
import type { Customer } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChannelBadge } from "@/components/ChannelBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Mail, Phone, ShoppingBag, Wallet, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

export const Route = createFileRoute("/_app/customers")({
  component: CustomersPage,
});

interface CustomerOrder {
  id: string;
  short_id: string | null;
  total: number | string;
  status: string;
  created_at: string;
}

function CustomersPage() {
  const { customers: CUSTOMERS } = useLiveCustomers();
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => CUSTOMERS.filter((c) => (c.name + c.email).toLowerCase().includes(q.toLowerCase())),
    [CUSTOMERS, q],
  );
  const totalLtv = CUSTOMERS.reduce((s, c) => s + c.lifetimeValue, 0);
  const vip = CUSTOMERS.filter((c) => c.tags.includes("VIP")).length;

  const [selected, setSelected] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (!selected) return;
    setLoadingOrders(true);
    setOrders([]);
    supabase
      .from("orders")
      .select("id, short_id, total, status, created_at")
      .eq("customer_id", selected.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data ?? []) as unknown as CustomerOrder[]);
        setLoadingOrders(false);
      });
  }, [selected]);

  return (
    <div>
      <PageHeader title="Customers" description="Unified customer database across all channels." />
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Stat label="Total customers" value={CUSTOMERS.length.toString()} />
        <Stat label="VIP" value={vip.toString()} />
        <Stat label="Lifetime value" value={formatMoney(totalLtv)} />
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>All customers</CardTitle>
          <Input placeholder="Search customers..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Channels</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">LTV</TableHead>
                <TableHead>Favorite</TableHead>
                <TableHead>Tags</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8"><AvatarFallback>{c.name.split(" ").map((p) => p[0]).join("")}</AvatarFallback></Avatar>
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.channels.map((ch) => <ChannelBadge key={ch} channel={ch} />)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{c.orders}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{formatMoney(c.lifetimeValue)}</TableCell>
                  <TableCell className="text-muted-foreground">{c.favorite}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {c.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {selected && (
            <>
              <SheetHeader className="text-left">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>{selected.name.split(" ").map((p) => p[0]).join("")}</AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle>{selected.name}</SheetTitle>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selected.channels.map((ch) => <ChannelBadge key={ch} channel={ch} />)}
                      {selected.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                    </div>
                  </div>
                </div>
              </SheetHeader>

              <div className="mt-4 space-y-2 text-sm">
                {selected.email && (
                  <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" />{selected.email}</div>
                )}
                {selected.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />{selected.phone}</div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground"><ShoppingBag className="h-3.5 w-3.5" /> Orders</div>
                  <div className="mt-1 text-2xl font-semibold tabular-nums">{selected.orders}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground"><Wallet className="h-3.5 w-3.5" /> Lifetime value</div>
                  <div className="mt-1 text-2xl font-semibold tabular-nums">{formatMoney(selected.lifetimeValue)}</div>
                </div>
              </div>

              <div className="mt-5">
                <h4 className="mb-2 text-sm font-semibold">Order history</h4>
                {loadingOrders ? (
                  <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders found.</p>
                ) : (
                  <div className="space-y-2">
                    {orders.map((o) => (
                      <div key={o.id} className="flex items-center justify-between rounded-md border p-2.5 text-sm">
                        <div>
                          <div className="font-mono text-xs text-primary">{o.short_id ?? o.id.slice(0, 6)}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(o.created_at), "MMM d, yyyy")} · <span className="capitalize">{o.status.replace(/_/g, " ")}</span>
                          </div>
                        </div>
                        <div className="tabular-nums font-medium">{formatMoney(typeof o.total === "string" ? parseFloat(o.total) : o.total)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardContent className="p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </CardContent></Card>
  );
}