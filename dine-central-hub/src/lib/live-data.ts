// Live Supabase data for the admin dashboard (orders feed + menu + locations).
// Plain hooks (no react-query provider in this TanStack Start app) with
// Supabase Realtime subscriptions so the order feed updates with no refresh.
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Order, OrderStatus, MenuItem, MenuCategory, Location, Channel } from "./types";

// ---------- Orders (live + realtime) ----------
interface DbOrderItem {
  id: string;
  name: string;
  qty: number;
  price: number | string;
  modifiers: unknown;
}
interface DbOrder {
  id: string;
  short_id: string | null;
  channel: string;
  location_id: string | null;
  customer_id: string | null;
  customer_name: string | null;
  subtotal: number | string;
  tax: number | string;
  fees: number | string;
  tip: number | string;
  total: number | string;
  status: OrderStatus;
  type: "pickup" | "delivery" | "dine_in";
  eta_minutes: number;
  address: string | null;
  notes: string | null;
  created_at: string;
  order_items: DbOrderItem[];
}

const num = (v: number | string | null | undefined) => (v == null ? 0 : typeof v === "string" ? parseFloat(v) : v);

function mapOrder(o: DbOrder): Order {
  return {
    id: o.id,
    shortId: o.short_id ?? o.id.slice(0, 6),
    channel: (o.channel === "app" ? "app" : "web") as Channel,
    locationId: o.location_id ?? "",
    customerId: o.customer_id ?? "",
    customerName: o.customer_name ?? "Guest",
    items: (o.order_items ?? []).map((it) => ({
      id: it.id,
      name: it.name,
      qty: it.qty,
      price: num(it.price),
      modifiers: Array.isArray(it.modifiers) ? (it.modifiers as string[]) : undefined,
    })),
    subtotal: num(o.subtotal),
    tax: num(o.tax),
    fees: num(o.fees),
    tip: num(o.tip),
    total: num(o.total),
    status: o.status,
    type: o.type === "dine_in" ? "dine_in" : o.type,
    createdAt: o.created_at,
    etaMinutes: o.eta_minutes ?? 20,
    address: o.address ?? undefined,
    notes: o.notes ?? undefined,
  };
}

export function useLiveOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (!error && data) setOrders((data as unknown as DbOrder[]).map(mapOrder));
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
    const ch = supabase
      .channel("admin-orders-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_status_events" }, reload)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [reload]);

  return { orders, loading, reload };
}

/** Update an order's status and append a status event. */
export async function updateOrderStatus(orderId: string, status: OrderStatus, note?: string) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  if (error) throw error;
  await supabase.from("order_status_events").insert({ order_id: orderId, status, note: note ?? null });
}

// ---------- Locations (live) ----------
export function useLiveLocations() {
  const [locations, setLocations] = useState<Location[]>([]);
  useEffect(() => {
    supabase
      .from("locations")
      .select("*")
      .order("name")
      .then(({ data }) => {
        if (!data) return;
        setLocations(
          data.map((l) => ({
            id: l.id,
            name: l.name,
            address: l.address ?? "",
            city: l.city ?? "",
            manager: l.manager ?? "",
            phone: l.phone ?? "",
            hours: l.hours ?? "",
            channels: (l.channels ?? ["web", "app"]) as Channel[],
            lat: l.lat ?? 0,
            lng: l.lng ?? 0,
          })),
        );
      });
  }, []);
  return locations;
}

// ---------- Menu (live) ----------
const EMOJI_BY_CATEGORY: Record<string, string> = {
  patties: "🥟",
  chicken: "🍗",
  oxtail: "🥘",
  "curry-goat": "🍛",
  seafood: "🐟",
  steak: "🥩",
  sides: "🍚",
  drinks: "🍹",
};

export function useLiveMenu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: cats }, { data: mi }] = await Promise.all([
        supabase.from("menu_categories").select("*").order("sort_order"),
        supabase.from("menu_items").select("*").order("sort_order"),
      ]);
      if (!active) return;
      const catList: MenuCategory[] = (cats ?? []).map((c) => ({ id: c.id, name: c.name }));
      const catSlugById = new Map((cats ?? []).map((c) => [c.id, c.slug as string]));
      setCategories(catList);
      setItems(
        (mi ?? []).map((m) => ({
          id: m.id,
          categoryId: m.category_id ?? "",
          name: m.name,
          description: m.description ?? "",
          basePrice: num(m.base_price),
          available: m.available,
          channelOverrides: {
            web: { available: m.available, priceMultiplier: 1 },
            app: { available: m.available, priceMultiplier: 1 },
          },
          stock: m.stock,
          lowStockThreshold: m.low_stock_threshold,
          imageEmoji: EMOJI_BY_CATEGORY[catSlugById.get(m.category_id ?? "") ?? ""] ?? "🍽️",
        })),
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { items, categories, loading };
}
