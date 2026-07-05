# Environment Variables — Setup & Handover Reference

This project is a **monorepo with two apps**, each deployed as its own Vercel project:

| App | Folder (Vercel "Root Directory") | What it is |
|-----|----------------------------------|------------|
| Storefront | `website` | Customer-facing website (Order, Menu, Catering, Rewards…) |
| Dine Central | `dine-central-hub` | Staff/owner admin dashboard |

Both apps talk to the **same Supabase database**. Set the variables below in **each app's local `.env`** (for local dev) **and** in **each app's Vercel project → Settings → Environment Variables** (for the live site).

> **Legend:** 🌐 = public (safe to commit / ships in the browser) · 🔒 = secret (never commit, never prefix with `VITE_`)

---

## 1. Storefront — `website/.env`

```env
# --- Supabase (🌐 public client keys) ---
VITE_SUPABASE_PROJECT_ID="adqmjrzafrhsommelaqb"
VITE_SUPABASE_URL="https://adqmjrzafrhsommelaqb.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon / publishable key — see Supabase → Settings → API>"

# --- AI assistant (🔒 server-side only) ---
OPENROUTER_API_KEY="<your OpenRouter key — starts sk-or-v1-… — from openrouter.ai/keys>"
OPENROUTER_MODEL="openai/gpt-oss-120b:free"

# --- Menu source (optional) ---
# "true"  = show the new bundled 142-item menu without the DB migration applied
# unset/"false" = read the live database
VITE_USE_STATIC_MENU="true"
```

## 2. Dine Central (admin) — `dine-central-hub/.env`

```env
# --- Supabase (🌐 public client keys) ---
VITE_SUPABASE_PROJECT_ID="adqmjrzafrhsommelaqb"
VITE_SUPABASE_URL="https://adqmjrzafrhsommelaqb.supabase.co"
VITE_SUPABASE_ANON_KEY="<anon / publishable key — same value as the storefront's PUBLISHABLE_KEY>"

# --- AI assistant (🔒 server-side only) ---
OPENROUTER_API_KEY="<same OpenRouter key as the storefront>"
OPENROUTER_MODEL="openai/gpt-oss-120b:free"

# --- Menu source (optional, same meaning as above) ---
VITE_USE_STATIC_MENU="true"
```

---

## 3. Where to get each value

| Variable | Where it comes from |
|----------|---------------------|
| `VITE_SUPABASE_PROJECT_ID` | Supabase dashboard → the project ref in the URL (already: `adqmjrzafrhsommelaqb`) |
| `VITE_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_ANON_KEY` | Supabase → Settings → API → **anon / public** key (both apps use the SAME value; only the variable name differs) |
| `OPENROUTER_API_KEY` | openrouter.ai → Keys. 🔒 Keep secret. The current working key is in the existing local `website/.env` (`OPENROUTER_API_KEY=sk-or-v1-…`) — copy it, or generate a fresh one. |
| `OPENROUTER_MODEL` | Any OpenRouter model id. `openai/gpt-oss-120b:free` is the current free default (auto-falls back to other free models if busy). |
| `VITE_USE_STATIC_MENU` | Your choice — see note in the files above. |

---

## 4. Direct database / admin access — the `service_role` (secret) key

Supabase → Settings → API also gives a **`service_role` `secret`** key (new system: a **Secret key**, `sb_secret_…`). Use this for direct table work — applying migrations, bulk edits, seeding, back-office scripts.

> ⚠️ **This key bypasses ALL row-level security.** It can read and rewrite every row in every table — customers, wallets, orders. Treat it like the master password to the database.

**Hard rules — do not break these:**
- ❌ **Never** put it in either app's env, and **never** give it a `VITE_` prefix. Both apps are browser apps — a `VITE_` value ships to every visitor, who could then dump or wipe the whole database.
- ❌ **Never** commit it or paste it into a public place.
- ✅ Only use it **server-side** or in **trusted admin tools** on your own machine.

**The right ways to "do what's needed on the tables directly":**

| Task | Tool | Key used |
|------|------|----------|
| Run SQL / edit rows by hand | Supabase Dashboard → **SQL Editor** or **Table Editor** | none — you're logged in |
| Apply migrations (`0003`, `0004`, …) | **Supabase CLI** → `supabase db push` | your login + DB password |
| A back-office script that must bypass RLS | Node/server script (never the browser) reading a plain env var | `SUPABASE_SERVICE_ROLE_KEY` |
| Direct connection | `psql` with the DB connection string | DB password |

If (and only if) a **server-side** script or serverless function needs it, store it as a plain, unprefixed env var and keep it out of git:

```env
# 🔒🔒 SERVER-SIDE / ADMIN ONLY — never VITE_, never commit, never in the browser
SUPABASE_SERVICE_ROLE_KEY="<service_role / secret key — Supabase → Settings → API>"
```

> Note: the two apps in this repo do **not** currently use the service_role key — the storefront and admin both run safely on the anon key + row-level security. You only need the secret key for hands-on database administration outside the apps.

---

## 5. Notes

- **Anon / publishable key is public by design** — it ships in the browser bundle and is protected by row-level security in the database. Safe to commit / paste into Vercel.
- **Secrets** — the `OPENROUTER_API_KEY` and the `service_role` key are the real secrets. Never commit them, never give them a `VITE_` prefix. On Vercel add them as plain (unprefixed) env vars so only server-side code sees them.
- **On Vercel**, add every variable for the **Production** (and Preview, if used) environment, then redeploy for changes to take effect.
- `.env` files are git-ignored, so they never reach the repo — only these instructions and `.env.example` templates are committed.
