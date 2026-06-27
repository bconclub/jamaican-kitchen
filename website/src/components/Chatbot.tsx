import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sparkles, X, Send, Loader2, ArrowRight, Plus, MapPin, Phone, Clock, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useMenu } from "@/hooks/useMenu";
import { useCart } from "@/contexts/CartContext";
import type { MenuItem } from "@/data/menuData";
import { toast } from "sonner";

interface LocationInfo {
  name: string;
  address: string;
  phone: string;
  hours: string;
}
type Message = {
  role: "user" | "assistant";
  content: string;
  cards?: MenuItem[];
  link?: { label: string; href: string };
  locations?: LocationInfo[];
};

// Our 6 Connecticut locations (matches the Locations page).
const LOCATIONS: LocationInfo[] = [
  { name: "Vernon", address: "123 Hartford Turnpike, Vernon, CT 06066", phone: "(860) 555-0101", hours: "Mon-Sat 11am-9pm, Sun 12pm-8pm" },
  { name: "South Windsor", address: "456 Sullivan Ave, South Windsor, CT 06074", phone: "(860) 555-0102", hours: "Mon-Sat 11am-9pm, Sun 12pm-8pm" },
  { name: "Windsor Locks", address: "789 Main St, Windsor Locks, CT 06096", phone: "(860) 555-0103", hours: "Mon-Sat 11am-9pm, Sun 12pm-8pm" },
  { name: "Bristol", address: "321 Farmington Ave, Bristol, CT 06010", phone: "(860) 555-0104", hours: "Mon-Sat 11am-9pm, Sun 12pm-8pm" },
  { name: "Rocky Hill", address: "654 Silas Deane Hwy, Rocky Hill, CT 06067", phone: "(860) 555-0105", hours: "Mon-Sat 11am-9pm, Sun 12pm-8pm" },
  { name: "Enfield", address: "987 Enfield St, Enfield, CT 06082", phone: "(860) 555-0106", hours: "Mon-Sat 11am-9pm, Sun 12pm-8pm" },
];

// Calls our own server endpoint — the OpenRouter key stays on the backend.
const CHAT_URL = "/api/chat";

// Best sellers (mirrors the homepage). Resolved to real menu items at render so
// cards carry valid prices/ids and can be added straight to the cart.
const BEST_SELLER_NAMES = ["Oxtail", "Curry Goat", "Jerk Chicken", "Pepper Steak", "Escovitch Fish"];

// Follow-up chips — always visible so the conversation can keep going.
// `kind` controls behaviour: cards (best sellers), link (menu), or ask (send to AI).
const CHIPS: { label: string; kind: "cards" | "link" | "ask" | "locations" }[] = [
  { label: "What's your best seller?", kind: "cards" },
  { label: "Show me the menu", kind: "link" },
  { label: "Any vegetarian options?", kind: "ask" },
  { label: "How do I order online?", kind: "ask" },
  { label: "Where are you located?", kind: "locations" },
];

// Minimal formatting: bold **text** + preserve line breaks/bullets.
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

