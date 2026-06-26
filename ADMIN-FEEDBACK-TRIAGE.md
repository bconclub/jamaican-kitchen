# Admin Dashboard Feedback — Triage & Answers

Reviewed against `SCOPE.md` (the signed SOW) and the 23-Jun MoM. Each item is one of:
**🐞 Bug** (fix, in scope) · **✅ In scope** (build) · **➕ Add-on** (change order, needs client sign-off) ·
**❓ Answer** (a question, no build) · **✔️ Already addressed**.

---

## Operate

### Overview
- **Separate Online vs Catering overview** — ✅ In scope-ish (channel filter on the overview). Small. Recommend doing.

### Live Orders
- **Timer keeps running after "Ready"** — 🐞 **FIXED.** The prep timer now ticks only while New/Accepted/Preparing; it freezes at the elapsed time once an order is Ready or beyond.
- **How long do Live Orders stay visible?** — ❓ Today the feed shows the recent order stream (no auto-purge); the dashboard KPIs are date-windowed. We can set an explicit retention/auto-archive rule (e.g. active orders stay; completed drop off the live board after X hours and move to history). Need your preferred rule.
- **Where is past-order / transaction history + refunds?** — ✅ In scope (Analytics & Reporting). A dedicated **Order History** view (searchable by date) is a defined in-scope piece. **Refund *processing*** depends on the payment gateway, which is client-provided (SOW exclusion) → that part is ➕ add-on.

### Catering
- **Website catering shows in Live Orders, not Catering** — ✔️ Addressed for the website: catering now has its **own cart + quote flow** that lands in the **Catering** board (not Live Orders). Please re-test. (If you meant something else, flag it.)
- **New catering order: no delivery address** — ✅ In scope. Add delivery + address to the admin "New catering order" form.
- **New catering order: no menu-item selection** — ✅ In scope-ish. Add item picker to the admin catering order.
- **Completed catering retention + history/search** — ✅ In scope (history/search) — pair with the Order History piece. Need a retention rule.

### Messages
- **Why are catering requests in Messages?** — ❓ Messages is a **unified inbound inbox** (contact-form messages + catering inquiries) so staff see all customer communication in one place. Catering also appears on the **Catering board** as a pipeline. If you'd rather keep them fully separate, we can drop catering out of Messages — your call.

### Delivery
- **What is it?** — ❓ Per the SOW it's **"status management for active dispatches"** — tracking delivery orders through their stages. The current map is a placeholder; live driver GPS is not in the SOW (would be ➕ add-on). Confirms what you want here.

---

## Manage

### Menu
- **Category & Item creation (assign item to category)** — ✅ In scope. Finishing Menu CRUD (the "New item" button is currently a no-op; menu edits don't persist yet). This is core in-scope wiring.
- **Separate Online vs Catering menu management** — ✅ In scope-ish. Catering menu is currently static; wiring it to the DB + separating the two is a defined piece.
- **Modifiers (size/sauce/spice/add-ons, required-optional, single-multi, price adj)** — ➕ **Add-on.** Not in the SOW (Menu = items, descriptions, pricing). This is a full modifier system (new tables + admin UI + checkout). Needs sign-off + pricing.
- **Time-based availability (breakfast/lunch/dinner)** — ➕ Add-on (not in SOW).
- **Per-location online-ordering hours** — ➕ Add-on / enhancement (per-location scheduling).
- **One menu for Website + Mobile App** — ❓ There's already a per-channel mechanism (`channel_overrides` web/app); the app isn't built yet, so today it's effectively one menu. No action needed now.
- **Master Menu (5 locations share, 1 separate; per-location stock)** — ✅/➕ Mixed. The **per-location data model** (so stock/availability/price can differ by location) is in-scope multi-location work. The **master-menu auto-sync** convenience layer is an enhancement. Recommend building the per-location foundation first.

### Inventory
- **How does it work + connect to Menu?** — ❓ Inventory tracks **stock per item** (`menu_items.stock`) with a low-stock threshold. When stock hits 0 the item shows **Sold out** on the storefront; staff can also toggle availability. It's the same items as the Menu, viewed through a stock lens. (True per-location stock is part of the per-location work above.)

### Customers
- **How does a customer become VIP?** — ❓ There's **no real VIP rule yet** — it's a display label. We need a rule (e.g. lifetime spend ≥ $X, or ≥ N orders). Tell us the threshold and we'll wire it.
- **Does selecting a customer show a full profile (order history, transactions)?** — ✅ In scope-ish. A **customer detail/profile** with order history is a reasonable build; today it's mostly a list.

### Payments
- No suggestion. ❓ Note: the payment **gateway** itself is client-provided (SOW exclusion); the dashboard shows transaction/gateway **overview** only.

---

## Chain

### Location
- **What's it for?** — ❓ Manages the **6 locations** (address, hours, phone, status, channels). The location cards are how you view/edit each store and drive the multi-location filtering across the dashboard.

### Staff & Access Control
- **Payroll vs user-creation?** — ❓ **Access Control** is the SOW deliverable: it creates **login users + roles** (Owner / Admin / Shop-Manager) and their permissions. **Staff** is a **roster** (names, positions, wages) — informational, NOT a payroll system (payroll isn't in the SOW). The intended link: a Staff member can be given a login via Access Control. We can tighten that connection if you want.

---

## Analytics
- **Custom date range** — ✅ In scope (small add to existing filters).
- **Separate Online vs Catering analytics** — ✅ In scope-ish (channel split).

## Reports
- **Custom date range** — ✅ In scope (small).
- **Website Traffic Report** — ➕ Add-on. Needs a web-analytics integration (e.g. GA) + is marketing-oriented (marketing module = add-on per the MoM).

---

## Setup
- **System Flow / Integrations / Settings — what are they?** — ❓
  - **System Flow**: a visual end-to-end diagram of how website orders flow into the dashboard (orientation/training aid).
  - **Integrations**: third-party connections (e.g. Uber Eats / DoorDash). Most of these need client-paid partner accounts/APIs → largely ➕ add-on.
  - **Settings**: global config (brand, taxes, notifications). Currently display-only; persisting it is ✅ in-scope wiring.

---

## Recommended in-scope build order (pending your greenlight)
1. **Menu CRUD that persists** — create/edit/delete items + categories, assign to category, image upload. (Core; currently a no-op.)
2. **Order History** (searchable by date) + completed-order retention rule.
3. **Per-location menu/stock foundation** (so availability/price can differ per location) — unlocks Master Menu later.
4. **Admin catering order**: add item picker + delivery address.
5. **Custom date ranges** on Analytics & Reports; **channel split** (online vs catering) on Overview/Analytics.
6. **Customer profile** with order history; define the **VIP rule**.
7. **Settings persistence.**

## Change-order items (need client sign-off + pricing)
- Modifiers system · Time-based availability · Per-location online hours · Master-menu auto-sync · Website traffic report · Live driver GPS · Refund processing (gateway) · Marketing/CS modules.
