import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CHANNEL_META } from "@/lib/mock-data";
import { useLiveMenu } from "@/lib/live-data";
import { supabase } from "@/integrations/supabase/client";
import type { Channel, MenuItem } from "@/lib/types";
import { PageHeader, formatMoney } from "@/components/PageHeader";
import { Plus, Search, Trash2, FolderPlus, Globe, PartyPopper, Info } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/menu")({ component: MenuPage });

const CHANNELS: Channel[] = ["web", "app"];
const SPICE = ["mild", "medium", "hot"] as const;

function ensureOverrides(m: MenuItem) {
  const overrides = { ...(m.channelOverrides ?? {}) } as MenuItem["channelOverrides"];
  for (const ch of CHANNELS) {
    if (!overrides[ch]) overrides[ch] = { available: m.available, priceMultiplier: 1 };
  }
  return overrides;
}

function slugify(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `${base || "item"}-${Math.random().toString(36).slice(2, 6)}`;
}

function MenuPage() {
  const { items: liveItems, categories: CATEGORIES, reload } = useLiveMenu();
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"base" | Channel>("base");
  const [items, setItems] = useState<MenuItem[]>([]);

  // New-item dialog
  const [newOpen, setNewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", basePrice: "", categoryId: "", spice: "mild", image: "" });
  // Online ordering and catering are two separate menus/ordering systems — this
  // just picks which one a new item is for. Catering isn't database-backed yet
  // (it's a static file in the storefront), so that path is disabled for now.
  const [menuType, setMenuType] = useState<"online" | "catering">("online");

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

  // ---- persistence ----
  const persist = async (id: string, dbPatch: Record<string, unknown>) => {
    const { error } = await supabase.from("menu_items").update(dbPatch as never).eq("id", id);
    if (error) toast.error("Couldn't save change");
  };

  const createItem = async () => {
    if (!form.name.trim()) return toast.error("Item name is required");
    if (!form.categoryId) return toast.error("Pick a category");
    setSaving(true);
    const { error } = await supabase.from("menu_items").insert({
      slug: slugify(form.name),
      name: form.name.trim(),
      description: form.description.trim() || null,
      base_price: parseFloat(form.basePrice) || 0,
      category_id: form.categoryId,
      spice_level: form.spice as "mild" | "medium" | "hot",
      image: form.image.trim() || null,
      available: true,
      stock: 100,
    });
    setSaving(false);
    if (error) return toast.error("Couldn't create item");
    toast.success(`${form.name} added`);
    setForm({ name: "", description: "", basePrice: "", categoryId: "", spice: "mild", image: "" });
    setNewOpen(false);
    reload();
  };

  const deleteItem = async (m: MenuItem) => {
    if (!window.confirm(`Delete "${m.name}"? This can't be undone.`)) return;
    const { error } = await supabase.from("menu_items").delete().eq("id", m.id);
    if (error) return toast.error("Couldn't delete item");
    toast.success(`${m.name} deleted`);
    reload();
  };

  const createCategory = async () => {
    const name = window.prompt("New category name");
    if (!name?.trim()) return;
    const { error } = await supabase.from("menu_categories").insert({
      slug: slugify(name),
      name: name.trim(),
      sort_order: CATEGORIES.length,
    });
    if (error) return toast.error("Couldn't create category");
    toast.success(`Category "${name}" added`);
    reload();
  };

  return (
    <>
      <PageHeader
        title="Menu"
        description="Items, categories & per-channel pricing and availability"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={createCategory}>
              <FolderPlus className="mr-1 h-4 w-4" /> New category
            </Button>
            <Button onClick={() => setNewOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> New item
            </Button>
          </div>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search items" className="h-9 pl-8" />
        </div>
        <button onClick={() => setCat("all")} className={`rounded-md border px-3 py-1.5 text-xs ${cat === "all" ? "border-primary bg-primary/5" : "bg-card"}`}>
          All
        </button>
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} className={`rounded-md border px-3 py-1.5 text-xs ${cat === c.id ? "border-primary bg-primary/5" : "bg-card"}`}>
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
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => (
                      <tr key={m.id} className="border-b hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{m.imageEmoji}</span>
                            <div>
                              <Input
                                value={m.name}
                                onChange={(e) => updateItem(m.id, { name: e.target.value })}
                                onBlur={(e) => persist(m.id, { name: e.target.value })}
                                className="h-8 font-medium"
                              />
                              <div className="text-xs text-muted-foreground line-clamp-1 mt-1">{m.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={m.categoryId}
                            onValueChange={(v) => {
                              updateItem(m.id, { categoryId: v });
                              persist(m.id, { category_id: v });
                            }}
                          >
                            <SelectTrigger className="h-8 w-36 text-xs">
                              <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map((c) => (
                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            value={m.basePrice}
                            onChange={(e) => updateItem(m.id, { basePrice: parseFloat(e.target.value) || 0 })}
                            onBlur={(e) => persist(m.id, { base_price: parseFloat(e.target.value) || 0 })}
                            className="h-8 w-24 ml-auto text-right tabular-nums"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Input
                            type="number"
                            min={0}
                            value={m.stock}
                            onChange={(e) => updateItem(m.id, { stock: parseInt(e.target.value) || 0 })}
                            onBlur={(e) => persist(m.id, { stock: parseInt(e.target.value) || 0 })}
                            className="h-8 w-20 ml-auto text-right tabular-nums"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Switch
                            checked={m.available}
                            onCheckedChange={(v) => {
                              updateItem(m.id, { available: v });
                              persist(m.id, { available: v });
                              toast(v ? `${m.name} available` : `${m.name} 86'd`);
                            }}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteItem(m)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
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
                        const ov = m.channelOverrides?.[ch] ?? { available: m.available, priceMultiplier: 1 };
                        const channelPrice = m.basePrice * ov.priceMultiplier;
                        return (
                          <tr key={m.id} className="border-b hover:bg-muted/40">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <span className="text-xl">{m.imageEmoji}</span>
                                <div className="font-medium">{m.name}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{formatMoney(m.basePrice)}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{ov.priceMultiplier.toFixed(2)}×</td>
                            <td className="px-4 py-3 text-right tabular-nums font-medium">{formatMoney(channelPrice)}</td>
                            <td className="px-4 py-3">
                              <Switch checked={ov.available} disabled />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
              <p className="px-4 py-2 text-xs text-muted-foreground">Per-channel overrides are read-only here for now; manage base availability/price on the Base tab.</p>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* New item dialog */}
      <Dialog open={newOpen} onOpenChange={(o) => { setNewOpen(o); if (!o) setMenuType("online"); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New menu item</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Online and catering are two separate menus/ordering systems. */}
            <div className="space-y-1.5">
              <Label>Which menu?</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMenuType("online")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border-2 p-2 text-sm font-medium transition-colors ${
                    menuType === "online" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <Globe className="h-4 w-4" /> Online menu
                </button>
                <button
                  type="button"
                  onClick={() => setMenuType("catering")}
                  className={`flex items-center justify-center gap-1.5 rounded-lg border-2 p-2 text-sm font-medium transition-colors ${
                    menuType === "catering" ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <PartyPopper className="h-4 w-4" /> Catering menu
                </button>
              </div>
            </div>

            {menuType === "catering" ? (
              <div className="flex items-start gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                The catering menu isn't database-backed yet (it's a static file in the storefront today), so it
                can't be edited from here yet. This needs a quick schema update — flagged, and it's next once
                that's in place. Switch back to Online menu to add an item now.
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Jerk Chicken" />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Short description" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Base price</Label>
                    <Input type="number" step="0.01" min={0} value={form.basePrice} onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))} placeholder="0.00" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Spice level</Label>
                    <Select value={form.spice} onValueChange={(v) => setForm((f) => ({ ...f, spice: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SPICE.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Category *</Label>
                  <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Assign a category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Image URL (optional)</Label>
                  <Input value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} placeholder="https://…" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button onClick={createItem} disabled={saving || menuType === "catering"} className="w-full">
              {menuType === "catering" ? "Not available yet" : saving ? "Adding…" : "Add item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