export const Chatbot = () => {
  const { data: menu } = useMenu();
  const { addItem } = useCart();
  // Resolve best-seller names to real menu items (valid id/price/spice for the cart).
  const allItems: MenuItem[] = (menu ?? []).flatMap((c) => c.items);
  const bestSellerItems: MenuItem[] = BEST_SELLER_NAMES.map((n) =>
    allItems.find((it) => it.name.toLowerCase().includes(n.toLowerCase())),
  ).filter((it): it is MenuItem => Boolean(it));

  const handleAdd = (item: MenuItem) => {
    addItem({ id: item.id, name: item.name, price: item.price, spiceLevel: item.spiceLevel, image: item.image });
    toast.success(`${item.name} added to your order!`);
  };

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Welcome to Jamaican Kitchen! 🇯🇲 How can I help you today? Pick a question below or type your own." },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;
    const userMessage: Message = { role: "user", content };
    const history = [...messages, userMessage];
    setMessages(history);
    setInput("");
    setIsLoading(true);
    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history.slice(1).map(({ role, content }) => ({ role, content })) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.reply) throw new Error(data.error || "Failed to get response");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply as string }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again or call us directly!" }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Chips that resolve instantly client-side (cards / link) vs ones we ask the AI.
  const handleChip = (chip: (typeof CHIPS)[number]) => {
    if (isLoading) return;
    if (chip.kind === "cards") {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: chip.label },
        { role: "assistant", content: "Here are our most popular dishes 🔥 Tap Add to drop one in your order.", cards: bestSellerItems },
      ]);
      return;
    }
    if (chip.kind === "link") {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: chip.label },
        { role: "assistant", content: "Here's our full menu — tap below to browse and order.", link: { label: "Open the full menu", href: "/order" } },
      ]);
      return;
    }
    if (chip.kind === "locations") {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: chip.label },
        { role: "assistant", content: "We have 6 locations across Connecticut 📍", locations: LOCATIONS },
      ]);
      return;
    }
    sendMessage(chip.label);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg",
          "bg-primary hover:bg-primary/90 text-primary-foreground transition-transform hover:scale-105",
          isOpen && "hidden",
        )}
        aria-label="Open assistant"
      >
        <Sparkles className="h-6 w-6" />
      </Button>

      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-50 flex h-[min(70vh,520px)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:w-[380px] animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between bg-primary p-4 text-primary-foreground">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <div>
                <h3 className="font-semibold leading-none">Jamaican Kitchen</h3>
                <p className="text-xs opacity-90">Ask us anything!</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-primary-foreground hover:bg-primary-foreground/20">
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden p-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] min-w-0 break-words rounded-2xl px-4 py-2 text-sm leading-relaxed [&_strong]:font-semibold",
                      message.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md",
                    )}
                  >
                    {message.role === "assistant" ? renderFormatted(message.content) : message.content}

                    {message.cards && (
                      <div className="mt-2 space-y-2">
                        {message.cards.map((c) => (
                          <div key={c.id} className="flex w-full items-center gap-2 rounded-xl border border-border bg-background p-2">
                            <Link
                              to={`/order#item-${c.id}`}
                              onClick={() => setIsOpen(false)}
                              className="flex min-w-0 flex-1 items-center gap-3"
                            >
                              <img src={c.image} alt={c.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" loading="lazy" />
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-semibold">{c.name}</p>
                                <p className="truncate text-xs text-muted-foreground">{c.description}</p>
                              </div>
                            </Link>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              <span className="text-sm font-semibold text-secondary">${c.price.toFixed(2)}</span>
                              <Button
                                size="sm"
                                onClick={() => handleAdd(c)}
                                className="h-7 gap-1 bg-primary px-2 text-primary-foreground hover:bg-primary/90"
                              >
                                <Plus className="h-3.5 w-3.5" /> Add
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {message.locations && (
                      <div className="mt-2 space-y-2">
                        {message.locations.map((l) => (
                          <div key={l.name} className="w-full rounded-xl border border-border bg-background p-3">
                            <div className="flex items-center gap-1.5 font-semibold">
                              <MapPin className="h-4 w-4 shrink-0 text-secondary" /> {l.name}
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">{l.address}</p>
                            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 shrink-0" /> {l.hours}
                            </p>
                            <div className="mt-2 flex gap-2">
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                              >
                                <Navigation className="h-3 w-3" /> Directions
                              </a>
                              <a
                                href={`tel:${l.phone.replace(/[^0-9+]/g, "")}`}
                                className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:border-primary"
                              >
                                <Phone className="h-3 w-3" /> Call
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {message.link && (
                      <Link
                        to={message.link.href}
                        onClick={() => setIsOpen(false)}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        {message.link.label} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-2 text-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick-start chips — only before the customer starts chatting. */}
          {!isLoading && !messages.some((m) => m.role === "user") && (
            <div className="flex flex-wrap gap-1.5 border-t border-border px-3 pt-2">
              {CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => handleChip(chip)}
                  className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary hover:bg-primary/5"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          <div className="p-3">
            <div className="flex gap-2">
              <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Type your message..." disabled={isLoading} className="flex-1" />
              <Button onClick={() => sendMessage()} disabled={!input.trim() || isLoading} size="icon" className="bg-primary hover:bg-primary/90">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
