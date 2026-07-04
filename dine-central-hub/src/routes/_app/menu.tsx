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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CHANNEL_META } from "@/lib/mock-data";
import {
  useLiveMenu,
  useLiveModifiers,
  createModifierGroupLive,
  updateModifierGroupLive,
  deleteModifierGroupLive,
  createModifierOptionLive,
  updateModifierOptionLive,
  deleteModifierOptionLive,
} from "@/lib/live-data";
import { supabase } from "@/integrations/supabase/client";
import type { Channel, MenuItem, ModifierGroupFull } from "@/lib/types";
import { PageHeader, formatMoney } from "@/components/PageHeader";
import { Plus, Search, Trash2, FolderPlus, Globe, PartyPopper, Info, Star, Pencil, UtensilsCrossed, X, Layers } from "lucide-react";
import { toast } from "sonner";

// In static-menu preview, edits update the on-screen list only (no Supabase write).
const PREVIEW_MENU = import.meta.env.VITE_USE_STATIC_MENU === "true";

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

function slugifyGroup(name: string) {
  const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return base || `group-${Math.random().toString(36).slice(2, 6)}`;
}

function MenuPage() {
  const { items: liveItems, categories: CATEGORIES, reload } = useLiveMenu();
  const { groups: modGroups, setGroups: setModGroups, preview: modPreview } = useLiveModifiers();
  const [cat, setCat] = useState<string>("all");
  const [q, setQ] = useState("");
  const [modFilter, setModFilter] = useState<string | null>(null);
  const [tab, setTab] = useState<"base" | "modifiers" | Channel>("base");
  const [items, setItems] = useState<MenuItem[]>([]);

  // Right-side product editor
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const openEdit = (m: MenuItem) => setEditing({ ...m, modifierGroups: [...(m.modifierGroups ?? [])] });
  const patchDraft = (patch: Partial<MenuItem>) => setEditing((d) => (d ? { ...d, ...patch } : d));
  const toggleGroup = (slug: string) =>
    setEditing((d) => {
      if (!d) return d;
      const set = new Set(d.modifierGroups ?? []);
      if (set.has(slug)) set.delete(slug);
      else set.add(slug);
      return { ...d, modifierGroups: [...set] };
    });
  const saveEdit = async () => {
    if (!editing) return;
    const d = editing;
    setSavingEdit(true);
    setItems((prev) => prev.map((m) => (m.id === d.id ? d : m)));
    if (!PREVIEW_MENU) {
      const { error } = await supabase
        .from("menu_items")
        .update({
          name: d.name,
          description: d.description || null,
          base_price: d.basePrice,
          image: d.image || null,
          spice_level: d.spiceLevel ?? "mild",
          category_id: d.categoryId,
          stock: d.stock,
          available: d.available,
          featured: d.featured,
          modifier_groups: d.modifierGroups ?? [],
        } as never)
        .eq("id", d.id);
      setSavingEdit(false);
      if (error) return toast.error("Couldn't save changes");
      toast.success(`${d.name} saved`);
    } else {
      setSavingEdit(false);
      toast.success(`${d.name} updated (preview — not written to DB)`);
    }
    setEditing(null);
  };

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

  // Distinct photos already used across the menu — lets staff reuse an existing
  // shot instead of hunting for a URL (a lightweight "gallery" until real uploads).
  const gallery = [...new Set(items.map((m) => m.image).filter((u): u is string => !!u))];

  const filtered = items.filter(
    (m) =>
      (cat === "all" || m.categoryId === cat) &&
      m.name.toLowerCase().includes(q.toLowerCase()) &&
      (!modFilter || (m.modifierGroups ?? []).includes(modFilter)),
  );
  const modFilterGroup = modFilter ? modGroups.find((g) => g.slug === modFilter) : null;

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

  // ---- Modifier groups & options (add-ons manager) ----
  const usageCount = (slug: string) => items.filter((m) => (m.modifierGroups ?? []).includes(slug)).length;

  const addGroup = async () => {
    const name = window.prompt("New add-on group name (e.g. \"Extra Toppings\")");
    if (!name?.trim()) return;
    if (modPreview) {
      const slug = slugifyGroup(name);
      setModGroups((prev) => [...prev, { id: slug, slug, name: name.trim(), required: false, min: 0, max: 1, options: [] }]);
      return toast.success(`"${name.trim()}" added (preview — not written to DB)`);
    }
    try {
      const row = await createModifierGroupLive({ name: name.trim(), required: false, min: 0, max: 1 });
      setModGroups((prev) => [...prev, { id: row.id, slug: row.slug, name: row.name, required: row.required, min: row.min_select, max: row.max_select, options: [] }]);
      toast.success(`"${name.trim()}" added`);
    } catch {
      toast.error("Couldn't create add-on group");
    }
  };

  const patchGroup = (id: string, patch: Partial<ModifierGroupFull>) => {
    setModGroups((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    if (!modPreview) void updateModifierGroupLive(id, patch).catch(() => toast.error("Couldn't save add-on group"));
  };

  const removeGroup = async (g: ModifierGroupFull) => {
    if (!window.confirm(`Delete "${g.name}"? Items offering it will lose this add-on.`)) return;
    setModGroups((prev) => prev.filter((x) => x.id !== g.id));
    if (modFilter === g.slug) setModFilter(null);
    if (!modPreview) {
      try {
        await deleteModifierGroupLive(g.id);
        toast.success(`"${g.name}" deleted`);
      } catch {
        toast.error("Couldn't delete add-on group");
      }
    } else {
      toast.success(`"${g.name}" deleted (preview)`);
    }
  };

  const addOption = async (g: ModifierGroupFull) => {
    const name = window.prompt(`New option in "${g.name}" (e.g. "Extra Cheese")`);
    if (!name?.trim()) return;
    if (modPreview) {
      const id = `${g.slug}__${Math.random().toString(36).slice(2, 6)}`;
      setModGroups((prev) => prev.map((x) => (x.id === g.id ? { ...x, options: [...x.options, { id, name: name.trim(), price: 0 }] } : x)));
      return;
    }
    try {
      const row = await createModifierOptionLive(g.id, { name: name.trim(), price: 0 });
      setModGroups((prev) => prev.map((x) => (x.id === g.id ? { ...x, options: [...x.options, { id: row.id, name: row.name, price: Number(row.price) }] } : x)));
    } catch {
      toast.error("Couldn't add option");
    }
  };

  const patchOption = (groupId: string, optId: string, patch: { name?: string; price?: number }) => {
    setModGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, options: g.options.map((o) => (o.id === optId ? { ...o, ...patch } : o)) } : g)),
    );
    if (!modPreview) void updateModifierOptionLive(optId, patch).catch(() => toast.error("Couldn't save option"));
  };

  const removeOption = async (groupId: string, optId: string) => {
    setModGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, options: g.options.filter((o) => o.id !== optId) } : g)));
    if (!modPreview) {
      try {
        await deleteModifierOptionLive(optId);
      } catch {
        toast.error("Couldn't delete option");
      }
    }
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
          <TabsTrigger value="modifiers">
            <Layers className="mr-1 h-3.5 w-3.5" /> Add-ons
          </TabsTrigger>
          {CHANNELS.map((ch) => (
            <TabsTrigger key={ch} value={ch}>
              {CHANNEL_META[ch].label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="base" className="mt-0">
          {modFilterGroup && (
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
              <Layers className="h-4 w-4 text-primary" />
              Showing items with <span className="font-medium">{modFilterGroup.name}</span>
              <button
                type="button"
                onClick={() => setModFilter(null)}
                className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground">
                    <tr className="border-b">
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3 text-right">Base price</th>
                      <th className="px-4 py-3">Options</th>
                      <th className="px-4 py-3 text-right">Stock</th>
                      <th className="px-4 py-3">Available</th>
                      <th className="px-4 py-3">Best Seller</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m) => (
                      <tr key={m.id} className="border-b hover:bg-muted/40">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => openEdit(m)}
                              title="Click to edit photo"
                              className="group relative h-11 w-11 shrink-0 overflow-hidden rounded-md border border-border"
                            >
                              {m.image ? (
                                <img src={m.image} alt={m.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 to-secondary/15 text-base">
                                  {m.imageEmoji}
                                </div>
                              )}
                              <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                                <Pencil className="h-3.5 w-3.5 text-white" />
                              </span>
                            </button>
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
                        <td className="px-4 py-3">
                          {m.modifierGroups && m.modifierGroups.length > 0 ? (
                            <span
                              className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                              title={m.modifierGroups
                                .map((s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
                                .join(", ")}
                            >
                              {m.modifierGroups.length} option{m.modifierGroups.length > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
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
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            title={m.featured ? "Remove from Best Sellers" : "Mark as Best Seller"}
                            onClick={() => {
                              const next = !m.featured;
                              updateItem(m.id, { featured: next });
                              persist(m.id, { featured: next });
                              toast(next ? `${m.name} added to Best Sellers` : `${m.name} removed from Best Sellers`);
                            }}
                          >
                            <Star className={`h-5 w-5 transition-colors ${m.featured ? "fill-primary text-primary" : "text-muted-foreground/40"}`} />
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(m)} title="Edit product">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteItem(m)} title="Delete">
                              <Trash2 className="h-4 w-4" />
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
        </TabsContent>

        <TabsContent value="modifiers" className="mt-0">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Add-on groups offered across the menu — rename, reprice, add options, or retire a group.
              {modPreview && " Changes here show in this session only until the DB migration is applied."}
            </p>
            <Button onClick={addGroup}>
              <Plus className="mr-1 h-4 w-4" /> New group
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {modGroups.map((g) => {
              const count = usageCount(g.slug);
              return (
                <Card key={g.id}>
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <Input
                        value={g.name}
                        onChange={(e) => patchGroup(g.id, { name: e.target.value })}
                        className="h-8 max-w-[220px] font-medium"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => { setModFilter(g.slug); setTab("base"); }}
                          className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/70"
                          title={`View the ${count} item${count === 1 ? "" : "s"} offering this add-on`}
                        >
                          {count} item{count === 1 ? "" : "s"}
                        </button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeGroup(g)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
                      <label className="flex items-center gap-1.5">
                        <Switch checked={g.required} onCheckedChange={(v) => patchGroup(g.id, { required: v })} className="scale-90" />
                        Required
                      </label>
                      <label className="flex items-center gap-1.5 text-muted-foreground">
                        Min
                        <Input
                          type="number"
                          min={0}
                          value={g.min}
                          onChange={(e) => patchGroup(g.id, { min: parseInt(e.target.value) || 0 })}
                          className="h-7 w-14 text-center"
                        />
                      </label>
                      <label className="flex items-center gap-1.5 text-muted-foreground">
                        Max
                        <Input
                          type="number"
                          min={1}
                          value={g.max}
                          onChange={(e) => patchGroup(g.id, { max: parseInt(e.target.value) || 1 })}
                          className="h-7 w-14 text-center"
                        />
                      </label>
                    </div>

                    <div className="space-y-1.5">
                      {g.options.map((o) => (
                        <div key={o.id} className="flex items-center gap-2">
                          <Input
                            value={o.name}
                            onChange={(e) => patchOption(g.id, o.id, { name: e.target.value })}
                            className="h-7 flex-1 text-sm"
                          />
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <span>+$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min={0}
                              value={o.price}
                              onChange={(e) => patchOption(g.id, o.id, { price: parseFloat(e.target.value) || 0 })}
                              className="h-7 w-20 text-right tabular-nums"
                            />
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeOption(g.id, o.id)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      {g.options.length === 0 && <p className="text-xs text-muted-foreground">No options yet.</p>}
                    </div>
                    <Button variant="outline" size="sm" className="mt-3 h-7 text-xs" onClick={() => addOption(g)}>
                      <Plus className="mr-1 h-3 w-3" /> Add option
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
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

      {/* Right-side product editor */}
      <Sheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
          {editing && (
            <>
              <SheetHeader className="border-b p-4 text-left">
                <SheetTitle>Edit product</SheetTitle>
              </SheetHeader>

              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {/* Image */}
                <div className="space-y-2">
                  <Label>Image</Label>
                  <div className="flex items-center gap-3">
                    {editing.image ? (
                      <img src={editing.image} alt={editing.name} className="h-20 w-20 rounded-md object-cover" />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/20 to-secondary/20">
                        <UtensilsCrossed className="h-6 w-6 text-muted-foreground/60" />
                      </div>
                    )}
                    <Input
                      value={editing.image ?? ""}
                      onChange={(e) => patchDraft({ image: e.target.value })}
                      placeholder="https://… image URL"
                      className="flex-1"
                    />
                  </div>
                  {gallery.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs text-muted-foreground">Or reuse a photo already on the menu</p>
                      <div className="flex flex-wrap gap-1.5">
                        {gallery.map((url) => (
                          <button
                            key={url}
                            type="button"
                            onClick={() => patchDraft({ image: url })}
                            title="Use this photo"
                            className={`h-11 w-11 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                              editing.image === url ? "border-primary" : "border-transparent hover:border-border"
                            }`}
                          >
                            <img src={url} alt="" className="h-full w-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={editing.name} onChange={(e) => patchDraft({ name: e.target.value })} />
                </div>

                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    value={editing.description}
                    onChange={(e) => patchDraft({ description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Base price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      value={editing.basePrice}
                      onChange={(e) => patchDraft({ basePrice: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Spice level</Label>
                    <Select value={editing.spiceLevel ?? "mild"} onValueChange={(v) => patchDraft({ spiceLevel: v as MenuItem["spiceLevel"] })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SPICE.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={editing.categoryId} onValueChange={(v) => patchDraft({ categoryId: v })}>
                    <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      min={0}
                      value={editing.stock}
                      onChange={(e) => patchDraft({ stock: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="flex items-end gap-4 pb-1">
                    <label className="flex items-center gap-2 text-sm">
                      <Switch checked={editing.available} onCheckedChange={(v) => patchDraft({ available: v })} />
                      Available
                    </label>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={editing.featured} onCheckedChange={(v) => patchDraft({ featured: v })} />
                  <Star className={`h-4 w-4 ${editing.featured ? "fill-primary text-primary" : "text-muted-foreground/50"}`} />
                  Best Seller
                </label>

                {/* Add-ons / modifier groups */}
                <div className="space-y-2 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label>Add-ons &amp; options</Label>
                    <span className="text-xs text-muted-foreground">
                      {(editing.modifierGroups?.length ?? 0)} selected
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {modGroups.map((g) => {
                      const on = (editing.modifierGroups ?? []).includes(g.slug);
                      return (
                        <button
                          key={g.slug}
                          type="button"
                          onClick={() => toggleGroup(g.slug)}
                          className={`flex w-full items-center justify-between rounded-lg border p-2.5 text-left transition-colors ${
                            on ? "border-primary bg-primary/5" : "border-border"
                          }`}
                        >
                          <span className="flex items-center gap-2.5">
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${
                                on ? "border-primary bg-primary" : "border-muted-foreground/40"
                              }`}
                            >
                              {on && <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />}
                            </span>
                            <span className="text-sm">
                              {g.name}
                              {g.required && <span className="ml-1.5 text-xs text-secondary">required</span>}
                            </span>
                          </span>
                          <span className="text-xs text-muted-foreground">{g.options.length} opt</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="border-t p-4">
                {PREVIEW_MENU && (
                  <p className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Info className="h-3.5 w-3.5" /> Preview mode — changes show here but aren't written to the database yet.
                  </p>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={saveEdit} disabled={savingEdit}>
                    {savingEdit ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
