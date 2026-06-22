import { createFileRoute } from "@tanstack/react-router";

const VALID = new Set(["website", "app"]);

// Using `as never` to bypass strict type-check on server-block typing in this version.
export const Route = createFileRoute("/api/public/webhooks/$channel")({
  server: {
    handlers: {
      POST: async ({ request, params }: { request: Request; params: { channel: string } }) => {
        if (!VALID.has(params.channel)) {
          return new Response("Unknown channel", { status: 404 });
        }
        // TODO: verify provider-specific signature header before trusting payload.
        let payload: unknown = null;
        try {
          payload = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        console.log(`[webhook:${params.channel}]`, payload);
        return Response.json({ ok: true, channel: params.channel });
      },
      GET: async ({ params }: { params: { channel: string } }) => {
        return Response.json({ channel: params.channel, status: "ready" });
      },
    },
  },
} as never);