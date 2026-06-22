import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, formatMoney } from "@/components/PageHeader";
import { CUSTOMERS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ChannelBadge } from "@/components/ChannelBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_app/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => CUSTOMERS.filter((c) => (c.name + c.email).toLowerCase().includes(q.toLowerCase())),
    [q],
  );
  const totalLtv = CUSTOMERS.reduce((s, c) => s + c.lifetimeValue, 0);
  const vip = CUSTOMERS.filter((c) => c.tags.includes("VIP")).length;

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
                <TableRow key={c.id}>
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