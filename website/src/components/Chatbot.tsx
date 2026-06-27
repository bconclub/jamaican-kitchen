import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sparkles, X, Send, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ProductCard {
  name: string;
  price: string;
  description: string;
  image: string;
}
type Message = {
  role: "user" | "assistant";
  content: string;
  cards?: ProductCard[];
  link?: { label: string; href: string };
};

// Calls our own server endpoint — the OpenRouter key stays on the backend.
const CHAT_URL = "/api/chat";

// Curated best sellers (mirrors the homepage) — shown as inline cards in chat.
const BEST_SELLERS: ProductCard[] = [
  { name: "Oxtail", price: "$18.99", description: "Slow-cooked oxtail in rich brown gravy with butter beans", image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=200&q=80" },
  { name: "Curry Goat", price: "$17.99", description: "Traditional Jamaican curry goat, slow-cooked to perfection", image: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=200&q=80" },
  { name: "Jerk Chicken", price: "$14.99", description: "Authentic jerk chicken in our signature spice blend", image: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=200&q=80" },
  { name: "Pepper Steak", price: "$16.99", description: "Tender steak strips with bell peppers in savory brown sauce", image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&q=80" },
  { name: "Escovitch Fish", price: "$15.99", description: "Crispy fried fish topped with pickled vegetables", image: "https://images.unsplash.com/photo-1580476262798-bddd9f4b7369?w=200&q=80" },
];

// Follow-up chips — always visible so the conversation can keep going.
// `kind` controls behaviour: cards (best sellers), link (menu), or ask (send to AI).
const CHIPS: { label: string; kind: "cards" | "link" | "ask" }[] = [
  { label: "What's your best seller?", kind: "cards" },
  { label: "Show me the menu", kind: "link" },
  { label: "Any vegetarian options?", kind: "ask" },
  { label: "How do I order online?", kind: "ask" },
  { label: "Where are you located?", kind: "ask" },
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
        { role: "assistant", content: "Here are our most popular dishes 🔥", cards: BEST_SELLERS },
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

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
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
                          <Link
                            key={c.name}
                            to="/order"
                            onClick={() => setIsOpen(false)}
                            className="flex w-full items-center gap-3 rounded-xl border border-border bg-background p-2 transition-colors hover:border-primary"
                          >
                            <img src={c.image} alt={c.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" loading="lazy" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate font-semibold">{c.name}</span>
                                <span className="shrink-0 font-semibold text-secondary">{c.price}</span>
                              </div>
                              <p className="truncate text-xs text-muted-foreground">{c.description}</p>
                            </div>
                          </Link>
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
          </ScrollArea>

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
