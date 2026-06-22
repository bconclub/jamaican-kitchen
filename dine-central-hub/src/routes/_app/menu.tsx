import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CHANNEL_META } from "@/lib/mock-data";
import { useLiveMenu } from "@/lib/live-data";
import type { Channel, MenuItem } from "@/lib/types";
import { PageHeader, formatMoney } from "@/components/PageHeader";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/menu")({ component: MenuPage });

const CHANNELS: Channel[] = ["web", "app"];

function ensureOverrides(m: MenuItem) {
  const overrides = { ...(m.channelOverrides ?? {}) } as MenuItem["channelOverrides"];
  for (const ch of CHANNELS) {
    if (!overrides[ch]) overrides[ch] = { available: m.available, priceMultiplier: 1 };
  }
  return overrides;
}

function MenuPage() {
  const { items: liveItems, categories: CATEGORIES } = useLiveMenu();
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"base" | Channel>("base");
  const [items, setItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    setItems(liveItems.map((m) => ({ ...m, channelOverrides: ensureOverrides(m) })));
  }, [liveItems]);

  const filtered = items.filter(
    (m) =>
      (cat === "all" || m.categoryId === cat) &&
      m.name.toLowerCase().includes(q.toLowerCase()),
  );

  const updateItem = (id: string, patch: Partial<MenuItem>) =>
    setItems((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const updateChannel = (
    id: string,
    ch: Channel,
    patch: Partial<{ available: boolean; priceMultiplier: number }>,
  ) =>
    setItems((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const overrides = ensureOverrides(m);
        overrides[ch] = { ...overrides[ch]!, ...patch };
        return { ...m, channelOverrides: overrides };
      }),
    );

  return (
    <>
      <PageHeader
        title="Menu"
        description="Items, modifiers & per-channel pricing and availability"
        actions={
          <Button>
            <Plus className="mr-1 h-4 w-4" /> New item
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search items"
            className="h-9 pl-8"
          />
        </div>
        <button
          onClick={() => setCat("all")}
          className={`rounded-md border px-3 py-1.5 text-xs ${cat === "all" ? "border-primary bg-primary/5" : "bg-card"}`}
        >
          All
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={`rounded-md border px-3 py-1.5 text-xs ${cat === c.id ? "border-primary bg-primary/5" : "bg-card"}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="w-full">
        <TabsList className="flex flex-wrap h-auto mb-3">
          <TabsTrigger value="base">Base</TabsTrigger>
          {CHANNELS.map((ch) => (
            <TabsTrigger key={ch} value={ch}>
              {CHANNEL_META[ch].label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="base" className="mt-0">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground">
                    <tr className="border-b">
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-right">Base price</th>
                      <th className="px-4 py-3 text-right">Stock</th>
                      <th className="px-4 py-3">Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => {
                      const c = CATEGORIES.find((x) => x.id === m.categoryId);
                      return (
                        <tr key={m.id} className="border-b hover:bg-muted/40">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{m.imageEmoji}</span>
                              <div>
                                <Input
                                  value={m.name}
                                  onChange={(e) => updateItem(m.id, { name: e.target.value })}
                                  className="h-8 font-medium"
                                />
                                <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                  {m.description}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{c?.name}</td>
                          <td className="px-4 py-3 text-right">
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              value={m.basePrice}
                              onChange={(e) =>
                                updateItem(m.id, { basePrice: parseFloat(e.target.value) || 0 })
                              }
                              className="h-8 w-24 ml-auto text-right tabular-nums"
                            />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Input
                              type="number"
                              min={0}
                              value={m.stock}
                              onChange={(e) =>
                                updateItem(m.id, { stock: parseInt(e.target.value) || 0 })
                              }
                              className="h-8 w-20 ml-auto text-right tabular-nums"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Switch
                              checked={m.available}
                              onCheckedChange={(v) => {
                                updateItem(m.id, { available: v });
                                toast(v ? `${m.name} available` : `${m.name} 86'd`);
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {CHANNELS.map((ch) => (
          <TabsContent key={ch} value={ch} className="mt-0">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-xs uppercase text-muted-foreground">
                      <tr className="border-b">
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3 text-right">Base price</th>
                        <th className="px-4 py-3 text-right">Multiplier</th>
                        <th className="px-4 py-3 text-right">Channel price</th>
                        <th className="px-4 py-3">Available on {CHANNEL_META[ch].short}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((m) => {
                        const ov = m.channelOverrides?.[ch] ?? {
                          available: m.available,
                          priceMultiplier: 1,
                        };
                        const channelPrice = m.basePrice * ov.priceMultiplier;
                        return (
                          <tr key={m.id} className="border-b hover:bg-muted/40">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{m.imageEmoji}</span>
                                <div className="font-medium">{m.name}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                              {formatMoney(m.basePrice)}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Input
                                type="number"
                                step="0.01"
                                min={0}
                                value={ov.priceMultiplier}
                                onChange={(e) =>
                                  updateChannel(m.id, ch, {
                                    priceMultiplier: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="h-8 w-20 ml-auto text-right tabular-nums"
                              />
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums font-medium">
                              {formatMoney(channelPrice)}
                            </td>
                            <td className="px-4 py-3">
                              <Switch
                                checked={ov.available}
                                onCheckedChange={(v) => {
                                  updateChannel(m.id, ch, { available: v });
                                  toast(
                                    `${m.name} ${v ? "enabled" : "disabled"} on ${CHANNEL_META[ch].label}`,
                                  );
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </>
  );
}
