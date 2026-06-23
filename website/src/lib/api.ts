// Data access layer, Supabase-backed, with graceful fallback to static data
// so the storefront keeps rendering even before the schema is applied.
import { supabase } from "@/integrations/supabase/client";
import { menuCategories as staticMenu, type MenuCategory } from "@/data/menuData";

export interface OrderLocation {
  id: string; // slug
  name: string;
  address: string;
  phone: string;
  hours: string;
}

const STATIC_LOCATIONS: OrderLocation[] = [
  { id: "vernon", name: "Vernon", address: "123 Main St, Vernon, CT 06066", phone: "(860) 555-1001", hours: "11am - 9pm" },
  { id: "south-windsor", name: "South Windsor", address: "456 Oak Ave, South Windsor, CT 06074", phone: "(860) 555-1002", hours: "11am - 9pm" },
  { id: "windsor-locks", name: "Windsor Locks", address: "789 Elm St, Windsor Locks, CT 06096", phone: "(860) 555-1003", hours: "11am - 9pm" },
  { id: "bristol", name: "Bristol", address: "321 Pine Rd, Bristol, CT 06010", phone: "(860) 555-1004", hours: "11am - 9pm" },
  { id: "rocky-hill", name: "Rocky Hill", address: "654 Cedar Ln, Rocky Hill, CT 06067", phone: "(860) 555-1005", hours: "11am - 9pm" },
  { id: "enfield", name: "Enfield", address: "987 Maple Dr, Enfield, CT 06082", phone: "(860) 555-1006", hours: "11am - 9pm" },
];

/** Fetch menu from Supabase, grouped into categories. Falls back to static data. */
export async function fetchMenu(): Promise<MenuCategory[]> {
  const { data: cats, error: catErr } = await supabase
    .from("menu_categories")
    .select("id, slug, name, description, sort_order")
    .eq("active", true)
    .order("sort_order");

  if (catErr || !cats || cats.length === 0) return staticMenu;

  const { data: items, error: itemErr } = await supabase
    .from("menu_items")
    .select("id, slug, category_id, name, description, base_price, image, spice_level, available, sort_order")
    .eq("available", true)
    .order("sort_order");

  if (itemErr || !items) return staticMenu;

  return cats.map((c) => ({
    id: c.slug,
    name: c.name,
    description: c.description ?? "",
    items: items
      .filter((it) => it.category_id === c.id)
      .map((it) => ({
        id: it.slug,
        name: it.name,
        description: it.description ?? "",
        price: Number(it.base_price),
        image: it.image ?? "",
        spiceLevel: it.spice_level,
        category: c.slug,
      })),
  }));
}

/** Fetch pickup locations. Falls back to static list. */
export async function fetchLocations(): Promise<OrderLocation[]> {
  const { data, error } = await supabase
    .from("locations")
    .select("slug, name, address, phone, hours")
    .eq("active", true)
    .order("name");
  if (error || !data || data.length === 0) return STATIC_LOCATIONS;
  return data.map((l) => ({
    id: l.slug,
    name: l.name,
    address: l.address ?? "",
    phone: l.phone ?? "",
    hours: l.hours ?? "",
  }));
}

export interface PlaceOrderInput {
  locationSlug: string;
  customer: { name: string; email: string; phone: string };
  type: "pickup" | "delivery";
  items: Array<{
    name: string;
    qty: number;
    price: number;
    spice_level?: string;
    menu_item_slug?: string;
  }>;
  subtotal: number;
  tax: number;
  tip?: number;
  notes?: string;
  address?: string;
}

export interface PlacedOrder {
  orderId: string;
  shortId: string;
}

/** Submit an order via the place_order security-definer RPC. */
export async function placeOrder(input: PlaceOrderInput): Promise<PlacedOrder> {
  const { data, error } = await supabase.rpc("place_order", {
    p_location_slug: input.locationSlug,
    p_customer: input.customer,
    p_type: input.type,
    p_items: input.items,
    p_subtotal: input.subtotal,
    p_tax: input.tax,
    p_tip: input.tip ?? 0,
    p_notes: input.notes ?? null,
    p_address: input.address ?? null,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) throw new Error("Order could not be created");
  return { orderId: row.order_id, shortId: row.short_id };
}

export interface CateringInput {
  name: string;
  email: string;
  phone: string;
  event_type?: string;
  event_date?: string;
  guest_count?: number;
  location?: string;
  message?: string;
}

/** Submit a catering / event booking request. */
export async function submitCateringRequest(input: CateringInput): Promise<void> {
  const { error } = await supabase.from("catering_requests").insert({
    name: input.name,
    email: input.email || null,
    phone: input.phone || null,
    event_type: input.event_type || null,
    event_date: input.event_date || null,
    guest_count: input.guest_count ?? null,
    location: input.location || null,
    message: input.message || null,
  });
  if (error) throw error;
}

export interface ContactInput {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

/** Submit a Contact Us message. */
export async function submitContactMessage(input: ContactInput): Promise<void> {
  const { error } = await supabase.from("contact_messages").insert({
    name: input.name,
    email: input.email || null,
    phone: input.phone || null,
    subject: input.subject || null,
    message: input.message,
  });
  if (error) throw error;
}
