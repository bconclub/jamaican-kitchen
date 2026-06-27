import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLiveOrders, useLiveCustomers, useLiveMenu, useLiveLocations } from "@/lib/live-data";
import { askAdminAI, type AdminChatMessage } from "@/lib/ai";
import type { Order, Customer, MenuItem } from "@/lib/types";

function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

// Compact, in-system snapshot the model is allowed to reason over — nothing external.
function buildContext(orders: Order[], customers: Customer[], items: MenuItem[], locationCount: number): string {
  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const today = orders.filter((o) => isToday(o.createdAt));
  const todayRevenue = today.reduce((s, o) => s + o.total, 0);
  const byStatus = new Map<string, number>();
  for (const o of orders) byStatus.set(o.status, (byStatus.get(o.status) ?? 0) + 1);
  const byChannel = new Map<string, number>();
  for (const o of orders) byChannel.set(o.channel, (byChannel.get(o.channel) ?? 0) + 1);
  const low = items.filter((i) => i.stock <= i.lowStockThreshold && i.stock > 0);
  const out = items.filter((i) => i.stock === 0);
  const topCust = [...customers].sort((a, b) => b.lifetimeValue - a.lifetimeValue).slice(0, 5);
  const aov = orders.length ? revenue / orders.length : 0;
  const money = (n: number) => `$${n.toFixed(2)}`;

  return [
    `Locations: ${locationCount}`,
    `Orders (all-time loaded): ${orders.length}, total revenue ${money(revenue)}, avg order ${money(aov)}`,
    `Orders today: ${today.length}, revenue today ${money(todayRevenue)}`,
    `Orders by status: ${[...byStatus].map(([s, n]) => `${s} ${n}`).join(", ") || "none"}`,
    `Orders by channel: ${[...byChannel].map(([c, n]) => `${c} ${n}`).join(", ") || "none"}`,
    `Customers: ${customers.length}`,
    `Top customers by lifetime value: ${topCust.map((c) => `${c.name} (${money(c.lifetimeValue)}, ${c.orders} orders)`).join("; ") || "none"}`,
    `Out of stock (${out.length}): ${out.map((i) => i.name).join(", ") || "none"}`,
    `Low stock (${low.length}): ${low.map((i) => `${i.name} (${i.stock})`).join(", ") || "none"}`,
  ].join("\n");
}

function renderFormatted(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
      seg.startsWith("**") && seg.endsWith("**") ? <strong key={j}>{seg.slice(2, -2)}</strong> : <span key={j}>{seg}</span>,
    );
    return (
      <span key={i} className="block">
        {parts}
      </span>
    );
  });
}

const SUGGESTIONS = [
  "What happened today?",
  "Which items are low on stock?",
  "Who are my top customers?",
  "How's revenue looking?",
  "Any orders need attention?",
];

export function AdminChatbot() {
  const { orders } = useLiveOrders();
  const { customers } = useLiveCustomers();
  const { items } = useLiveMenu();
  const locations = useLiveLocations();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AdminChatMessage[]>([
    { role: "assistant", content: "Hi! Ask me about today's orders, revenue, stock, or customers." },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || isLoading) return;
    const history = [...messages, { role: "user" as const, content: q }];
    setMessages(history);
    setInput("");
    setIsLoading(true);
    try {
      const context = buildContext(orders, customers, items, locations.length);
      const res = await askAdminAI({ data: { messages: history.slice(1), context } });
      if (!res.reply) throw new Error(res.error || "No reply");
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply as string }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I couldn't get an answer right now. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[min(70vh,520px)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl sm:w-[380px]">
          <div className="flex items-center justify-between bg-primary p-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <div>
                <h3 className="font-semibold leading-none">Dine Central AI</h3>
                <p className="text-xs opacity-90">Ops insights from your data</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-primary-foreground hover:bg-primary-foreground/20">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed [&_strong]:font-semibold ${
                      m.role === "user" ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-muted text-foreground"
                    }`}
                  >
                    {m.role === "assistant" ? renderFormatted(m.content) : m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Context chips — always visible so the conversation can keep going. */}
          {!isLoading && (
            <div className="flex flex-wrap gap-1.5 border-t px-3 pt-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:bg-muted"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="p-3">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder="Ask about your operations..."
                disabled={isLoading}
              />
              <Button onClick={() => send(input)} disabled={!input.trim() || isLoading} size="icon">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
