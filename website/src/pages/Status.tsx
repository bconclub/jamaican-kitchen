import { PageLayout } from "@/components/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, CircleDot, AlertCircle, Sparkles } from "lucide-react";

// Living project status board. Update the arrays below as work ships.
// Statuses:
//   live    -> shipped to production, verified
//   building-> in progress right now
//   planned -> requested / queued, not started
//   blocked -> waiting on something (client input, domain, sign-off)
//   addon   -> out of SOW scope, needs change order + sign-off
type Status = "live" | "building" | "planned" | "blocked" | "addon";

interface Item {
  title: string;
  status: Status;
  note?: string;
}
interface Section {
  area: string;
  blurb: string;
  items: Item[];
}

const STATUS_META: Record<Status, { label: string; explain: string; dot: string; chip: string; icon: typeof CheckCircle2 }> = {
  live: { label: "In production", explain: "Done and live on the site", dot: "bg-[#009B3A]", chip: "bg-[#009B3A]/10 text-[#009B3A]", icon: CheckCircle2 },
  building: { label: "In progress", explain: "Being worked on right now", dot: "bg-amber-500", chip: "bg-amber-500/10 text-amber-600", icon: Loader2 },
  planned: { label: "Requested", explain: "Agreed, still to do", dot: "bg-blue-500", chip: "bg-blue-500/10 text-blue-600", icon: CircleDot },
  blocked: { label: "Blocked", explain: "Waiting on something (your input, a domain, etc.)", dot: "bg-red-500", chip: "bg-red-500/10 text-red-600", icon: AlertCircle },
  addon: { label: "Out of scope", explain: "Beyond the agreement — needs your sign-off to build", dot: "bg-purple-500", chip: "bg-purple-500/10 text-purple-600", icon: Sparkles },
};

const STATUS_ORDER: Status[] = ["live", "building", "planned", "blocked", "addon"];

const SECTIONS: Section[] = [
  {
    area: "Website — Storefront",
    blurb: "The public ordering site customers use.",
    items: [
      { title: "Online ordering + cart", status: "live" },
      { title: "Catering page with separate cart + quote flow", status: "live" },
      { title: "Order confirmation / thank-you pages (online + catering)", status: "live" },
      { title: "Add-to-order steppers + checkout pre-fill", status: "live" },
      { title: "Testimonials carousel", status: "live" },
      { title: "Real delivery-partner logos", status: "live" },
      { title: "Cart opens automatically on add", status: "live" },
      { title: "Full-height pages (footer below the fold)", status: "live" },
      { title: "Toasts repositioned clear of the header + CTAs", status: "live" },
      { title: "Brand Book v2.0 font system (Display / Heading / Body / UI)", status: "live" },
      { title: "Per-location Best Sellers", status: "live" },
      { title: "Homepage Best Sellers: real items (staff-flagged), not hardcoded", status: "live", note: "Auto sales-ranking (vs. staff flagging) is a fast-follow" },
      { title: "Downloadable menu with disclaimer", status: "live" },
      { title: "Order review prompt after checkout (star rating + comment)", status: "live", note: "Goes to staff for approval before showing publicly" },
      { title: "Catering delivery option", status: "live" },
      { title: "Catering real checkout (24h+ direct pay) + urgent request (<24h)", status: "live" },
      { title: "Catering delivery pricing by distance tier", status: "live", note: "Manual tiers for now: $15 / $30 / $50" },
      { title: "Catering checkout: open tip option", status: "live" },
      { title: "Online ordering: enable/disable delivery (site-wide toggle)", status: "blocked", note: "Needs a shared settings table in the database — current admin settings only save to that browser, not the live site" },
      { title: "Careers page", status: "addon", note: "Previously agreed to skip for v1; re-raised in the meeting — needs your sign-off to bring back into scope" },
    ],
  },
  {
    area: "Wallet & Loyalty",
    blurb: "Cashback wallet customers earn and spend.",
    items: [
      { title: "Earn 5% cashback on every order", status: "live" },
      { title: "Redeem wallet balance at checkout", status: "live" },
      { title: "Wallet page: balance, activity, past orders w/ items", status: "live" },
      { title: "Demo OTP sign-in (generated code, no email needed)", status: "live" },
      { title: "Real OTP / magic-link email delivery", status: "blocked", note: "Needs a verified sending domain" },
      { title: "Finalized wallet rules & regulations", status: "planned", note: "Need the actual written rules (earn %, expiry, eligible items etc.) to implement exactly as agreed" },
      { title: "Admin: add wallet credit for occasions/promos", status: "blocked", note: "Needs a new database permission + admin action — staff currently can only view wallets, not edit them" },
      { title: "Customer-to-customer wallet gifting", status: "blocked", note: "New feature: needs a secure transfer function + UI on the wallet page" },
    ],
  },
  {
    area: "AI Assistants",
    blurb: "Chat assistants on both apps — answers only from in-system data, free models, key kept server-side.",
    items: [
      { title: "Storefront assistant: browse menu, prices, recommendations", status: "live" },
      { title: "Admin (Dine Central) assistant: orders, revenue, stock, customers", status: "live" },
      { title: "Powered by OpenRouter free models with automatic fallback", status: "live" },
      { title: "API key kept server-side (never in the browser)", status: "live" },
      { title: "Answers grounded in our own data only (no outside info)", status: "live" },
      { title: "Broader AI workflow (staff ops, training, franchise support)", status: "planned", note: "Discussed in the meeting — no build spec agreed yet, needs a follow-up conversation to scope" },
    ],
  },
  {
    area: "Dine Central — Admin Dashboard",
    blurb: "The staff/owner operations portal.",
    items: [
      { title: "Live Orders feed (realtime, no refresh)", status: "live" },
      { title: "Locations: real CT stores with a per-store overview (orders, revenue)", status: "live" },
      { title: "Prep timer freezes correctly at Ready", status: "live" },
      { title: "Click an order to see full detail", status: "live" },
      { title: "Click a customer to see their profile + order history", status: "live" },
      { title: "Inline stock editing (type the number)", status: "live" },
      { title: "Menu CRUD that persists (items, categories)", status: "live" },
      { title: "Menu: Online vs Catering selector on new item", status: "building", note: "Online menu works fully; catering menu isn't in the database yet (still a storefront-only file) so it can't be edited from here yet" },
      { title: "Menu: Best Seller flag toggle per item", status: "live" },
      { title: "Analytics: custom date range", status: "live" },
      { title: "Admin login (demo)", status: "live" },
      { title: "Delivery: real map of our CT locations", status: "live" },
      { title: "Order History view + retention rule", status: "live" },
      { title: "Admin catering order: item picker + delivery address", status: "live" },
      { title: "Customer VIP rule", status: "blocked", note: "Need the threshold ($ spend or # orders)" },
      { title: "Settings persistence", status: "live" },
      { title: "Online vs Catering channel split", status: "live" },
      { title: "Dashboard: Catering section", status: "live" },
      { title: "Dashboard: send catering payment links", status: "blocked", note: "Needs a real payment gateway connected (gateway itself is client-provided, per the SOW)" },
      { title: "Payments: custom date range filter", status: "planned", note: "Payments page currently shows gateway connections only, not a transaction list yet — needs scoping before a date filter is meaningful" },
      { title: "Modifiers system (size/sauce/add-ons)", status: "addon" },
      { title: "Master Menu / per-location stock", status: "addon" },
      { title: "Time-based availability (breakfast/lunch/dinner)", status: "addon" },
      { title: "Website traffic report", status: "addon" },
    ],
  },
  {
    area: "Backend & Infrastructure",
    blurb: "Database, realtime, hosting.",
    items: [
      { title: "Supabase schema + RLS + secure order RPC", status: "live" },
      { title: "Wallet / loyalty database schema", status: "live" },
      { title: "Realtime order feed", status: "live" },
      { title: "Storefront + admin deployed to Vercel", status: "live" },
      { title: "AI chat endpoints (Vercel function + server fn), key in env", status: "live" },
      { title: "Transactional email (Resend) fully wired", status: "blocked", note: "Needs verified domain" },
    ],
  },
];

