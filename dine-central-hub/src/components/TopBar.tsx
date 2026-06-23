import { Bell, Search, ShoppingBag, User, UtensilsCrossed, Check, X, CheckCheck, MapPin, ExternalLink } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusPill } from "@/components/StatusPill";
import { ChannelBadge } from "@/components/ChannelBadge";
import { formatMoney } from "@/components/PageHeader";
import { useLiveLocations, useLiveOrders, useLiveCustomers, useLiveMenu, updateOrderStatus } from "@/lib/live-data";
import { useCurrentLocation, setCurrentLocation } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { toast } from "sonner";

export function TopBar() {
  const loc = useCurrentLocation();
  const LOCATIONS = useLiveLocations();
  const { orders: ORDERS } = useLiveOrders();
  const { customers: CUSTOMERS } = useLiveCustomers();
  const { items: MENU } = useLiveMenu();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const email = user?.email ?? "";
  const initials = useMemo(() => {
    const local = email.split("@")[0] ?? "";
    const parts = local.split(/[._-]+/).filter(Boolean);
    const letters = parts.length >= 2 ? parts[0][0] + parts[1][0] : local.slice(0, 2);
    return (letters || "JK").toUpperCase();
  }, [email]);

  const [panelId, setPanelId] = useState<string | null>(null);
  const newOrders = useMemo(() => ORDERS.filter((o) => o.status === "new"), [ORDERS]);
  const recentOrders = useMemo(() => ORDERS.slice(0, 12), [ORDERS]);
  const panelOrder = useMemo(() => ORDERS.find((o) => o.id === panelId) ?? null, [ORDERS, panelId]);
  const locName = useMemo(() => new Map(LOCATIONS.map((l) => [l.id, l.name])), [LOCATIONS]);

  const act = async (id: string, status: Parameters<typeof updateOrderStatus>[1], label: string) => {
    try {
      await updateOrderStatus(id, status);
      toast.success(label);
    } catch {
      toast.error("Could not update order");
    }
  };
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return { orders: [], customers: [], items: [] };
    const orders = ORDERS.filter(
      (o) =>
        o.shortId.toLowerCase().includes(term) ||
        o.id.toLowerCase().includes(term) ||
        (o.customerName ?? "").toLowerCase().includes(term),
    ).slice(0, 5);
    const customers = CUSTOMERS.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term),
    ).slice(0, 5);
    const items = MENU.filter((m) => m.name.toLowerCase().includes(term)).slice(0, 5);
    return { orders, customers, items };
  }, [q, ORDERS, CUSTOMERS, MENU]);

  const total = results.orders.length + results.customers.length + results.items.length;

  const go = (path: string) => {
    setOpen(false);
    setQ("");
    navigate({ to: path });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-3 backdrop-blur">
      <SidebarTrigger />
      <div className="hidden md:block">
        <Select value={loc} onValueChange={setCurrentLocation}>
          <SelectTrigger className="h-9 w-[260px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations ({LOCATIONS.length})</SelectItem>
            {LOCATIONS.map((l) => (
              <SelectItem key={l.id} value={l.id}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="relative flex-1 max-w-md" ref={wrapRef}>
        <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => q && setOpen(true)}
          placeholder="Search orders, customers, items…"
          className="h-9 pl-8"
        />
        {open && q && (
          <div className="absolute left-0 right-0 top-11 z-40 max-h-[420px] overflow-auto rounded-lg border bg-popover text-popover-foreground shadow-lg">
            {total === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No matches for "{q}"
              </div>
            ) : (
              <div className="py-1">
                {results.orders.length > 0 && (
                  <ResultGroup label="Orders">
                    {results.orders.map((o) => (
                      <ResultRow
                        key={o.id}
                        icon={<ShoppingBag className="h-4 w-4" />}
                        title={`${o.shortId} · ${o.customerName ?? "Guest"}`}
                        meta={`$${o.total.toFixed(2)} · ${o.status}`}
                        onSelect={() => go(`/orders/${o.id}`)}
                      />
                    ))}
                  </ResultGroup>
                )}
                {results.customers.length > 0 && (
                  <ResultGroup label="Customers">
                    {results.customers.map((c) => (
                      <ResultRow
                        key={c.id}
                        icon={<User className="h-4 w-4" />}
                        title={c.name}
                        meta={`${c.email} · ${c.orders} orders`}
                        onSelect={() => go(`/customers`)}
                      />
                    ))}
                  </ResultGroup>
                )}
                {results.items.length > 0 && (
                  <ResultGroup label="Menu items">
                    {results.items.map((m) => (
                      <ResultRow
                        key={m.id}
                        icon={<UtensilsCrossed className="h-4 w-4" />}
                        title={`${m.imageEmoji ?? ""} ${m.name}`}
                        meta={`$${m.basePrice.toFixed(2)} · ${m.stock} in stock`}
                        onSelect={() => go(`/menu`)}
                      />
                    ))}
                  </ResultGroup>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {newOrders.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground tabular-nums">
                  {newOrders.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="flex items-center justify-between border-b px-3 py-2">
              <span className="text-sm font-semibold">Live orders</span>
              <span className="text-xs text-muted-foreground">{newOrders.length} new</span>
            </div>
            <div className="max-h-[360px] overflow-auto">
              {recentOrders.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">No orders yet</div>
              ) : (
                recentOrders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setPanelId(o.id)}
                    className={`flex w-full items-center gap-2 border-b px-3 py-2 text-left text-sm hover:bg-muted ${o.status === "new" ? "bg-primary/5" : ""}`}
                  >
                    <span className="font-mono text-xs text-primary">{o.shortId}</span>
                    <span className="flex-1 truncate">{o.customerName}</span>
                    <StatusPill status={o.status} />
                    <span className="tabular-nums text-xs text-muted-foreground">{formatMoney(o.total)}</span>
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs font-semibold">{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold">Signed in</span>
              <span className="truncate text-xs font-normal text-muted-foreground">{email || "Staff"}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={async () => {
                await signOut();
                navigate({ to: "/login" });
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Desktop right-side order detail panel */}
      <Sheet open={!!panelOrder} onOpenChange={(o) => !o && setPanelId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {panelOrder && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="font-mono">{panelOrder.shortId}</span>
                  <ChannelBadge channel={panelOrder.channel} />
                  <StatusPill status={panelOrder.status} />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4 text-sm">
                <div className="space-y-1">
                  <div className="font-medium">{panelOrder.customerName}</div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {locName.get(panelOrder.locationId) ?? "-"} · {panelOrder.type.replace("_", " ")}
                  </div>
                  <div className="text-xs text-muted-foreground">{format(new Date(panelOrder.createdAt), "MMM d, h:mm a")}</div>
                </div>

                <div className="rounded-lg border divide-y">
                  {panelOrder.items.map((it) => (
                    <div key={it.id} className="flex items-center justify-between px-3 py-2">
                      <span><span className="text-muted-foreground">{it.qty}×</span> {it.name}</span>
                      <span className="tabular-nums">{formatMoney(it.price * it.qty)}</span>
                    </div>
                  ))}
                  {panelOrder.items.length === 0 && (
                    <div className="px-3 py-2 text-muted-foreground">No line items</div>
                  )}
                </div>

                <div className="space-y-1">
                  <Row label="Subtotal" value={formatMoney(panelOrder.subtotal)} />
                  <Row label="Tax" value={formatMoney(panelOrder.tax)} />
                  {panelOrder.tip > 0 && <Row label="Tip" value={formatMoney(panelOrder.tip)} />}
                  <div className="flex justify-between border-t pt-1 font-semibold">
                    <span>Total</span><span className="tabular-nums">{formatMoney(panelOrder.total)}</span>
                  </div>
                </div>

                {panelOrder.notes && (
                  <div className="rounded-md bg-muted/50 p-2 text-xs"><span className="font-medium">Notes: </span>{panelOrder.notes}</div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  {panelOrder.status === "new" && (
                    <>
                      <Button size="sm" className="gap-1" onClick={() => act(panelOrder.id, "accepted", `Accepted ${panelOrder.shortId}`)}>
                        <Check className="h-3.5 w-3.5" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => act(panelOrder.id, "cancelled", `Rejected ${panelOrder.shortId}`)}>
                        <X className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </>
                  )}
                  {(panelOrder.status === "accepted" || panelOrder.status === "preparing") && (
                    <Button size="sm" className="gap-1" onClick={() => act(panelOrder.id, "ready", `${panelOrder.shortId} ready`)}>
                      <CheckCheck className="h-3.5 w-3.5" /> Mark ready
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="gap-1" asChild>
                    <Link to="/orders/$id" params={{ id: panelOrder.id }} onClick={() => setPanelId(null)}>
                      <ExternalLink className="h-3.5 w-3.5" /> Full page
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </header>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

function ResultGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <div className="px-3 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      {children}
    </div>
  );
}

function ResultRow({
  icon,
  title,
  meta,
  onSelect,
}: {
  icon: React.ReactNode;
  title: string;
  meta: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-accent"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </span>
      <span className="flex flex-1 flex-col">
        <span className="font-medium leading-tight">{title}</span>
        <span className="text-xs text-muted-foreground">{meta}</span>
      </span>
    </button>
  );
}