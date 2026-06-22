# Changelog

## 2026-06-22 16:37 IST · Add button, live notification bell, desktop order panel

- **BestSellers** card button: "Add to Cart" → "+ Add" (Plus icon) and now actually adds to cart (was a dead button).
- **Admin notification bell** is now live: red count badge of new orders + popover listing recent/new orders (updates via realtime).
- **Desktop right-side order panel**: clicking an order in the bell opens a slide-in Sheet with items, totals, and Accept/Reject/Mark-ready actions + link to the full page.

## 2026-06-22 15:13 IST · Wire remaining admin pages live + Messages inbox + website fixes

- **Dashboard** now computes KPIs (revenue, orders, AOV, customers), revenue trend, fulfillment mix, and by-location chart from live orders within the selected date range (was mock).
- **Inventory** reads live menu items/stock; all-channel stock adjustments persist to `menu_items.stock`.
- **Catering** reads real `catering_requests` (website submissions); status advances persist; "New catering order" dialog inserts to DB.
- **Analytics** revenue/channel-mix/top-items/item-report derived from live orders.
- **TopBar search** queries live orders/customers/menu (was mock).
- **New Messages page** (`/messages`, Operate group) — catering requests + contact form inbox; gracefully shows "table not set up" until `contact_messages` is applied.
- New hooks: `useLiveCateringRequests`, `useLiveContactMessages`, `updateCateringStatus`, `updateContactStatus`; `contact_messages` added to admin Supabase types.
- **Website:** checkout now defaults to the pickup location selected on the Order page (shared via CartContext); hero typo "Sprit"→"Spirit".

## 2026-06-22 14:45 IST · Admin: React Flow system map

- New **System Flow** page (`/system`) using @xyflow/react — interactive end-to-end diagram of the whole system: website order → place_order RPC → orders/items/events → Supabase Realtime → admin live feed, plus catering, contact, menu, and auth/RLS paths. Colour-coded by layer; pending pieces (contact_messages) shown greyed.
- Added "System Flow" to the admin sidebar (Setup group).
- Verified in browser (logged-in admin renders the full map; location switcher shows live "All locations (6)").

## 2026-06-22 14:30 IST · Admin: live location switcher + live customers

- **Admin TopBar location switcher** now lists the real 6 CT locations from the DB (was wrong mock towns: Hartford, New Haven…).
- **Admin Customers page** now reads real customers from Supabase, with order count + lifetime value computed live from the orders table.
- New `useLiveCustomers` and live-locations wiring in `live-data.ts`.
- Verified website redesign in browser: header fixed, FAQ/nav pages render, favicon + SEO live.

## 2026-06-22 14:17 IST · Website header redesign, nav pages, favicon

- **Header redesigned** — replaced the broken oversized header (h-48, tiny floating logo) with a clean h-16/h-20 bar: logo left, real desktop nav (Order Online, Catering, Locations, More dropdown), Order Now + cart right, mobile hamburger drawer.
- Adjusted page top-offsets and sticky positions on Order/Catering/Locations/Hero to match the shorter header.
- **All nav items now wired** — created real pages: FAQ, Contact Us, About Us, Our Story, Rewards/Login, Download App. Added routes in App.tsx. No more 404s.
- **Contact form** posts to `contact_messages` (backend table) via `submitContactMessage`.
- Fixed hero "Contact Us" quick link (pointed to /faq → now /contact).
- **User-facing:** removed Lovable favicon, replaced with the Jamaican Kitchen logo; real page titles/SEO.
- New `PageLayout` component for consistent content pages.
- (pending) `contact_messages` table apply blocked on browser session — to run.