const Status = () => {
  const all = SECTIONS.flatMap((s) => s.items);
  const counts = (st: Status) => all.filter((i) => i.status === st).length;
  const live = counts("live");
  const total = all.length;
  const pct = Math.round((live / total) * 100);

  return (
    <PageLayout title="Project Status" subtitle="Live tracker of what's been requested, what's done, and what's in production.">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Summary */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-4xl font-bold text-[#009B3A]">{live}<span className="text-xl text-muted-foreground">/{total}</span></div>
                <p className="text-sm text-muted-foreground">features live in production</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {STATUS_ORDER.map((st) => (
                  <div key={st} title={STATUS_META[st].explain} className="flex cursor-help items-center gap-2 text-sm">
                    <span className={`h-2.5 w-2.5 rounded-full ${STATUS_META[st].dot}`} />
                    <span className="text-muted-foreground">{STATUS_META[st].label}</span>
                    <span className="font-semibold tabular-nums">{counts(st)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-[#009B3A] transition-all" style={{ width: `${pct}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <div key={section.area}>
            <div className="mb-3">
              <h2 className="text-xl font-bold">{section.area}</h2>
              <p className="text-sm text-muted-foreground">{section.blurb}</p>
            </div>
            <Card>
              <CardContent className="divide-y p-0">
                {section.items.map((item) => {
                  const meta = STATUS_META[item.status];
                  const Icon = meta.icon;
                  return (
                    <div key={item.title} className="flex items-center justify-between gap-4 p-4">
                      <div className="flex items-center gap-3">
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} />
                        <div>
                          <p className="font-medium leading-tight">{item.title}</p>
                          {item.note && <p className="text-xs text-muted-foreground">{item.note}</p>}
                        </div>
                      </div>
                      <span
                        title={meta.explain}
                        className={`inline-flex shrink-0 cursor-help items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.chip}`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${item.status === "building" ? "animate-spin" : ""}`} />
                        {meta.label}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        ))}

        <p className="text-center text-xs text-muted-foreground pb-4">
          Updated as work ships. "In production" means live and verified on the deployed site.
        </p>
      </div>
    </PageLayout>
  );
};

export default Status;
