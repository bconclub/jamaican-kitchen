import type {
  Channel,
  ChannelIntegration,
  Customer,
  Location,
  MenuCategory,
  MenuItem,
  Order,
  OrderStatus,
  PermissionDef,
  PermissionKey,
  StaffMember,
} from "./types";

export const CHANNEL_META: Record<
  Channel,
  { label: string; short: string; colorVar: string; brand: string }
> = {
  web: { label: "Website", short: "WEB", colorVar: "var(--ch-web)", brand: "jamaicankitchenct.com" },
  app: { label: "Mobile App", short: "APP", colorVar: "var(--ch-app)", brand: "Jamaican Kitchen App" },
};

export const STATUS_META: Record<OrderStatus, { label: string; tone: string }> = {
  new: { label: "New", tone: "info" },
  accepted: { label: "Accepted", tone: "info" },
  preparing: { label: "Preparing", tone: "warning" },
  ready: { label: "Ready", tone: "success" },
  out_for_delivery: { label: "Out for delivery", tone: "info" },
  completed: { label: "Completed", tone: "muted" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

export const LOCATIONS: Location[] = [
  {
    id: "loc_1",
    name: "Jamaican Kitchen, Hartford",
    address: "485 Main St",
    city: "Hartford, CT",
    manager: "Marcia Brown",
    phone: "+1 860 555 0142",
    hours: "11:00 - 22:00",
    channels: ["web", "app"],
    lat: 41.7637,
    lng: -72.6851,
  },
  {
    id: "loc_2",
    name: "Jamaican Kitchen, New Haven",
    address: "212 Crown St",
    city: "New Haven, CT",
    manager: "Devon Campbell",
    phone: "+1 203 555 0188",
    hours: "11:00 - 22:30",
    channels: ["web", "app"],
    lat: 41.3083,
    lng: -72.9279,
  },
  {
    id: "loc_3",
    name: "Jamaican Kitchen, Bridgeport",
    address: "1043 Main St",
    city: "Bridgeport, CT",
    manager: "Kemar Whyte",
    phone: "+1 203 555 0177",
    hours: "11:00 - 22:00",
    channels: ["web", "app"],
    lat: 41.1792,
    lng: -73.1894,
  },
  {
    id: "loc_4",
    name: "Jamaican Kitchen, Stamford",
    address: "88 Bedford St",
    city: "Stamford, CT",
    manager: "Andre Powell",
    phone: "+1 203 555 0210",
    hours: "11:00 - 22:00",
    channels: ["web", "app"],
    lat: 41.0534,
    lng: -73.5387,
  },
  {
    id: "loc_5",
    name: "Jamaican Kitchen, Waterbury",
    address: "275 Bank St",
    city: "Waterbury, CT",
    manager: "Latoya Henry",
    phone: "+1 203 555 0233",
    hours: "11:00 - 21:30",
    channels: ["web", "app"],
    lat: 41.5582,
    lng: -73.0515,
  },
  {
    id: "loc_6",
    name: "Jamaican Kitchen, Stratford",
    address: "1500 Barnum Ave",
    city: "Stratford, CT",
    manager: "Trevor Walker",
    phone: "+1 203 555 0244",
    hours: "11:00 - 22:00",
    channels: ["web", "app"],
    lat: 41.1845,
    lng: -73.1331,
  },
  {
    id: "loc_7",
    name: "Jamaican Kitchen, New Britain",
    address: "120 W Main St",
    city: "New Britain, CT",
    manager: "Shanice Clarke",
    phone: "+1 860 555 0259",
    hours: "11:00 - 22:00",
    channels: ["web", "app"],
    lat: 41.6612,
    lng: -72.7795,
  },
  {
    id: "loc_8",
    name: "Jamaican Kitchen, Norwalk",
    address: "64 Wall St",
    city: "Norwalk, CT",
    manager: "Garfield Reid",
    phone: "+1 203 555 0271",
    hours: "11:00 - 22:30",
    channels: ["web", "app"],
    lat: 41.1175,
    lng: -73.4087,
  },
  {
    id: "loc_9",
    name: "Jamaican Kitchen, Danbury",
    address: "15 Main St",
    city: "Danbury, CT",
    manager: "Nadine Bailey",
    phone: "+1 203 555 0288",
    hours: "11:00 - 21:30",
    channels: ["web", "app"],
    lat: 41.3948,
    lng: -73.4540,
  },
];

export const CATEGORIES: MenuCategory[] = [
  { id: "cat_1", name: "Starters & Patties" },
  { id: "cat_2", name: "Jerk & Grill" },
  { id: "cat_3", name: "Curries & Stews" },
  { id: "cat_4", name: "Seafood" },
  { id: "cat_5", name: "Sides" },
  { id: "cat_6", name: "Drinks & Desserts" },
];

export const MENU: MenuItem[] = [
  ["cat_1", "Beef Patty", "Flaky pastry filled with seasoned beef", 4.5, "🥟", 80],
  ["cat_1", "Chicken Patty", "Curried chicken in golden crust", 4.5, "🥟", 75],
  ["cat_1", "Festival (3pc)", "Sweet fried cornmeal dumplings", 5, "🌽", 60],
  ["cat_2", "Jerk Chicken", "Pimento-smoked, served with rice & peas", 15, "🍗", 50],
  ["cat_2", "Jerk Pork", "Slow-grilled with scotch bonnet rub", 17, "🐖", 30],
  ["cat_2", "BBQ Ribs", "Sticky island BBQ glaze", 19, "🍖", 24],
  ["cat_3", "Curry Goat", "Tender goat in island curry", 18, "🍛", 28],
  ["cat_3", "Oxtail", "Braised oxtail with butter beans", 22, "🥘", 20],
  ["cat_3", "Brown Stew Chicken", "Marinated, browned & simmered", 14, "🍗", 40],
  ["cat_3", "Pepper Steak", "Bell peppers, onions, savory gravy", 16, "🥩", 22],
  ["cat_4", "Escovitch Fish", "Fried snapper, pickled peppers", 21, "🐟", 16],
  ["cat_4", "Fish & Chips", "Crispy fish with seasoned fries", 14, "🍟", 30],
  ["cat_5", "Rice & Peas", "Coconut rice with kidney beans", 5, "🍚", 100],
  ["cat_5", "Steamed Cabbage", "Sautéed with carrots & herbs", 4, "🥬", 80],
  ["cat_5", "Plantains", "Sweet fried plantains", 4.5, "🍌", 70],
  ["cat_6", "Sorrel Drink", "Hibiscus, ginger, allspice", 4, "🍹", 60],
  ["cat_6", "Ginger Beer", "House-brewed, spicy & sweet", 3.5, "🫚", 80],
  ["cat_6", "Rum Cake", "Traditional Jamaican black cake", 7, "🍰", 25],
].map(([categoryId, name, description, basePrice, imageEmoji, stock], i) => ({
  id: `item_${i + 1}`,
  categoryId: categoryId as string,
  name: name as string,
  description: description as string,
  basePrice: basePrice as number,
  available: true,
  channelOverrides: {
    web: { available: true, priceMultiplier: 1 },
    app: { available: true, priceMultiplier: 1 },
  },
  stock: stock as number,
  lowStockThreshold: 10,
  imageEmoji: imageEmoji as string,
  featured: false,
}));

export const CUSTOMERS: Customer[] = [
  ["Andre Williams", "andre@example.com", "+1 860 555 0001", ["web", "app"], 24, 612.4, "Oxtail", ["VIP"]],
  ["Tasha Reid", "tasha@example.com", "+1 203 555 0002", ["web"], 8, 185.2, "Jerk Chicken", []],
  ["Marcus Bennett", "marcus@example.com", "+1 860 555 0003", ["app"], 41, 1240.0, "Curry Goat", ["VIP", "Catering"]],
  ["Keisha Johnson", "keisha@example.com", "+1 203 555 0004", ["app"], 12, 295.5, "Brown Stew Chicken", []],
  ["Devon Patel", "devon@example.com", "+1 860 555 0005", ["web"], 5, 98.0, "Beef Patty", ["New"]],
  ["Shanice Clarke", "shanice@example.com", "+1 203 555 0006", ["web", "app"], 17, 410.7, "Escovitch Fish", []],
  ["Tyrone Moore", "tyrone@example.com", "+1 860 555 0007", ["web"], 33, 980.5, "Jerk Pork", ["VIP"]],
  ["Renee Thompson", "renee@example.com", "+1 203 555 0008", ["app"], 9, 220.0, "Rice & Peas", []],
].map(([name, email, phone, channels, orders, lifetimeValue, favorite, tags], i) => ({
  id: `cust_${i + 1}`,
  name: name as string,
  email: email as string,
  phone: phone as string,
  channels: channels as Channel[],
  orders: orders as number,
  lifetimeValue: lifetimeValue as number,
  lastOrder: new Date(Date.now() - i * 1000 * 60 * 60 * 4).toISOString(),
  favorite: favorite as string,
  tags: tags as string[],
}));

const today = new Date();
const isoToday = today.toISOString().slice(0, 10);
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();
const dayAgo = (d: number, h = 9, m = 0) => {
  const x = new Date(); x.setDate(x.getDate() - d); x.setHours(h, m, 0, 0); return x.toISOString();
};

function makeShifts(seed: number, locationId: string) {
  const shifts = [];
  for (let d = 1; d <= 6; d++) {
    const inH = 9 + (seed % 3);
    const outH = inH + 7 + ((seed + d) % 2);
    shifts.push({
      id: `sh_${seed}_${d}`,
      date: new Date(Date.now() - d * 86400_000).toISOString().slice(0, 10),
      clockIn: dayAgo(d, inH, 0),
      clockOut: dayAgo(d, outH, 30),
      locationId,
      breakMinutes: 30,
    });
  }
  return shifts;
}

export const STAFF: StaffMember[] = [
  { id: "u_1", name: "Patrick Henry", email: "patrick@jamaicankitchenct.com", role: "owner", locationIds: "all", active: true, lastActive: "now", avatarColor: "#1f7a3a", phone: "+1 860 555 0100", position: "Owner / CEO", hireDate: "2018-03-15", hourlyWage: 0, address: "Hartford, CT", emergencyContact: { name: "Janet Henry", phone: "+1 860 555 0101" }, clockedInAt: hoursAgo(4), shifts: makeShifts(1, "loc_1"), weeklyScheduleHours: 50 },
  { id: "u_2", name: "Marcia Brown", email: "marcia@jamaicankitchenct.com", role: "manager", locationIds: ["loc_1"], active: true, lastActive: "5m ago", avatarColor: "#d4a017", phone: "+1 860 555 0142", position: "General Manager", hireDate: "2019-06-01", hourlyWage: 28, address: "West Hartford, CT", emergencyContact: { name: "Dwayne Brown", phone: "+1 860 555 0143" }, clockedInAt: hoursAgo(3.2), shifts: makeShifts(2, "loc_1"), weeklyScheduleHours: 45 },
  { id: "u_3", name: "Devon Campbell", email: "devon@jamaicankitchenct.com", role: "manager", locationIds: ["loc_2"], active: true, lastActive: "12m ago", avatarColor: "#0a8f3c", phone: "+1 203 555 0188", position: "Store Manager", hireDate: "2020-01-12", hourlyWage: 26, address: "New Haven, CT", emergencyContact: { name: "Tia Campbell", phone: "+1 203 555 0189" }, clockedInAt: hoursAgo(2.5), shifts: makeShifts(3, "loc_2"), weeklyScheduleHours: 42 },
  { id: "u_4", name: "Kemar Whyte", email: "kemar@jamaicankitchenct.com", role: "manager", locationIds: ["loc_3"], active: true, lastActive: "1h ago", avatarColor: "#b8860b", phone: "+1 203 555 0177", position: "Store Manager", hireDate: "2020-09-22", hourlyWage: 26, address: "Bridgeport, CT", emergencyContact: { name: "Renee Whyte", phone: "+1 203 555 0178" }, clockedInAt: null, shifts: makeShifts(4, "loc_3"), weeklyScheduleHours: 40 },
  { id: "u_5", name: "Rohan Bailey", email: "rohan@jamaicankitchenct.com", role: "staff", locationIds: ["loc_1"], active: true, lastActive: "3m ago", avatarColor: "#1f7a3a", phone: "+1 860 555 0210", position: "Lead Cook", hireDate: "2021-04-03", hourlyWage: 22, address: "Hartford, CT", emergencyContact: { name: "Sasha Bailey", phone: "+1 860 555 0211" }, clockedInAt: hoursAgo(5), shifts: makeShifts(5, "loc_1"), weeklyScheduleHours: 38 },
  { id: "u_6", name: "Shanice Clarke", email: "shanice@jamaicankitchenct.com", role: "staff", locationIds: ["loc_2", "loc_3"], active: false, lastActive: "2d ago", avatarColor: "#d4a017", phone: "+1 203 555 0220", position: "Cashier", hireDate: "2022-08-14", hourlyWage: 17, address: "New Haven, CT", emergencyContact: { name: "Mom", phone: "+1 203 555 0221" }, clockedInAt: null, shifts: makeShifts(6, "loc_2"), weeklyScheduleHours: 24 },
  { id: "u_7", name: "Tasha Reid", email: "tasha@jamaicankitchenct.com", role: "staff", locationIds: ["loc_2"], active: true, lastActive: "20m ago", avatarColor: "#0a8f3c", phone: "+1 203 555 0230", position: "Line Cook", hireDate: "2022-02-09", hourlyWage: 19, address: "New Haven, CT", emergencyContact: { name: "Karl Reid", phone: "+1 203 555 0231" }, clockedInAt: hoursAgo(6), shifts: makeShifts(7, "loc_2"), weeklyScheduleHours: 36 },
  { id: "u_8", name: "Andre Williams", email: "andre@jamaicankitchenct.com", role: "staff", locationIds: ["loc_3"], active: true, lastActive: "45m ago", avatarColor: "#b8860b", phone: "+1 203 555 0240", position: "Driver", hireDate: "2023-05-30", hourlyWage: 18, address: "Bridgeport, CT", emergencyContact: { name: "Linda Williams", phone: "+1 203 555 0241" }, clockedInAt: hoursAgo(1.5), shifts: makeShifts(8, "loc_3"), weeklyScheduleHours: 30 },
  { id: "u_9", name: "Janelle Powell", email: "janelle@jamaicankitchenct.com", role: "manager", locationIds: ["loc_1", "loc_2"], active: true, lastActive: "8m ago", avatarColor: "#1f7a3a", phone: "+1 860 555 0250", position: "Floating Manager", hireDate: "2021-11-18", hourlyWage: 25, address: "Meriden, CT", emergencyContact: { name: "Pop Powell", phone: "+1 860 555 0251" }, clockedInAt: hoursAgo(7), shifts: makeShifts(9, "loc_1"), weeklyScheduleHours: 44 },
  { id: "u_10", name: "Priya Patel", email: "priya@dev.jamaicankitchenct.com", role: "developer", locationIds: "all", active: true, lastActive: "now", avatarColor: "#22c55e", phone: "+1 415 555 0999", position: "Software Engineer", hireDate: "2024-02-05", hourlyWage: 0, address: "Remote", emergencyContact: { name: "Raj Patel", phone: "+1 415 555 0998" }, clockedInAt: null, shifts: [], weeklyScheduleHours: 0 },
];
void isoToday;

export const PERMISSIONS: PermissionDef[] = [
  { key: "orders.view", label: "View orders", description: "See live order feed across channels", group: "Operations" },
  { key: "orders.manage", label: "Manage orders", description: "Accept, reject, refund, and update status", group: "Operations" },
  { key: "catering.manage", label: "Manage catering", description: "Create and progress catering orders", group: "Operations" },
  { key: "delivery.manage", label: "Manage delivery", description: "Dispatch and track couriers", group: "Operations" },
  { key: "menu.edit", label: "Edit menu", description: "Items, categories, prices, 86-ing", group: "Management" },
  { key: "inventory.edit", label: "Edit inventory", description: "Stock adjustments and low-stock rules", group: "Management" },
  { key: "customers.view", label: "View customers", description: "Customer profiles and history", group: "Management" },
  { key: "analytics.view", label: "View analytics", description: "Sales, channel mix, and reports", group: "Management" },
  { key: "locations.manage", label: "Manage locations", description: "Open, close, and configure stores", group: "Administration" },
  { key: "staff.manage", label: "Manage staff & access", description: "Invite users and edit permissions", group: "Administration" },
  { key: "integrations.manage", label: "Manage integrations", description: "Connect Uber Eats, DoorDash, Grubhub", group: "Administration" },
  { key: "settings.manage", label: "Chain settings", description: "Brand, taxes, and notifications", group: "Administration" },
  { key: "developer.api", label: "Developer / API access", description: "API keys, webhooks, audit logs", group: "Developer" },
];

export const ROLE_DEFAULT_PERMISSIONS: Record<StaffMember["role"], PermissionKey[]> = {
  owner: PERMISSIONS.map((p) => p.key),
  manager: [
    "orders.view","orders.manage","catering.manage","delivery.manage",
    "menu.edit","inventory.edit","customers.view","analytics.view",
  ],
  staff: ["orders.view","orders.manage","delivery.manage"],
  developer: ["orders.view","analytics.view","integrations.manage","developer.api"],
};

export const INTEGRATIONS: ChannelIntegration[] = [
  { channel: "web", name: "Website Storefront", status: "live", lastSync: "just now", webhookUrl: "/api/public/webhooks/website", autoAccept: true, prepPaddingMin: 0, priceMarkupPct: 0, description: "First-party online ordering on jamaicankitchenct.com" },
  { channel: "app", name: "Mobile App", status: "live", lastSync: "just now", webhookUrl: "/api/public/webhooks/app", autoAccept: true, prepPaddingMin: 0, priceMarkupPct: 0, description: "iOS & Android customer app" },
];

// Deterministic order generator
function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

const FIRST_NAMES = ["Alex", "Maya", "Liam", "Zoe", "Owen", "Aria", "Ethan", "Mila", "Noah", "Ivy", "Leo", "Ella", "Kai", "Nora", "Finn", "Luna"];
const LAST_NAMES = ["Park", "Singh", "Khan", "Liu", "Garcia", "Brown", "Davis", "Wilson", "Murphy", "Costa"];
const STREETS = ["Valencia St", "Mission St", "Folsom St", "Market St", "Castro St", "Polk St", "Hayes St", "Divisadero St"];

export function generateOrders(count: number): Order[] {
  const channels: Channel[] = ["web", "app"];
  const statuses: OrderStatus[] = ["new", "accepted", "preparing", "ready", "out_for_delivery", "completed"];
  const orders: Order[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const channel = pick(channels, i * 7 + 3);
    const location = pick(LOCATIONS, i * 3);
    if (!location.channels.includes(channel)) continue;
    const status = i < 6 ? "new" : pick(statuses, i + 2);
    const itemCount = (i % 3) + 1;
    const items: import("./types").OrderItem[] = [];
    for (let j = 0; j < itemCount; j++) {
      const m = pick(MENU, i * 5 + j);
      items.push({
        id: `oi_${i}_${j}`,
        name: m.name,
        qty: ((i + j) % 2) + 1,
        price: m.basePrice,
        modifiers: j === 0 ? ["Extra cheese"] : undefined,
      });
    }
    const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
    const tax = +(subtotal * 0.0875).toFixed(2);
    const fees = 0;
    const tip = +(subtotal * 0.15).toFixed(2);
    const total = +(subtotal + tax + fees + tip).toFixed(2);
    const createdAt = new Date(now - i * 1000 * 60 * (3 + (i % 8))).toISOString();
    const type: Order["type"] = i % 2 === 0 ? "pickup" : "delivery";
    const customerName = `${pick(FIRST_NAMES, i)} ${pick(LAST_NAMES, i + 1)}`;
    orders.push({
      id: `ord_${1000 + i}`,
      shortId: `#${4500 - i}`,
      channel,
      locationId: location.id,
      customerId: `cust_${(i % CUSTOMERS.length) + 1}`,
      customerName,
      items,
      subtotal: +subtotal.toFixed(2),
      tax,
      fees,
      tip,
      total,
      status,
      type,
      createdAt,
      etaMinutes: 10 + (i % 25),
      address: type === "delivery" ? `${100 + i * 7} ${pick(STREETS, i)}, San Francisco` : undefined,
      notes: i % 5 === 0 ? "Please ring the bell twice." : undefined,
      courier:
        status === "out_for_delivery"
          ? {
              name: pick(FIRST_NAMES, i + 4) + " " + pick(LAST_NAMES, i + 2),
              phone: "+1 415 555 0" + (200 + i),
              eta: 5 + (i % 15),
              lat: location.lat + (i % 5) * 0.002,
              lng: location.lng + (i % 5) * 0.002,
            }
          : undefined,
    });
  }
  return orders;
}

export const ORDERS: Order[] = generateOrders(60);

// Catering orders (sourced only from website and POS).
const CATERING_SEED: Array<{
  shortId: string;
  channel: "web" | "app";
  customerName: string;
  guests: number;
  daysFromNow: number;
  status: OrderStatus;
  locationId: string;
  contactPhone: string;
  setupRequired: boolean;
  notes?: string;
}> = [
  { shortId: "#C-2041", channel: "web", customerName: "Acme Corp, Q4 Offsite", guests: 45, daysFromNow: 2, status: "new", locationId: "loc_1", contactPhone: "+1 415 555 0301", setupRequired: true, notes: "Vegetarian-only options for 8 guests." },
  { shortId: "#C-2040", channel: "app", customerName: "Patel Wedding Rehearsal", guests: 80, daysFromNow: 6, status: "accepted", locationId: "loc_2", contactPhone: "+1 415 555 0302", setupRequired: true },
  { shortId: "#C-2039", channel: "web", customerName: "Northgate School Gala", guests: 120, daysFromNow: 9, status: "preparing", locationId: "loc_3", contactPhone: "+1 510 555 0303", setupRequired: false, notes: "Drop-off only at loading dock." },
  { shortId: "#C-2038", channel: "app", customerName: "Lin Family Reunion", guests: 35, daysFromNow: 1, status: "accepted", locationId: "loc_1", contactPhone: "+1 415 555 0304", setupRequired: false },
  { shortId: "#C-2037", channel: "web", customerName: "GreenLeaf Investor Lunch", guests: 18, daysFromNow: 3, status: "new", locationId: "loc_1", contactPhone: "+1 415 555 0305", setupRequired: false, notes: "Need delivery by 12:00 sharp." },
  { shortId: "#C-2036", channel: "web", customerName: "Sunrise Yoga Retreat", guests: 25, daysFromNow: 0, status: "ready", locationId: "loc_2", contactPhone: "+1 415 555 0306", setupRequired: true },
  { shortId: "#C-2035", channel: "app", customerName: "Romano Birthday Party", guests: 60, daysFromNow: 4, status: "preparing", locationId: "loc_3", contactPhone: "+1 510 555 0307", setupRequired: true, notes: "2 gluten-free pasta trays." },
  { shortId: "#C-2034", channel: "web", customerName: "Hayes Tech All-Hands", guests: 200, daysFromNow: 12, status: "new", locationId: "loc_1", contactPhone: "+1 415 555 0308", setupRequired: true },
  { shortId: "#C-2033", channel: "app", customerName: "Mission Art Walk", guests: 50, daysFromNow: -1, status: "completed", locationId: "loc_2", contactPhone: "+1 415 555 0309", setupRequired: false },
];

export const CATERING_ORDERS: Order[] = CATERING_SEED.map((c, i) => {
  const items = [
    { id: `c_${i}_1`, name: "Margherita Pizza (tray of 12)", qty: Math.ceil(c.guests / 12), price: 60 },
    { id: `c_${i}_2`, name: "Caesar Salad (large)", qty: Math.ceil(c.guests / 15), price: 38 },
    { id: `c_${i}_3`, name: "Tiramisù (tray of 10)", qty: Math.ceil(c.guests / 10), price: 45 },
  ];
  const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0);
  const tax = +(subtotal * 0.0875).toFixed(2);
  const fees = c.setupRequired ? 75 : 0;
  const tip = 0;
  const total = +(subtotal + tax + fees + tip).toFixed(2);
  const eventDate = new Date(Date.now() + c.daysFromNow * 86400000);
  eventDate.setHours(12 + (i % 6), 0, 0, 0);
  const createdAt = new Date(Date.now() - (i + 1) * 1000 * 60 * 60 * 6).toISOString();
  return {
    id: `cat_${2000 + i}`,
    shortId: c.shortId,
    channel: c.channel,
    locationId: c.locationId,
    customerId: `cust_${(i % CUSTOMERS.length) + 1}`,
    customerName: c.customerName,
    items,
    subtotal: +subtotal.toFixed(2),
    tax,
    fees,
    tip,
    total,
    status: c.status,
    type: c.channel === "app" ? "pickup" : "delivery",
    createdAt,
    etaMinutes: 0,
    address: c.channel === "web" ? "Customer venue" : undefined,
    notes: c.notes,
    catering: {
      eventDate: eventDate.toISOString(),
      guests: c.guests,
      contactPhone: c.contactPhone,
      setupRequired: c.setupRequired,
    },
  };
});

// Analytics helpers
export function revenueByDay(days: number) {
  const out: { day: string; web: number; app: number; total: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const day = d.toLocaleDateString("en", { month: "short", day: "numeric" });
    const seed = d.getDate();
    const web = 800 + ((seed * 37) % 600);
    const app = 1200 + ((seed * 53) % 900);
    out.push({ day, web, app, total: web + app });
  }
  return out;
}

export function hourlyHeatmap() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day, di) => ({
    day,
    hours: Array.from({ length: 14 }, (_, hi) => {
      const hour = 10 + hi;
      const v = Math.round((Math.sin((hi + di) * 0.7) + 1.2) * 30 + (hour >= 18 && hour <= 21 ? 50 : 0) + (di >= 4 ? 25 : 0));
      return { hour, value: v };
    }),
  }));
}