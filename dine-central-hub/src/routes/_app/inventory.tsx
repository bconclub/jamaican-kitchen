import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { MENU, CATEGORIES, CHANNEL_META } from "@/lib/mock-data";
import type { Channel } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, Package, TrendingDown, Plus, Minus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/inventory")({
  component: InventoryPage,
});

const CHANNELS: Channel[] = ["web", "app"];

type ChannelStock = Record<string, Record<Channel, { stock: number; available: boolean }>>;

function InventoryPage() {
  const [items, setItems] = useState(() => MENU.map((m) => ({ ...m })));
  const [channelStock, setChannelStock] = useState<ChannelStock>(() => {
    const map: ChannelStock = {};
    for (const m of MENU) {
      map[m.id] = {} as Record<Channel, { stock: number; available: boolean }>;
      for (const ch of CHANNELS) {
        const ov = m.channelOverrides?.[ch];
        map[m.id][ch] = {
          stock: m.stock,
          available: ov ? ov.available : m.available,
        };
      }
    }
    return map;
  });
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | Channel>("all");

  const filtered = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase())),
    [items, q],
  );

  const lowStock = items.filter((i) => i.stock <= i.lowStockThreshold);
  const outOfStock = items.filter((i) => i.stock === 0);
  const totalUnits = items.reduce((s, i) => s + i.stock, 0);

  const adjust = (id: string, delta: number) =>
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, stock: Math.max(0, i.stock + delta) } : i)),
    );

  const adjustChannel = (id: string, ch: Channel, delta: number) =>
    setChannelStock((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [ch]: { ...prev[id][ch], stock: Math.max(0, prev[id][ch].stock + delta) },
      },
    }));

  const setChannelStockValue = (id: string, ch: Channel, value: number) =>
    setChannelStock((prev) => ({
      ...prev,
      [id]: { ...prev[id], [ch]: { ...prev[id][ch], stock: Math.max(0, value) } },
    }));

  const toggleChannelAvailable = (id: string, ch: Channel, available: boolean) => {
    setChannelStock((prev) => ({
      ...prev,
      [id]: { ...prev[id], [ch]: { ...prev[id][ch], available } },
    }));
    toast.success(`${CHANNEL_META[ch].label}: ${available ? "enabled" : "disabled"}`);
  };

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Track and edit stock per sales channel — web, app, POS, and delivery marketplaces."
      />
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard label="Total units in stock" value={totalUnits.toLocaleString()} icon={Package} tone="info" />
        <StatCard label="Low stock items" value={lowStock.length.toString()} icon={TrendingDown} tone="warning" />
        <StatCard label="Out of stock" value={outOfStock.length.toString()} icon={AlertTriangle} tone="danger" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Stock levels by channel</CardTitle>
          <Input
            placeholder="Search items..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-xs"
          />
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
            <div className="px-4 pt-2">
              <TabsList className="flex flex-wrap h-auto">
                <TabsTrigger value="all">All channels</TabsTrigger>
                {CHANNELS.map((ch) => (
                  <TabsTrigger key={ch} value={ch}>
                    {CHANNEL_META[ch].label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="all" className="mt-0">
              <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Adjust</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((i) => {
                const cat = CATEGORIES.find((c) => c.id === i.categoryId)?.name ?? "—";
                const status =
                  i.stock === 0
                    ? { label: "Out", className: "bg-destructive/10 text-destructive" }
                    : i.stock <= i.lowStockThreshold
                      ? { label: "Low", className: "bg-warning/15 text-warning" }
                      : { label: "OK", className: "bg-success/15 text-success" };
                return (
                  <TableRow key={i.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{i.imageEmoji}</span>
                        <span className="font-medium">{i.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{cat}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{i.stock}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={status.className}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => adjust(i.id, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => adjust(i.id, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
              </Table>
            </TabsContent>

            {CHANNELS.map((ch) => (
              <TabsContent key={ch} value={ch} className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Channel stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Available</TableHead>
                      <TableHead className="text-right">Adjust</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((i) => {
                      const cat = CATEGORIES.find((c) => c.id === i.categoryId)?.name ?? "—";
                      const cs = channelStock[i.id]?.[ch] ?? { stock: 0, available: false };
                      const status =
                        !cs.available
                          ? { label: "Off", className: "bg-muted text-muted-foreground" }
                          : cs.stock === 0
                            ? { label: "Out", className: "bg-destructive/10 text-destructive" }
                            : cs.stock <= i.lowStockThreshold
                              ? { label: "Low", className: "bg-warning/15 text-warning" }
                              : { label: "OK", className: "bg-success/15 text-success" };
                      return (
                        <TableRow key={i.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{i.imageEmoji}</span>
                              <span className="font-medium">{i.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{cat}</TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min={0}
                              value={cs.stock}
                              onChange={(e) =>
                                setChannelStockValue(i.id, ch, parseInt(e.target.value) || 0)
                              }
                              className="h-8 w-20 ml-auto text-right tabular-nums"
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={status.className}>
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={cs.available}
                              onCheckedChange={(v) => toggleChannelAvailable(i.id, ch, v)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7"
                                onClick={() => adjustChannel(i.id, ch, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-7 w-7"
                                onClick={() => adjustChannel(i.id, ch, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "info" | "warning" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "bg-destructive/10 text-destructive"
      : tone === "warning"
        ? "bg-warning/15 text-warning"
        : "bg-primary/10 text-primary";
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-2xl font-semibold tabular-nums">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}