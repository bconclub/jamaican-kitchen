// Storefront AI assistant — self-contained so it loads cleanly as an ESM Vercel
// function (no sibling imports). The OpenRouter key lives only in the server env.
// The Vite dev middleware (vite.config.ts) imports `storefrontChat` from here too,
// so local dev and production run the exact same logic.

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatEnv {
  OPENROUTER_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

// Free OpenRouter models, tried in order if the preferred one is busy (429/404/503).
// Free models rotate/retire often — refresh from /api/v1/models if replies start failing.
const FREE_MODEL_FALLBACKS = [
  "openai/gpt-oss-120b:free",
  "google/gemma-4-31b-it:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "openai/gpt-oss-20b:free",
];

interface MenuItemRow {
  name: string;
  description: string | null;
  base_price: number | string | null;
  available: boolean | null;
  category_id: string | null;
  featured: boolean | null;
}
interface CategoryRow {
  id: string;
  name: string;
}

async function fetchMenuContext(url: string, anon: string): Promise<string> {
  const headers = { apikey: anon, Authorization: `Bearer ${anon}` };
  const [itemsRes, catsRes] = await Promise.all([
    fetch(`${url}/rest/v1/menu_items?select=name,description,base_price,available,category_id,featured&order=sort_order`, { headers }),
    fetch(`${url}/rest/v1/menu_categories?select=id,name&order=sort_order`, { headers }),
  ]);
  const items: MenuItemRow[] = itemsRes.ok ? await itemsRes.json() : [];
  const cats: CategoryRow[] = catsRes.ok ? await catsRes.json() : [];
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  const byCat = new Map<string, MenuItemRow[]>();
  for (const it of items) {
    const c = (it.category_id && catName.get(it.category_id)) || "Other";
    if (!byCat.has(c)) byCat.set(c, []);
    byCat.get(c)!.push(it);
  }
  let ctx = "";
  for (const [cat, list] of byCat) {
    ctx += `\n## ${cat}\n`;
    for (const it of list) {
      const price = it.base_price != null ? `$${Number(it.base_price).toFixed(2)}` : "";
      const avail = it.available === false ? " (currently unavailable)" : "";
      const fav = it.featured ? " [BEST SELLER / customer favorite]" : "";
      const desc = it.description ? `: ${it.description}` : "";
      ctx += `- ${it.name} - ${price}${fav}${avail}${desc}\n`;
    }
  }
  return ctx.trim();
}

// Our 6 Connecticut locations (matches the storefront Locations page). All open
// Mon-Sat 11am-9pm, Sun 12pm-8pm.
const LOCATIONS_TEXT = `- Vernon: 123 Hartford Turnpike, Vernon, CT 06066 · (860) 555-0101
- South Windsor: 456 Sullivan Ave, South Windsor, CT 06074 · (860) 555-0102
- Windsor Locks: 789 Main St, Windsor Locks, CT 06096 · (860) 555-0103
- Bristol: 321 Farmington Ave, Bristol, CT 06010 · (860) 555-0104
- Rocky Hill: 654 Silas Deane Hwy, Rocky Hill, CT 06067 · (860) 555-0105
- Enfield: 987 Enfield St, Enfield, CT 06082 · (860) 555-0106
All locations open Mon-Sat 11am-9pm, Sun 12pm-8pm.`;

const SYSTEM_PREAMBLE = `You are the friendly ordering assistant for Jamaican Kitchen, an authentic Jamaican restaurant chain in Connecticut.
Your job: help customers explore the menu, recommend dishes, and guide them to add items to their order.

Rules:
- ONLY use the menu and information provided below. NEVER invent dishes, prices, ingredients, locations, or hours.
- If something isn't in the data, say you don't have that detail and suggest they check the website or call the restaurant.
- Items tagged [BEST SELLER / customer favorite] are our most popular dishes — recommend these when asked for best sellers or recommendations.
- If they ask to see the whole menu, don't list every item. Give a couple of highlights and tell them to open the Order page to browse and order.
- Keep answers short and well formatted: use **bold** for dish names, bullet lists for options, and always include the price when you mention a dish.
- Be warm and concise, and encourage them to add items to their order. Do not use em dashes.`;

export interface ChatResult {
  status: number;
  body: { reply?: string; model?: string; error?: string };
}

export async function storefrontChat(payload: unknown, env: ChatEnv): Promise<ChatResult> {
  const key = env.OPENROUTER_API_KEY;
  if (!key) return { status: 500, body: { error: "Assistant is not configured." } };

  const messages = ((payload as { messages?: unknown })?.messages ?? []) as ChatMessage[];
  if (!Array.isArray(messages) || messages.length === 0) {
    return { status: 400, body: { error: "No messages provided." } };
  }

  let menu = "";
  if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
    try {
      menu = await fetchMenuContext(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    } catch {
      /* menu unavailable — model is told so below */
    }
  }

  const bestSellers = "Oxtail, Curry Goat, Jerk Chicken, Pepper Steak, Escovitch Fish";
  const system = `${SYSTEM_PREAMBLE}\n\nOUR LOCATIONS:\n${LOCATIONS_TEXT}\n\nBEST SELLERS (our most popular dishes, in order): ${bestSellers}.\n\nCURRENT MENU:\n${menu || "(menu temporarily unavailable)"}`;
  const tried = new Set<string>();
  const candidates = [env.OPENROUTER_MODEL, ...FREE_MODEL_FALLBACKS].filter(Boolean) as string[];

  for (const model of candidates) {
    if (tried.has(model)) continue;
    tried.add(model);
    try {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://jamaican-kitchen.vercel.app",
          "X-Title": "Jamaican Kitchen",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: system },
            ...messages
              .filter((m) => m.role === "user" || m.role === "assistant")
              .map((m) => ({ role: m.role, content: String(m.content) })),
          ],
          temperature: 0.4,
          max_tokens: 600,
        }),
      });
      if (!r.ok) {
        if (r.status === 429 || r.status === 404 || r.status === 503 || r.status === 502) continue;
        return { status: 502, body: { error: `Upstream error ${r.status}.` } };
      }
      const data = (await r.json()) as { choices?: { message?: { content?: string } }[] };
      const reply = data?.choices?.[0]?.message?.content;
      if (reply && reply.trim()) return { status: 200, body: { reply: reply.trim(), model } };
    } catch {
      /* network hiccup — try next model */
    }
  }
  return { status: 503, body: { error: "All free models are busy right now. Please try again in a moment." } };
}

// Vercel serverless entrypoint.
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body ?? {};
    const env: ChatEnv = {
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
      SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };
    const result = await storefrontChat(body, env);
    res.status(result.status).json(result.body);
  } catch (e) {
    res.status(500).json({ error: "Assistant failed to respond." });
  }
}
