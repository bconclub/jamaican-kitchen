export type Channel = "web" | "app";

export type OrderStatus =
  | "new"
  | "accepted"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  manager: string;
  phone: string;
  hours: string;
  channels: Channel[];
  lat: number;
  lng: number;
}

export interface OrderItem {
  id: string;
  name: string;
  qty: number;
  price: number;
  modifiers?: string[];
}

export interface Order {
  id: string;
  shortId: string;
  channel: Channel;
  locationId: string;
  customerId: string;
  customerName: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  fees: number;
  tip: number;
  total: number;
  status: OrderStatus;
  type: "delivery" | "pickup" | "dine_in";
  createdAt: string; // ISO
  updatedAt?: string; // ISO, last status change (used to freeze the duration timer)
  etaMinutes: number;
  address?: string;
  notes?: string;
  courier?: { name: string; phone: string; eta: number; lat: number; lng: number };
  catering?: {
    eventDate: string; // ISO
    guests: number;
    contactPhone: string;
    setupRequired: boolean;
  };
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  channels: Channel[];
  orders: number;
  lifetimeValue: number;
  lastOrder: string;
  favorite: string;
  tags: string[];
}

export interface MenuCategory {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  basePrice: number;
  available: boolean;
  channelOverrides: Partial<Record<Channel, { available: boolean; priceMultiplier: number }>>;
  stock: number;
  lowStockThreshold: number;
  imageEmoji: string;
  featured: boolean; // "Best Seller" flag — drives the storefront homepage section
  modifierGroups?: string[]; // modifier group slugs offered by this item
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "manager" | "staff" | "developer";
  locationIds: string[] | "all";
  active: boolean;
  permissions?: Partial<Record<PermissionKey, boolean>>;
  lastActive?: string;
  avatarColor?: string;
  phone?: string;
  position?: string;
  hireDate?: string; // ISO
  hourlyWage?: number;
  emergencyContact?: { name: string; phone: string };
  address?: string;
  birthday?: string;
  notes?: string;
  clockedInAt?: string | null; // ISO of current punch-in (null if off)
  shifts?: TimePunch[];
  weeklyScheduleHours?: number;
}

export interface TimePunch {
  id: string;
  date: string; // YYYY-MM-DD
  clockIn: string; // ISO
  clockOut?: string; // ISO
  locationId?: string;
  breakMinutes?: number;
  note?: string;
}

export type PermissionKey =
  | "orders.view"
  | "orders.manage"
  | "catering.manage"
  | "delivery.manage"
  | "menu.edit"
  | "inventory.edit"
  | "customers.view"
  | "analytics.view"
  | "locations.manage"
  | "staff.manage"
  | "integrations.manage"
  | "settings.manage"
  | "developer.api";

export interface PermissionDef {
  key: PermissionKey;
  label: string;
  description: string;
  group: "Operations" | "Management" | "Administration" | "Developer";
}

export interface ChannelIntegration {
  channel: Channel;
  name: string;
  status: "live" | "mock" | "not_configured" | "error";
  lastSync: string;
  webhookUrl: string;
  autoAccept: boolean;
  prepPaddingMin: number;
  priceMarkupPct: number;
  description: string;
}