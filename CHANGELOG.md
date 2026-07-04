# Changelog

## 2026-07-04 · v0.0.3 — Add-ons picker: categorized accordion instead of a flat 19-item list

- Product editor's "Add-ons & options" picker now groups the 19 modifier groups into 4 categories
  (Sauces & Gravy, Flavor Choices, Sides & Toppings, Add-ons & Extras) inside a multi-open accordion —
  click a category to expand it, several can be open at once.
- A category auto-opens if the item already has a selection inside it (e.g. editing a chicken dish
  with Extra Sauce checked opens "Sauces & Gravy" automatically); each header shows "X/Y selected".
- A group not in the four buckets (e.g. a new one added from the Add-ons tab) falls into "Other" so
  nothing is ever hidden.

## 2026-07-04 · v0.0.2 — DoorDash-style menu: photo thumbnails + full add-ons manager

- Menu rows now show the real product photo (thumbnail, hover-to-edit) instead of a category emoji;
  falls back to a branded placeholder for items with no photo yet.
- Edit panel gained a lightweight photo gallery — reuse any image already used elsewhere on the menu
  with one click, instead of hunting for a URL every time.
- New "Add-ons" tab on the Menu page: full CRUD for modifier groups and their options — rename a
  group, toggle Required, set Min/Max, add/rename/reprice/delete options, add or retire whole groups.
- Usage click-through: each group shows "N items" — click it to jump to the Base tab pre-filtered to
  exactly the items offering that add-on (with a clear-filter chip).
- Backend: `useLiveModifiers()` hook + CRUD functions in `live-data.ts` read/write
  `modifier_groups`/`modifier_options` directly (schema from migration 0003); in local preview mode the
  same UI runs off the bundled JSON so it's fully clickable before the migration is applied. Added the
  two tables to the hand-maintained Supabase types mirror so both modes typecheck.
- Versioning: v0.0.2 (see VERSION / scripts/bump-version.mjs — bump before every push, per new convention).

## 2026-07-04 · Admin product editor — right-side panel to edit a product + its add-ons

- dine-central-hub Menu page: each row gets a pencil "Edit product" button that opens a right-side
  panel (Sheet) to edit the whole product — image (URL + live preview), name, description, base price,
  spice level, category, stock, Available and Best Seller toggles.
- Add-ons wiring: the panel lists all 19 modifier groups (from the spreadsheet import) as toggles;
  checking/unchecking assigns which add-on groups the item offers, and the row's Options badge updates
  on save. Saves write `modifier_groups` (+ all fields) to `menu_items` in live mode.
- Preview mode (`VITE_USE_STATIC_MENU`): edits update the on-screen list only, with a note that nothing
  is written to the DB yet — so the editor can be reviewed before the migration is applied.
- Admin MenuItem now carries `image` and `spiceLevel` (mapped from `menu_items` and the preview data).

## 2026-07-04 · Full menu import from the online-menu spreadsheet (variations + modifiers) — both apps

- Imported the complete online menu from `Jamaican_Kitchen_Online_Menu.xlsx`: 15 categories, 142 items
  (with size variations — SM/MED/LG and ½ lb / 1 lb — as their own items), full descriptions and prices.
- New modifier system: 19 modifier groups (sauce choices, side selection, drink choice, flavors, add-ons…)
  with 69 options, and each item linked to the groups it offers. Required groups enforce a choice.
- Storefront: items with options open an ItemCustomizeDialog that enforces each group's required/min/max
  rules and adds option upcharges (e.g. +$0.99 sauce) into the line price, cart, and tax total. A distinct
  cart line is kept per option combination; the cart and order payload carry the chosen modifiers.
- Items with no options keep the one-tap add/stepper. Reused existing photos for 134/142 items by dish
  match; the rest show a branded placeholder until real photos are added.
- Admin (dine-central-hub): the full menu appears automatically (reads the DB), plus a read-only "Options"
  column showing how many modifier groups each item carries.
- DB: migration `0003_full_menu.sql` adds `modifier_groups` / `modifier_options` tables (+ RLS mirroring
  menu_items), an `menu_items.modifier_groups` array, and reseeds all categories/items/modifiers. Legacy
  starter items/categories are marked unavailable (rows kept for order-history FKs). Idempotent upserts.
- Local preview: `VITE_USE_STATIC_MENU=true` renders the new menu in both apps from bundled data so it can
  be reviewed before the migration touches the shared Supabase. Flip off once the migration is applied.
- (pending — migration + deploy on approval)

## 2026-07-01 · Meeting follow-ups: catering tip, downloadable menu, order reviews, live Best Sellers

