import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChannelBadge } from "@/components/ChannelBadge";
import { StatusPill } from "@/components/StatusPill";
import { PageHeader, formatMoney } from "@/components/PageHeader";
import { CHANNEL_META } from "@/lib/mock-data";
import { useLiveOrders, useLiveLocations, updateOrderStatus } from "@/lib/live-data";
import { ArrowLeft, MapPin, Phone, Truck, Clock, MessageSquare, Star, Send, Timer, Loader2, Printer } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button as UIButton } from "@/components/ui/button";
import { durationMinutes, isFinal, staffNoteFor, reviewFor, nextStatusAction, OrderStepper, printOrderTicket } from "./orders";
import type { Order, Location, OrderStatus } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/orders/$id")({
  component: OrderDetail,
});

function OrderDetail() {
  // Load from live data (Supabase) so real orders resolve, not just mock seeds.
  const { id } = Route.useParams();
  const { orders, loading } = useLiveOrders();
  const locations = useLiveLocations();
  const order = orders.find((o) => o.id === id);
  const location = locations.find((l) => l.id === order?.locationId);

  if (loading && !order) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!order) {
    return (
      <div className="p-8">
        <Link to="/orders" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>
        <p className="text-muted-foreground">Order not found.</p>
      </div>
    );
  }
  return <OrderDetailView order={order} location={location} />;
}

function OrderDetailView({ order, location }: { order: Order; location?: Location }) {
  const ch = CHANNEL_META[order.channel];
  const initialReview = isFinal(order.status) ? reviewFor(order.id) : null;
  const [comments, setComments] = useState<{ author: string; text: string; t: string }[]>([
    { author: "Kitchen", text: staffNoteFor(order.id), t: new Date(new Date(order.createdAt).getTime() + 4 * 60_000).toISOString() },
  ]);
  const [draft, setDraft] = useState("");
  const dur = durationMinutes(order);

  const handleStatus = async (status: OrderStatus, label: string) => {
    try {
      await updateOrderStatus(order.id, status);
      toast.success(`${order.shortId} ${label}`);
    } catch {
      toast.error(`Could not update ${order.shortId}`);
    }
  };
  const next = nextStatusAction(order.status, order.type);

  return (
    <>
      <Link to="/orders" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>
      <PageHeader
        title={`Order ${order.shortId}`}
        description={`From ${ch.brand} · ${format(new Date(order.createdAt), "MMM d, h:mm a")} · ${dur}m ${isFinal(order.status) ? "total" : "elapsed"}`}
        actions={
          <>
            {!isFinal(order.status) && order.status !== "new" && (
              <Button variant="outline" onClick={() => printOrderTicket(order, location?.name ?? "")}>
                <Printer className="h-4 w-4 mr-1.5" /> Print ticket
              </Button>
            )}
            {next && (
              <Button onClick={() => handleStatus(next.status, next.label.toLowerCase())}>
                <next.Icon className="h-4 w-4 mr-1.5" /> {next.label}
              </Button>
            )}
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-base">Items</CardTitle>
              <div className="flex items-center gap-2"><ChannelBadge channel={order.channel} size="md" /><StatusPill status={order.status} /></div>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {order.items.map((it) => (
                  <div key={it.id} className="flex items-start justify-between py-3">
                    <div>
                      <div className="font-medium">{it.qty} × {it.name}</div>
                      {it.modifiers && <div className="text-xs text-muted-foreground">+ {it.modifiers.join(", ")}</div>}
                    </div>
                    <div className="tabular-nums">{formatMoney(it.qty * it.price)}</div>
                  </div>
                ))}
              </div>
              <Separator className="my-3" />
              <Row label="Subtotal" value={formatMoney(order.subtotal)} />
              <Row label="Tax" value={formatMoney(order.tax)} />
              {order.fees > 0 && <Row label={`${ch.brand} fee`} value={formatMoney(order.fees)} />}
              <Row label="Tip" value={formatMoney(order.tip)} />
              <Separator className="my-2" />
              <Row label="Total" value={formatMoney(order.total)} bold />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Staff comments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ul className="space-y-2">
                {comments.map((c, i) => (
                  <li key={i} className="rounded-md border bg-muted/30 p-2.5 text-sm">
                    <div className="mb-0.5 flex items-center justify-between">
                      <span className="text-xs font-medium">{c.author}</span>
                      <span className="text-xs text-muted-foreground">{format(new Date(c.t), "MMM d, h:mm a")}</span>
                    </div>
                    <div>{c.text}</div>
                  </li>
                ))}
              </ul>
              <div className="flex items-end gap-2">
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Leave a note for the team…"
                  className="min-h-[60px]"
                />
                <UIButton
                  size="sm"
                  disabled={!draft.trim()}
                  onClick={() => {
                    setComments((p) => [...p, { author: "You", text: draft.trim(), t: new Date().toISOString() }]);
                    setDraft("");
                  }}
                >
                  <Send className="h-3.5 w-3.5" />
                </UIButton>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4" /> Customer review
              </CardTitle>
            </CardHeader>
            <CardContent>
              {initialReview ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < initialReview.rating ? "fill-warning text-warning" : "text-muted-foreground/40"}`}
                      />
                    ))}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {initialReview.rating}.0 from {order.customerName}
                    </span>
                  </div>
                  <p className="text-sm">{initialReview.text}</p>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No review yet, review request will be sent after order completion.
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Status progress</CardTitle></CardHeader>
            <CardContent>
              <OrderStepper status={order.status} type={order.type} />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Timer className="h-4 w-4" /> Fulfillment time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="text-2xl font-semibold tabular-nums">{dur}m</div>
              <div className="text-xs text-muted-foreground">
                {isFinal(order.status) ? "Start to finish" : "Elapsed since order received"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Customer</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="font-medium">{order.customerName}</div>
              {order.address && <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4" />{order.address}</div>}
              {order.notes && <div className="rounded-md bg-warning/10 p-2 text-xs text-warning-foreground">Note: {order.notes}</div>}
            </CardContent>
          </Card>
          {order.courier && (
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4" />Courier</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="font-medium">{order.courier.name}</div>
                <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" />{order.courier.phone}</div>
                <div className="text-muted-foreground">ETA: {order.courier.eta} min</div>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle className="text-base">Location</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <div className="font-medium">{location?.name}</div>
              <div className="text-muted-foreground">{location?.address}, {location?.city}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 ${bold ? "text-base font-semibold" : "text-sm"}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}