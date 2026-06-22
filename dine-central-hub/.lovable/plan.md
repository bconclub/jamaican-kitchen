
# Restaurant Chain Management Dashboard

A unified, modern light SaaS dashboard (Toast / Square style) for a multi-location restaurant chain to manage orders, delivery, menus, inventory, analytics, locations, staff, and customers across every sales channel: **Website, Mobile App, In-restaurant POS, Uber Eats, DoorDash, Grubhub**.

## Important note on third-party integrations

Uber Eats, DoorDash, and Grubhub all require **approved merchant/partner API access** — these are not public APIs:

- **Uber Eats** — Uber Direct / Eats Marketplace API (merchant onboarding required)
- **DoorDash** — Drive API or Marketplace API (developer portal credentials)
- **Grubhub** — Marketplace integration (partner program approval, can take weeks)

I'll build the full dashboard now with **production-ready integration adapters** (typed clients, webhook endpoints, order normalization, secret slots) using realistic mock data so the UI works end-to-end. The moment you provide credentials for any provider, we flip that adapter from mock → live without UI changes.

## App structure

```
/                        Marketing redirect → /dashboard
/login                   Email + password (Lovable Cloud auth)
/dashboard               Overview KPIs (today's revenue, orders, AOV, channel mix)
/orders                  Unified live order feed (all channels, all locations)
/orders/$id              Order detail + status timeline + driver tracking
/delivery                Active deliveries map + driver/courier status
/menu                    Items, categories, modifiers, pricing
/menu/$id                Item editor + per-channel availability/pricing
/inventory               Stock levels, 86'd items, low-stock alerts
/locations               Chain locations list + per-location settings
/locations/$id           Location detail (channels enabled, hours, staff)
/analytics               Revenue/orders by channel, location, time, top items
/customers               Customer database + order history + LTV
/staff                   Staff list + roles (Owner, Manager, Staff)
/integrations            Channel connection status (Uber Eats, DoorDash, Grubhub, POS, App, Web)
/settings                Chain settings, taxes, branding
```

Persistent left sidebar (collapsible) + top bar with **location switcher** ("All locations" or specific store) and global search. The location filter cascades through every screen.

## Core modules (v1 must-haves)

### 1. Live Orders + Delivery Tracking
- **Unified order feed** with channel badge (Web / App / POS / Uber Eats / DoorDash / Grubhub), location, customer, items, total, ETA, status.
- Filter by channel, location, status (New, Accepted, Preparing, Ready, Out for delivery, Completed, Cancelled), time range.
- Quick actions: Accept, Reject, Mark ready, Refund, Print ticket.
- **Order detail** with timeline, items + modifiers, payment, delivery address, courier info, customer notes.
- **Delivery view** with active courier list, status, ETA, and a map (interactive map of in-progress deliveries).
- Real-time updates via Supabase Realtime on the `orders` table.
- New-order toast + sound notification.

### 2. Menu & Inventory
- Categories → items → modifier groups → modifiers.
- Per-channel availability and pricing overrides (e.g., "Uber Eats price = +15%", "Lunch combo only on App").
- One-click **86 / un-86** an item across all channels or specific ones.
- Inventory: track stock units, set low-stock thresholds, automatic 86'ing when stock hits 0, restock log.
- Sync-status indicator per channel (Synced / Pending / Failed) with retry.

### 3. Sales Analytics & Reports
- **Overview**: revenue, orders, AOV, refunds — today / 7d / 30d / custom range, with comparison vs previous period.
- Charts: revenue over time, channel mix (donut), revenue by location (bar), top 10 items, hourly heatmap (busiest times).
- Per-channel breakdown: gross sales, commissions/fees (third-parties), net payout.
- Per-location P&L summary.
- CSV / PDF export.

### 4. Locations, Staff & Customers
- **Locations**: list of chain stores, per-location hours, enabled channels, manager, today's snapshot.
- **Staff**: invite users, assign role (Owner / Manager / Staff) and location scope. Roles enforced via Supabase RLS + a `user_roles` table with `has_role()` security-definer function.
- **Customers**: unified profile across channels (best-effort match by email/phone), order history, LTV, last order, favorite items, marketing tags.

### 5. Integrations hub
- Connection cards for each channel showing **status** (Connected / Mock / Not configured), last sync, webhook URL to copy into the provider portal, and a "Test connection" button.
- Per-provider settings (auto-accept orders, prep time padding, price markup).

## Visual design — Modern light SaaS

- White / neutral surface, soft shadows, generous whitespace.
- Primary accent: indigo-blue. Success: emerald. Warning: amber. Danger: rose.
- Channel badges in distinct brand-leaning colors (Uber Eats green-black, DoorDash red, Grubhub orange, Web/App/POS in neutral tones).
- Typography: Inter, clear hierarchy, tabular numerals for money/quantities.
- Data-dense tables with sticky headers, row hover, keyboard navigation.
- Status pills, KPI cards with sparkline + delta, recharts for charts.
- Fully responsive; collapsible sidebar for tablet use in-store.

## Backend & data model (Lovable Cloud / Supabase)

Tables (with RLS scoped by location + role):

- `chains`, `locations`, `staff`, `user_roles`
- `customers`
- `menu_categories`, `menu_items`, `modifier_groups`, `modifiers`, `item_channel_overrides`
- `inventory_items`, `inventory_movements`
- `orders` (with `channel`, `external_id`, `location_id`, `status`, `totals`, `payment`), `order_items`, `order_status_events`
- `deliveries` (courier, ETA, lat/lng updates)
- `channel_integrations` (per location × provider: credentials reference, webhook secret, status, settings)
- `payouts` (third-party reconciliation)

Auth: email + password and Google sign-in. Roles in a separate `user_roles` table using the recommended `has_role()` security-definer pattern (no role on profiles).

## Third-party integration scaffolding

Each provider gets a typed adapter in `src/server/channels/` with the same interface:

```
acceptOrder, rejectOrder, updateOrderStatus, updateMenu, set86, getDeliveryStatus
```

Public webhook routes are created up front so the URLs are ready to paste into each provider portal:

- `POST /api/public/webhooks/uber-eats` — HMAC signature verified
- `POST /api/public/webhooks/doordash` — JWT / HMAC verified
- `POST /api/public/webhooks/grubhub` — signature verified
- `POST /api/public/webhooks/pos` — for in-store POS push
- `POST /api/public/webhooks/website` and `/app` for first-party channels

Until real credentials are added, adapters run in **mock mode** seeded with realistic order data and a generator that drips new orders into the feed every few seconds so you can demo the full experience.

When you're ready to go live, you provide each provider's credentials as secrets and I switch the adapter to live mode and walk you through registering the webhook URL in each provider portal.

## Out of scope for v1 (can add later)

- KDS (kitchen display) full-screen view
- Driver dispatch / own-fleet management
- Loyalty program, gift cards, marketing campaigns
- Accounting export (QuickBooks / Xero)
- Native mobile apps for staff

## What you'll see after implementation

A fully navigable dashboard with seeded data for a sample 3-location chain ("Bella Cucina"), live-updating order feed, working menu/inventory editor, real charts, location switcher, login, and an Integrations page where each third-party shows "Mock mode — connect to go live" with a button to start the credential flow.
