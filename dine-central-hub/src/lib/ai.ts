import { createServerFn } from "@tanstack/react-start";

// Admin "Dine Central" operations assistant. Runs server-side via createServerFn so
// the OpenRouter key never reaches the browser. Context is the in-system data snapshot
// the client already loaded under the owner's session (RLS-permitted) — no outside data.

export interface AdminChatMessage {
  role: "user" | "assistant";
  content: string;
}
interface AdminChatInput {
  messages: AdminChatMessage[];
  context: string;
}

const FREE_MODEL_FALLBACKS = [
  "openai/gpt-oss-120b:free",
  "google/gemma-4-31b-it:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "openai/gpt-oss-20b:free",
];

const SYSTEM_PREAMBLE = `You are the operations assistant for Jamaican Kitchen's admin dashboard ("Dine Central").
You help owners and managers quickly understand what is happening across their Connecticut restaurants.

Rules:
- ONLY use the data snapshot provided below. NEVER invent numbers, orders, customers, or trends.
- If the answer isn't in the snapshot, say it's not in the current view and suggest where in the dashboard to look.
- Be concise and actionable. Use **bold** for key numbers, bullet lists for breakdowns, and lead with the answer.`;

export const askAdminAI = createServerFn({ method: "POST" })
  .inputValidator((d: AdminChatInput) => d)
  .handler(async ({ data }: { data: AdminChatInput }) => {
    const key = process.env.OPENROUTER_API_KEY;
    if (!key) return { error: "Assistant is not configured." } as { reply?: string; error?: string; model?: string };

    const system = `${SYSTEM_PREAMBLE}\n\nDATA SNAPSHOT:\n${data.context || "(no data available)"}`;
    const candidates = [process.env.OPENROUTER_MODEL, ...FREE_MODEL_FALLBACKS].filter(Boolean) as string[];
    const tried = new Set<string>();

    for (const model of candidates) {
      if (tried.has(model)) continue;
      tried.add(model);
      try {
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://dine-central-hub.vercel.app",
            "X-Title": "Dine Central",
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: "system", content: system },
              ...data.messages.map((m) => ({ role: m.role, content: String(m.content) })),
            ],
            temperature: 0.3,
            max_tokens: 700,
          }),
        });
        if (!r.ok) {
          if ([429, 404, 503, 502].includes(r.status)) continue;
          return { error: `Upstream error ${r.status}.` };
        }
        const j = (await r.json()) as { choices?: { message?: { content?: string } }[] };
        const reply = j?.choices?.[0]?.message?.content;
        if (reply && reply.trim()) return { reply: reply.trim(), model };
      } catch {
        /* try next free model */
      }
    }
    return { error: "All free models are busy right now. Please try again in a moment." };
  });
