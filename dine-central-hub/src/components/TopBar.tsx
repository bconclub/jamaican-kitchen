import { Bell, Search, ShoppingBag, User, UtensilsCrossed } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLiveLocations, useLiveOrders, useLiveCustomers, useLiveMenu } from "@/lib/live-data";
import { useCurrentLocation, setCurrentLocation } from "@/lib/store";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";

export function TopBar() {
  const loc = useCurrentLocation();
  const LOCATIONS = useLiveLocations();
  const { orders: ORDERS } = useLiveOrders();
  const { customers: CUSTOMERS } = useLiveCustomers();
  const { items: MENU } = useLiveMenu();
  const navigate = useNavigate();
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
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
        </Button>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary text-primary-foreground text-xs">GC</AvatarFallback>
        </Avatar>
      </div>
    </header>
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