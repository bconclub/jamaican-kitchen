# Jamaican Kitchen — Storefront

Customer-facing ordering site for Jamaican Kitchen, a Connecticut restaurant chain.
Browse the menu, build a pickup order, and check out. Orders flow in real time to the
staff operations dashboard (`dine-central-hub`).

Built and maintained by **BCON**.

## Tech stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres, Auth, Realtime, Edge Functions)

## Local development

```sh
npm install
npm run dev      # http://localhost:8080
```

## Environment

Copy `.env.example` to `.env` and set:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...   # public anon key (safe for the browser)
```

## Build & deploy

```sh
npm run build    # outputs to dist/
```

Deployed on Vercel; production builds from `main`.
