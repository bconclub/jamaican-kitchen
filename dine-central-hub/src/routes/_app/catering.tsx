import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader, formatMoney } from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ChannelBadge } from "@/components/ChannelBadge";
import { CATERING_ORDERS, LOCATIONS, STATUS_META } from "@/lib/mock-data";
import { useCurrentLocation } from "@/lib/store";
import type { Order, OrderStatus } from "@/lib/types";
import { CalendarDays, Users, Phone, MapPin, Plus, Search, ChevronRight, Truck, Navigation, CheckCircle2, ChefHat, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow, isPast, differenceInHours } from "date-fns";

export const Route = createFileRoute("/_app/catering")({
  component: CateringPage,
});

const COLUMNS: { status: OrderStatus; title: string; tone: string }[] = [
  { status: "new", title: "New requests", tone: "border-l-info" },
  { status: "accepted", title: "Confirmed", tone: "border-l-primary" },
  { status: "preparing", title: "Preparing", tone: "border-l-warning" },
  { status: "ready", title: "Ready", tone: "border-l-success" },
  { status: "out_for_delivery", title: "Out for delivery", tone: "border-l-info" },
  { status: "completed", title: "Completed", tone: "border-l-muted-foreground" },
];

// Deterministic mock courier & live ETA for a catering delivery.
const DRIVERS = [
  { name: "Rohan Bailey", phone: "+1 860 555 0210" },
  { name: "Andre Williams", phone: "+1 203 555 0240" },
  { name: "Tasha Reid", phone: "+1 203 555 0230" },
  { name: "Janelle Powell", phone: "+1 860 555 0250" },
];
const TRACK_STAGES = ["preparing", "out_for_delivery", "arriving", "delivered"] as const;
type TrackStage = (typeof TRACK_STAGES)[number];
const STAGE_META: Record<TrackStage, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  preparing: { label: "Preparing", icon: ChefHat },
  out_for_delivery: { label: "En route", icon: Truck },
  arriving: { label: "Arriving", icon: Navigation },
  delivered: { label: "Delivered", icon: CheckCircle2 },
};

