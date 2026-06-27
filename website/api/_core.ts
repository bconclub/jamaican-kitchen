// Framework-agnostic chat core for the storefront assistant.
// Used by both the Vercel serverless function (api/chat.ts) and the Vite dev
// middleware (vite.config.ts), so the OpenRouter key stays server-side and the
// exact same logic runs locally and in production.

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
// Free models rotate/retire often — keep this list current with /api/v1/models.
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
}
interface CategoryRow {
  id: string;
  name: string;
}

// Build the menu context from our own Supabase (public menu) — strictly in-system data.
async function fetchMenuContext(url: string, anon: string): Promise<string> {
  const headers = { apikey: anon, Authorization: `Bearer ${anon}` };
  const [itemsRes, catsRes] = await Promise.all([
    fetch(`${url}/rest/v1/menu_items?select=name,description,base_price,available,category_id&order=sort_order`, { headers }),
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
      const desc = it.description ? `: ${it.description}` : "";
      ctx += `- ${it.name} — ${price}${avail}${desc}\n`;
    }
  }
  return ctx.trim();
}

const SYSTEM_PREAMBLE = `You are the friendly ordering assistant for Jamaican Kitchen, an authentic Jamaican restaurant chain in Connecticut.
Your job: help customers explore the menu, recommend dishes, and guide them to add items to their order.

Rules:
- ONLY use the menu and information provided below. NEVER invent dishes, prices, ingredients, locations, or hours.
- If something isn't in the data, say you don't have that detail and suggest they check the website or call the restaurant.
- Keep answers short and well formatted: use **bold** for dish names, bullet lists for options, and always include the price when you mention a dish.
- Be warm, concise, and encourage them to add items to their order.`;

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

  const system = `${SYSTEM_PREAMBLE}\n\nCURRENT MENU:\n${menu || "(menu temporarily unavailable)"}`;

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
        // Busy/unavailable free model — try the next one.
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
