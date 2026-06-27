// Vercel serverless function for the storefront assistant.
// The OpenRouter key lives only in the server environment, never in the browser.
import { storefrontChat, type ChatEnv } from "./_core";

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