function driverFor(id: string) {
  const seed = [...id].reduce((a, c) => a + c.charCodeAt(0), 0);
  return DRIVERS[seed % DRIVERS.length];
}
function stageFor(o: Order): TrackStage {
  if (o.status === "completed") return "delivered";
  if (o.status === "out_for_delivery") {
    const mins = differenceInHours(new Date(o.catering!.eventDate), new Date()) * 60;
    return mins <= 30 && mins >= -120 ? "arriving" : "out_for_delivery";
  }
  return "preparing";
}
function etaMinutes(o: Order) {
  const seed = [...o.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const stage = stageFor(o);
  if (stage === "delivered") return 0;
  if (stage === "arriving") return 4 + (seed % 8);
  if (stage === "out_for_delivery") return 18 + (seed % 25);
  return 35 + (seed % 30);
}

function CateringPage() {
  const loc = useCurrentLocation();
  const [orders, setOrders] = useState<Order[]>(CATERING_ORDERS);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const visible = useMemo(
    () =>
      orders.filter((o) => {
        if (loc !== "all" && o.locationId !== loc) return false;
        if (q && !(o.customerName.toLowerCase().includes(q.toLowerCase()) || o.shortId.includes(q))) return false;
        return true;
      }),
    [orders, loc, q],
  );

  const stats = {
    upcoming: visible.filter((o) => o.status !== "completed" && o.status !== "cancelled").length,
    guests: visible
      .filter((o) => o.status !== "completed" && o.status !== "cancelled")
      .reduce((s, o) => s + (o.catering?.guests ?? 0), 0),
    revenue: visible.reduce((s, o) => s + o.total, 0),
    nextEvent: [...visible]
      .filter((o) => o.catering && !isPast(new Date(o.catering.eventDate)))
      .sort((a, b) => new Date(a.catering!.eventDate).getTime() - new Date(b.catering!.eventDate).getTime())[0],
  };

  const advance = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const flow: OrderStatus[] =
          o.type === "delivery"
            ? ["new", "accepted", "preparing", "ready", "out_for_delivery", "completed"]
            : ["new", "accepted", "preparing", "ready", "completed"];
        const idx = flow.indexOf(o.status);
        const next = flow[Math.min(flow.length - 1, idx + 1)];
        toast.success(`${o.shortId} → ${STATUS_META[next].label}`);
        return { ...o, status: next };
      }),
    );
  };

  const trackable = visible.filter(
    (o) =>
      o.type === "delivery" &&
      (o.status === "preparing" || o.status === "ready" || o.status === "out_for_delivery"),
  );

  return (
    <div>
      <PageHeader
        title="Catering"
        description="Large-format catering orders received from the website and POS."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" /> New catering order</Button>
            </DialogTrigger>
            <NewCateringDialog
              onCreate={(o) => {
                setOrders((p) => [o, ...p]);
                setOpen(false);
                toast.success(`Created ${o.shortId}`);
              }}
            />
          </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat label="Upcoming events" value={stats.upcoming.toString()} icon={CalendarDays} />
        <Stat label="Guests served" value={stats.guests.toLocaleString()} icon={Users} />
        <Stat label="Pipeline revenue" value={formatMoney(stats.revenue)} icon={Truck} />
        <Stat
          label="Next event"
          value={stats.nextEvent ? formatDistanceToNow(new Date(stats.nextEvent.catering!.eventDate), { addSuffix: true }) : "—"}
          icon={CalendarDays}
          sub={stats.nextEvent?.customerName}
        />
      </div>

      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by client or #" value={q} onChange={(e) => setQ(e.target.value)} className="pl-8 h-9" />
        </div>
        <Badge variant="secondary">Sources: Website + Mobile App</Badge>
      </div>

      {trackable.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold">Live delivery tracking</div>
                  <div className="text-xs text-muted-foreground">{trackable.length} catering deliveries in flight</div>
                </div>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {trackable
                .sort((a, b) => etaMinutes(a) - etaMinutes(b))
                .map((o) => (
                  <TrackingCard
                    key={o.id}
                    order={o}
                    onDispatch={() => advance(o.id)}
                    onDelivered={() =>
                      setOrders((p) => p.map((x) => (x.id === o.id ? { ...x, status: "completed" } : x)))
                    }
                  />
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-6 md:grid-cols-2">
        {COLUMNS.map((col) => {
          const items = visible
            .filter((o) => o.status === col.status)
            .sort((a, b) => new Date(a.catering?.eventDate ?? 0).getTime() - new Date(b.catering?.eventDate ?? 0).getTime());
          return (
            <div key={col.status} className="flex flex-col gap-3 min-w-0">
              <div className={`flex items-center justify-between rounded-lg border-l-4 bg-card px-3 py-2 ${col.tone}`}>
                <div className="text-sm font-semibold">{col.title}</div>
                <Badge variant="secondary" className="tabular-nums">{items.length}</Badge>
              </div>
              <div className="flex flex-col gap-3">
                {items.map((o) => (
                  <CateringCard key={o.id} order={o} onAdvance={() => advance(o.id)} />
                ))}
                {items.length === 0 && (
                  <div className="rounded-lg border border-dashed py-8 text-center text-xs text-muted-foreground">
                    No orders
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrackingCard({
  order,
  onDispatch,
  onDelivered,
}: {
  order: Order;
  onDispatch: () => void;
  onDelivered: () => void;
}) {
  const driver = driverFor(order.id);
  const stage = stageFor(order);
  const stageIdx = TRACK_STAGES.indexOf(stage);
  const progress = ((stageIdx + 1) / TRACK_STAGES.length) * 100;
  const eta = etaMinutes(order);
  const loc = LOCATIONS.find((l) => l.id === order.locationId);
  const isEnRoute = order.status === "out_for_delivery";

  return (
    <div className="rounded-lg border bg-card p-3 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">{order.shortId}</span>
            <Badge variant="secondary" className="text-[10px]">
              {STATUS_META[order.status].label}
            </Badge>
          </div>
          <div className="mt-0.5 text-sm font-medium leading-tight truncate">{order.customerName}</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">ETA</div>
          <div className="text-base font-semibold tabular-nums">
            {stage === "delivered" ? "—" : `${eta}m`}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          {TRACK_STAGES.map((s, i) => {
            const Icon = STAGE_META[s].icon;
            const active = i <= stageIdx;
            return (
              <div
                key={s}
                className={`flex flex-col items-center gap-0.5 ${active ? "text-primary" : ""}`}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{STAGE_META[s].label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-md border p-2">
          <div className="text-[10px] uppercase text-muted-foreground">Driver</div>
          <div className="font-medium truncate">{driver.name}</div>
          <a href={`tel:${driver.phone}`} className="text-[11px] text-primary hover:underline inline-flex items-center gap-1">
            <Phone className="h-2.5 w-2.5" /> {driver.phone}
          </a>
        </div>
        <div className="rounded-md border p-2">
          <div className="text-[10px] uppercase text-muted-foreground">From → To</div>
          <div className="flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="truncate">{loc?.name.replace("Jamaican Kitchen — ", "")}</span>
          </div>
          <div className="flex items-center gap-1 truncate">
            <Navigation className="h-3 w-3 shrink-0 text-muted-foreground" />
            <span className="truncate">{order.catering?.guests} guests · venue</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-2">
        <span className="text-xs text-muted-foreground">
          Event {format(new Date(order.catering!.eventDate), "MMM d, p")}
        </span>
        {isEnRoute ? (
          <Button size="sm" className="h-7 px-2 text-xs" onClick={onDelivered}>
            <PackageCheck className="h-3 w-3 mr-1" /> Mark delivered
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={onDispatch}>
            <Truck className="h-3 w-3 mr-1" /> {order.status === "ready" ? "Dispatch driver" : "Advance"}
          </Button>
        )}
      </div>
    </div>
  );
}

function CateringCard({ order, onAdvance }: { order: Order; onAdvance: () => void }) {
  const cat = order.catering!;
  const eventDate = new Date(cat.eventDate);
  const hoursAway = differenceInHours(eventDate, new Date());
  const urgent = hoursAway >= 0 && hoursAway < 48 && order.status !== "completed";
  const loc = LOCATIONS.find((l) => l.id === order.locationId);

  return (
    <Card className={urgent ? "ring-1 ring-warning/40" : ""}>
      <CardContent className="p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-muted-foreground">{order.shortId}</span>
          <ChannelBadge channel={order.channel} />
        </div>
        <div className="font-medium text-sm leading-tight line-clamp-2">{order.customerName}</div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3 w-3" />
            {format(eventDate, "MMM d, p")}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" /> {cat.guests}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{loc?.name.replace("Jamaican Kitchen — ", "")}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Phone className="h-3 w-3 shrink-0" />
          <span>{cat.contactPhone}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {cat.setupRequired && <Badge variant="secondary" className="text-[10px]">On-site setup</Badge>}
          {urgent && <Badge variant="secondary" className="bg-warning/15 text-warning text-[10px]">Within 48h</Badge>}
        </div>

        <div className="flex items-center justify-between pt-1.5 border-t">
          <span className="text-sm font-semibold tabular-nums">{formatMoney(order.total)}</span>
          {order.status !== "completed" && (
            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onAdvance}>
              Advance <ChevronRight className="h-3 w-3 ml-0.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  sub?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-xl font-semibold tabular-nums truncate">{value}</div>
          {sub && <div className="text-xs text-muted-foreground truncate">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function NewCateringDialog({ onCreate }: { onCreate: (o: Order) => void }) {
  const [client, setClient] = useState("");
  const [channel, setChannel] = useState<"web" | "app">("web");
  const [locationId, setLocationId] = useState(LOCATIONS[0].id);
  const [guests, setGuests] = useState(20);
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(12, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [phone, setPhone] = useState("");
  const [setup, setSetup] = useState(false);
  const [notes, setNotes] = useState("");

  const submit = () => {
    if (!client.trim()) return toast.error("Client name required");
    const subtotal = guests * 28;
    const tax = +(subtotal * 0.0875).toFixed(2);
    const fees = setup ? 75 : 0;
    const total = +(subtotal + tax + fees).toFixed(2);
    const order: Order = {
      id: `cat_${Date.now()}`,
      shortId: `#C-${Math.floor(2100 + Math.random() * 900)}`,
      channel,
      locationId,
      customerId: "cust_new",
      customerName: client,
      items: [{ id: "i1", name: "Catering package", qty: guests, price: 28 }],
      subtotal,
      tax,
      fees,
      tip: 0,
      total,
      status: "new",
      type: channel === "app" ? "pickup" : "delivery",
      createdAt: new Date().toISOString(),
      etaMinutes: 0,
      notes: notes || undefined,
      catering: {
        eventDate: new Date(date).toISOString(),
        guests,
        contactPhone: phone || "—",
        setupRequired: setup,
      },
    };
    onCreate(order);
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>New catering order</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <Field label="Client / Event">
          <Input value={client} onChange={(e) => setClient(e.target.value)} placeholder="e.g. Acme Corp Holiday Party" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Source">
            <Select value={channel} onValueChange={(v) => setChannel(v as "web" | "app")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="web">Website</SelectItem>
                <SelectItem value="app">Mobile App</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Location">
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.name.replace("Jamaican Kitchen — ", "")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Guests">
            <Input type="number" min={1} value={guests} onChange={(e) => setGuests(Math.max(1, parseInt(e.target.value) || 1))} />
          </Field>
          <Field label="Event date & time">
            <Input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
        </div>
        <Field label="Contact phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 …" />
        </Field>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <div className="text-sm font-medium">On-site setup</div>
            <div className="text-xs text-muted-foreground">Adds $75 setup fee</div>
          </div>
          <Switch checked={setup} onCheckedChange={setSetup} />
        </div>
        <Field label="Notes">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Dietary restrictions, delivery instructions…" rows={3} />
        </Field>
      </div>
      <DialogFooter>
        <Button onClick={submit}>Create order</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}