- Catering checkout: added an open tip field (quick 10/15/20% picks + custom $ amount), included in the total and in the urgent-request message.
- Storefront: "Download Menu" button back on the Order page — opens a printable snapshot with a disclaimer that prices/availability can change and may vary by location (previous version was removed for going stale; this one is explicit about that).
- Order confirmation: new "How was your order?" star-rating + optional comment prompt, submits to the reviews table (goes in as pending for staff approval).
- Best Sellers: homepage section now reads real items flagged "Best Seller" in the admin (via `menu_items.featured`) instead of a hardcoded list, falling back to the original 5 dishes until any are flagged. Admin Menu page got a star toggle per item to flag/unflag.
- User-facing: customers can tip on catering orders, download a menu snapshot, and rate their order after checkout.

## 2026-07-01 · Real catering checkout (24h+ direct pay, <24h urgent request) + distance delivery fees

- New CateringCheckoutDialog: same checkout pattern as online ordering, but with catering fields
  (event type, event date/time, guest count, pickup/delivery, delivery distance tier).
- If the event is 24+ hours out, checkout is instant and priced — goes through the same
  place_order RPC as online orders (real order, real total, "pay at pickup/delivery, cash or card").
- If the event is under 24 hours out, self-checkout is blocked; instead it submits an urgent
  request (flagged in the message) and tells the customer the catering team will call within the hour.
- New delivery-distance fee tiers for catering (Within 10 mi $15 / 10-20 mi $30 / 20+ mi $50) —
  manual tier selection for now, easy to retune or wire to an admin-editable version later.
- Fixed `placeOrder()` silently dropping the `fees` param (RPC always supported it).
- Fixed a real bug caught in testing: the confirmation screen never showed because clearing the
  cart on success unmounted the whole dialog (same root cause as an earlier online-checkout bug).
  Cart now clears only when the user dismisses the confirmation.
- User-facing: catering checkout is live and tested end-to-end (verified against the real DB —
  both the priced order and the urgent request paths actually write real rows).
- (aea9032)

## 2026-06-30 · Mobile cart FAB raised clear of chat launcher

- Mobile cart button moved from `bottom-24` to `bottom-40` so it no longer sits under the chat launcher's greeting bubble.
- (a3f723d..484a32a)

## 2026-06-27 · Finish all in-progress (requested) features

- Admin Settings now persist (localStorage): brand, taxes, notifications, integration keys.
- Live Orders: 24h retention — completed/cancelled orders archive off the live board after 24h, still reachable by status filter (= order history).
- Analytics: Online vs Catering channel split card.
- Admin "New catering order": menu-item picker (with qty + estimated total) and delivery toggle + address, folded into the request.
- Storefront catering form: Pickup/Delivery choice with a required delivery address.
- Admin Locations overview: "Best sellers here" — top items per store by quantity.
- Status page: the six requested items flipped to In production.
- User-facing: catering can now specify items + delivery; owners get per-store best sellers, channel split, and saved settings.
- (pending push)

## 2026-06-27 · Wallet: fully-local demo OTP sign-in

- Wallet sign-in is now a self-contained demo: enter name + email → a random 6-digit code is generated and shown on screen → verify → wallet opens. No Supabase, no email delivery.
- Demo session persists in `localStorage`; sign-out clears it.
- Logged-in view shows a sample wallet (balance + cashback transaction + one past order) so the rewards screen looks alive for demos.
- Real-auth paths (password / magic link) stay in `useAuth` for when the email domain is wired; swap `handleVerify` to `supabase.auth.verifyOtp` then.
- User-facing: testers log into the wallet with any email + the on-screen code, no inbox needed.

## 2026-06-24 04:30 IST · Admin wording: "Dine Central" (drop "Staff Operations Portal")

- Admin login subtitle "Staff Operations Portal" → "Dine Central" (under the JK wordmark → reads "Jamaican Kitchen Dine Central").
- Sidebar tagline "Connecticut · Chain Ops" → "Dine Central".
- (HEAD)


## 2026-06-23 18:45 IST · Storefront order UX + real delivery logos + admin brand

- **Quick Links panel removed** from the hero (both the desktop floating panel and the mobile inline grid) — was buggy; parked for later.
- **Add-to-Order quantity steppers**: menu cards (`MenuItemCard`) and home `BestSellers` now add on first click, then swap to a live `- N +` counter bound to real cart quantity; dropping to 0 reverts to "Add to Order". Buttons renamed "Add" -> "Add to Order", toasts say "added to your order".
- **Cart -> "Your Order"**: `CartSidebar` title, empty state, and Clear button reworded.
- **Location lock** (`LocationSelector`): once the order has items the pickup location is protected - shows a lock note and, on change attempt, an AlertDialog ("Clear order & switch" / "Keep my order") that clears the cart before switching so items can't mix across stores.
- **Real delivery logos**: replaced typed wordmarks with official brand SVGs bundled locally - green Uber Eats mark on black, red DoorDash chevron on white (`website/src/assets/{ubereats,doordash}-logo.svg`). No more broken external image.
- **Testimonials -> carousel**: review grid converted to an Embla carousel (`Testimonials`) with prev/next arrows, loop, responsive 1/2/3 per view.
- **Checkout pre-fill test button**: dashed "Pre-fill test details" button in `CheckoutDialog` fills name/phone/email/notes for quick test orders.
- **Admin rebrand** (`dine-central-hub`): login wordmark, sidebar icon mark, favicon set, and a real user avatar dropdown with sign-out in `TopBar`.
- User-facing: storefront ordering flow now behaves like a real cart; delivery section shows recognizable brand logos; admin looks branded.
- (9a11155)


