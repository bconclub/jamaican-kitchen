import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { storefrontChat, type ChatEnv } from "./api/_core";

// Dev-only middleware so /api/chat works under `vite` (no Vercel functions locally).
// Production uses the matching Vercel function in api/chat.ts — same core logic.
function chatDevApi(env: Record<string, string>): Plugin {
  return {
    name: "chat-dev-api",
    configureServer(server) {
      server.middlewares.use("/api/chat", (req, res, next) => {
        if (req.method !== "POST") return next();
        let raw = "";
        req.on("data", (c) => (raw += c));
        req.on("end", async () => {
          const chatEnv: ChatEnv = {
            OPENROUTER_API_KEY: env.OPENROUTER_API_KEY,
            OPENROUTER_MODEL: env.OPENROUTER_MODEL,
            SUPABASE_URL: env.VITE_SUPABASE_URL,
            SUPABASE_ANON_KEY: env.VITE_SUPABASE_PUBLISHABLE_KEY,
          };
          try {
            const result = await storefrontChat(JSON.parse(raw || "{}"), chatEnv);
            res.statusCode = result.status;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(result.body));
          } catch {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Assistant failed to respond." }));
          }
        });
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), chatDevApi(env)],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
