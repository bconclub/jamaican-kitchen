// Live Supabase data for the admin dashboard (orders feed + menu + locations).
// Plain hooks (no react-query provider in this TanStack Start app) with
// Supabase Realtime subscriptions so the order feed updates with no refresh.
import { useEffect, useState, useCallback, useId } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Order, OrderStatus, MenuItem, MenuCategory, Location, Channel, Customer } from "./types";

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
  updated_at: string | null;
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
    updatedAt: o.updated_at ?? o.created_at,
    etaMinutes: o.eta_minutes ?? 20,
    address: o.address ?? undefined,
    notes: o.notes ?? undefined,
  };
}

export function useLiveOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const channelId = useId();

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
    // Unique channel name per hook instance, Supabase rejects duplicate-named channels.
    const ch = supabase
      .channel(`admin-orders-feed-${channelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, reload)
      .on("postgres_changes", { event: "*", schema: "public", table: "order_status_events" }, reload)
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [reload, channelId]);

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

// ---------- Catering requests (live) ----------
interface DbCateringRequest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  event_type: string | null;
  event_date: string | null;
  guest_count: number | null;
  location: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

function mapCatering(r: DbCateringRequest): Order {
  const eventDate = r.event_date ? new Date(r.event_date).toISOString() : r.created_at;
  const status = (
    ["new", "accepted", "preparing", "ready", "out_for_delivery", "completed", "cancelled"].includes(r.status)
      ? r.status
      : "new"
  ) as OrderStatus;
  return {
    id: r.id,
    shortId: "CR-" + r.id.slice(0, 4).toUpperCase(),
    channel: "web",
    locationId: "",
    customerId: "",
    customerName: r.name,
    items: [],
    subtotal: 0,
    tax: 0,
    fees: 0,
    tip: 0,
    total: 0,
    status,
    type: "delivery",
    createdAt: r.created_at,
    etaMinutes: 0,
    notes: r.message ?? undefined,
    catering: {
      eventDate,
      guests: r.guest_count ?? 0,
      contactPhone: r.phone ?? "-",
      setupRequired: false,
    },
  };
}

export function useLiveCateringRequests() {
  const [orders, setOrders] = useState<Order[]>([]);
  const reload = useCallback(async () => {
    const { data } = await supabase
      .from("catering_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setOrders((data as unknown as DbCateringRequest[]).map(mapCatering));
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { orders, reload };
}

export async function updateCateringStatus(id: string, status: OrderStatus) {
  await supabase.from("catering_requests").update({ status }).eq("id", id);
}

// ---------- Contact messages (live) ----------
export interface ContactMessage {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
}

export function useLiveContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [tableMissing, setTableMissing] = useState(false);
  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setTableMissing(true);
      return;
    }
    setMessages((data ?? []) as unknown as ContactMessage[]);
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);
  return { messages, tableMissing, reload };
}

export async function updateContactStatus(id: string, status: string) {
  await supabase.from("contact_messages").update({ status }).eq("id", id);
}

// ---------- Customers (live, with order aggregates) ----------
export function useLiveCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: cust }, { data: ords }] = await Promise.all([
        supabase.from("customers").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("customer_id, total, created_at"),
      ]);
      if (!active) return;
      const agg = new Map<string, { count: number; ltv: number; last: string }>();
      for (const o of ords ?? []) {
        if (!o.customer_id) continue;
        const a = agg.get(o.customer_id) ?? { count: 0, ltv: 0, last: o.created_at };
        a.count += 1;
        a.ltv += num(o.total);
        if (o.created_at > a.last) a.last = o.created_at;
        agg.set(o.customer_id, a);
      }
      setCustomers(
        (cust ?? []).map((c) => {
          const a = agg.get(c.id);
          return {
            id: c.id,
            name: c.name ?? "Guest",
            email: c.email ?? "",
            phone: c.phone ?? "",
            channels: (c.channels ?? ["web"]) as Channel[],
            orders: a?.count ?? 0,
            lifetimeValue: a?.ltv ?? 0,
            lastOrder: a?.last ?? c.created_at,
            favorite: "-",
            tags: [],
          };
        }),
      );
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { customers, loading };
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