## 2026-06-23 22:10 IST · Strip Lovable branding

- Removed the Lovable boilerplate `website/README.md`, replaced with a clean Jamaican Kitchen / BCON readme.
- Removed the dev-only `lovable-tagger` Vite plugin from `website/vite.config.ts` + `package.json` (and pruned the lockfile). Zero production impact — it only injected editor data-attrs in dev.
- Deleted the `dine-central-hub/.lovable/` planning-doc artifact.
- Note: NOT touched (functional deps, would need a migration, not branding): admin build runs on `@lovable.dev/vite-tanstack-config`; website chatbot still calls the Lovable AI gateway (`LOVABLE_API_KEY` in `supabase/functions/chat`). The rendered apps show no Lovable branding — `index.html`, meta/OG, favicon, and all components are Jamaican Kitchen.
- (00e407a)


## 2026-06-23 22:35 IST · Fix: order confirmation (thank-you) screen never showed

- **Bug:** placing an order called `clearCart()` immediately on success. The `CheckoutDialog` is mounted inside `CartSidebar`'s non-empty branch, so emptying the cart unmounted the dialog and the "Order Confirmed!" / order-number screen never appeared (order still placed fine, but no confirmation).
- **Fix:** defer `clearCart()` to when the confirmation dialog is dismissed (`onOpenChange` close) instead of on success, so the thank-you screen with the order number (`JK-XXXXX`) stays up until the customer clicks Done.
- (5507fee)


## 2026-06-23 22:55 IST · Fix: cart not clearing after Done on order confirmation

- Follow-up to the confirmation fix: the **Done** button calls `setOpen(false)` programmatically, which (in a controlled Radix Dialog) does NOT fire `onOpenChange` — so the deferred `clearCart()` never ran and the placed order's items lingered in the cart.
- **Fix:** `clearCart()` directly in the Done handler, and also `setCartOpen(false)` so the cart drawer closes for a clean finish after an order. Verified live: order `JK-71A2E` placed on prod, confirmation showed the number, Done cleared the cart and closed the drawer.
- (c906057)


## 2026-06-24 00:25 IST · Proper thank-you pages (order + catering) + "Add" button

- **Order thank-you PAGE** (`/order-confirmation`): replaced the small confirmation modal with a real page. On placing an order, the cart snapshots the order into `CartContext.lastOrder`, clears, and navigates to the page, which shows: the order number, every item ordered (image, qty, line total), subtotal/tax/total, the pickup location (address + phone), a numbered "What happens next" (preparing → show number at counter → pay at pickup), and Order-more / Home CTAs. No more landing on an empty cart.
- **Catering confirmation**: the catering form (`EventBookingForm`) now shows a proper success card after submit — event summary (type, date, guests, location) + a "What happens next" (review → 24h quote → finalize) instead of just a toast. Still writes to `catering_requests` (→ admin Catering page).
- **Button label**: menu + best-seller cards now say "Add" (was "Add to Order"); becomes the `- N +` stepper once added.
- (HEAD)


## 2026-06-22 17:12 IST · Responsive/design pass across all pages

- **Duplicate X fixed**: the Sheet primitive already renders a close button; removed the extra custom X in the mobile nav drawer and the cart drawer (was showing two crosses).
- **Spice pills**: `SpiceLevelBadge` was `flex` (block) so it stretched full-width in the cart; now `inline-flex` (sizes to content) everywhere.
- **Hero Quick Links overlap (mobile)**: the floating panel is now desktop-only (`hidden lg:block`); on mobile/tablet the quick links render inline as a 2-col grid below the CTAs — no more overlap with the heading.
- **Chatbot**: fixed `w-[360px] h-[500px]` → `w-[calc(100vw-2rem)] sm:w-[360px]`, `h-[min(70vh,500px)]`; launcher lowered to z-40 so it sits under the cart drawer.
- **DeliveryPartners**: DoorDash was showing the Uber Eats logo (copy-paste bug) → now a styled DoorDash wordmark; tile min-width made responsive (no 360px overflow).
- **Category scroll**: replaced hardcoded `headerOffset=250` (mis-scrolled on mobile) with `scroll-margin-top` + `scrollIntoView` on Order + Catering.
- **Grids/padding**: Order menu grid `1→sm:2→lg:3`; Locations `md:pt-28`→`md:pt-24`; CheckoutDialog phone/email stack on mobile.
- Audited all pages/components (general-purpose agent) for overflow, overlap, header-offset, stacking, image distortion — no horizontal-overflow bugs remain.


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
