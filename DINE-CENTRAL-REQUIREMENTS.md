# Dine Central — Data & Wiring Requirements

**Dine Central** (`dine-central-hub`) is the single source of truth for the entire system.
The website (`jamaican-kitchen`) is a **read-only storefront** that syncs everything from Dine
Central's Supabase backend. There is **no website admin** — any staff/admin entry on the website
must redirect to Dine Central's login (`dine-central-hub.vercel.app/login`).

> Scope note: items marked **[IN SOW]** are contracted (see `SCOPE.md`). Items marked
> **[CHANGE ORDER]** are beyond the signed SOW and need client sign-off + separate pricing before
> we build them. Don't silently absorb change-order work.

---

## 1. Architecture principle

```
            ┌─────────────────────────────┐
            │   DINE CENTRAL (admin)      │  ← staff edit EVERYTHING here
            │   menu, add-ons, stock,     │
            │   prices, images, coupons,  │
            │   reviews, locations…       │
            └──────────────┬──────────────┘
                           │  Supabase (Postgres + Realtime + Storage)
                           │  one source of truth
            ┌──────────────▼──────────────┐
            │   WEBSITE (storefront)      │  ← read-only, just renders + places orders
            │   no admin, no editing      │
            └─────────────────────────────┘
```

- Everything the customer sees (menu, prices, photos, availability, best-sellers, reviews, coupons,
  catering menu, locations) is **owned in Dine Central** and **synced to the website**.
- The website never edits data — it reads, and it writes only via the `place_order` RPC and the
  catering/contact intake forms.
- **No website admin.** Today the website has zero auth (good). Rule going forward: if any "Admin"/
  staff link ever appears in the website, it routes to `dine-central-hub.vercel.app/login`. Customer
  "Login / Account Management" (a SOW website item) is a *separate* customer-facing account and is
  NOT the staff admin.

---

## 2. Current state (what's real today)

| Area | Status |
|---|---|
| Menu (categories + items) | DB-driven from `menu_categories` / `menu_items`, **with a static fallback** in `website/src/data/menuData.ts` |
| Locations | DB-driven (`locations`) with static fallback |
| **Best Sellers** (home) | ❌ **Hardcoded** in `BestSellers.tsx` — not synced |
| **Testimonials / reviews** | ❌ **Hardcoded** in `Testimonials.tsx` — no DB |
| **Catering menu** | ❌ **100% static** in `cateringData.ts` — no DB, no admin |
| Add-ons / modifiers | ❌ No definition table; only an opaque `order_items.modifiers` JSON captured at order time |
| Per-location availability/stock | ❌ Menu is **global**; one `stock` counter shared by all 6 locations |
| Images | URL text in `menu_items.image` (Unsplash today); **no upload UI**, no Storage bucket |
| Admin Menu edits | ❌ **Do not persist** (no Supabase writes on the Menu page). Only Inventory `stock` saves. No "add item", no category CRUD, no image upload |
| Coupons | ❌ None |
| Reviews | ❌ None |

---

## 3. Required data model

### 3.1 Menu categories  **[IN SOW]**
Already exists. Confirm we can **create/edit/reorder/disable** categories from Dine Central
(currently seed-only). Fields: `name, slug, description, sort_order, active`.

### 3.2 Menu items  **[IN SOW]**
Exists, but admin CRUD must be wired (see §5). Fields per item:
- **Identity:** name, slug, description, category
- **Pricing:** base_price (per-location override → §3.5)
- **Image:** primary photo (→ §3.8); optionally a gallery
- **Heat:** spice_level (mild / medium / hot)
- **Availability:** `available` toggle + stock-driven auto-availability (→ §3.4)
- **Stock:** per location (→ §3.4 / §3.5)
- **Sort order** within category
- **Recommended additions to collect/store:** dietary tags (veg / vegan / GF / contains-nuts /
  halal…), prep/lead time, calorie or portion note, "featured / best-seller" flag (so Best Sellers
  becomes DB-driven instead of hardcoded)

### 3.3 Add-ons / modifiers  **[CHANGE ORDER — recommend confirming]**
> Today nothing defines add-ons at the menu level. This needs new tables. "Menu Management" in the
> SOW covers *items, descriptions, pricing* — structured add-ons are an enhancement; confirm before building.

Proposed model:
- **`modifier_groups`** — e.g. "Choose your side", "Spice level", "Extras": `name, min_select,
  max_select, required (bool)`
- **`modifier_options`** — options within a group: `group_id, name, price_delta, available, sort_order`
- **`menu_item_modifier_groups`** — join: which groups attach to which item (+ order)
- Order capture already supports this via `order_items.modifiers` (JSON), so the ordering side is ready.

Per item we'd then know: which option groups apply, each option's name + extra price, required vs
optional, and how many can be chosen.

### 3.4 Inventory, stock & availability rules  **[IN SOW]**
Define exactly **when an item shows vs is "86'd" (out)**:
- **In stock + `available = true`** → shown, orderable.
- **`available = false`** (manual toggle by staff) → hidden/greyed everywhere, regardless of stock.
- **stock ≤ 0** → auto-marked out (show "Sold out", not orderable). Optional: auto-flip back when
  restocked.
- **stock ≤ `low_stock_threshold`** → low-stock alert in Dine Central (no customer effect).
- Optional **scheduled availability** (e.g. breakfast items, weekend-only) — confirm if wanted.
- Per-location: stock and the out/in state are **per location** (→ §3.5), so an item can be sold out
  in Vernon but available in Bristol.

### 3.5 Per-location controls  **[IN SOW — "localized controls" in §C]**
Today menu is global. To support 6 locations properly, add a **`location_menu_items`** join:
- `location_id, menu_item_id, available, price_override (nullable), stock, low_stock_threshold`
- Dine Central: edit globally OR per location; filter inventory/menu by location or all-6 aggregate.
- Website `Order Now` already picks a pickup location → it should fetch that location's
  availability/price/stock.

### 3.6 Reviews & ratings  **[CHANGE ORDER]**
> No review system exists; testimonials are hardcoded. A real review system is beyond the SOW.

If approved, proposed **`reviews`** table: `id, customer_name, rating (1–5), title, body,
location_id (nullable), menu_item_id (nullable), status (pending/approved/rejected), source
(web/google/manual), created_at`. Plus:
- Website: a submit-a-review form + display approved reviews (replaces hardcoded Testimonials).
- Dine Central: moderation queue (approve/reject), so only vetted reviews show.
- Decision needed: customer-submitted (needs moderation/anti-spam) vs staff-entered/imported only.

### 3.7 Coupons / promotions  **[CHANGE ORDER — explicitly requested]**
> Not in the SOW. Client asked for it → treat as a priced add-on.

Proposed **`coupons`** table: `code, description, discount_type (percent/fixed), discount_value,
min_subtotal, max_discount, starts_at, ends_at, usage_limit_total, usage_limit_per_customer,
active, applies_to (all / category / item / location)`. Plus optional `coupon_redemptions` for
usage tracking.
- Website checkout: a "promo code" field → validate against Dine Central → apply discount to the
  order total (the `orders` table would need a `discount` + `coupon_code` column).
- Dine Central: create/expire coupons, see redemptions.

### 3.8 Images  **[IN SOW (part of brand/menu)]**
Today images are pasted URLs (Unsplash). For a client-owned product they should manage their own
photos:
- Add a **Supabase Storage bucket** (e.g. `menu-images`) + an **upload control** in Dine Central's
  item editor; store the resulting URL in `menu_items.image`.
- Spec for the brand to deliver photos: see §6.

---

## 4. What must become DB-driven (kill the hardcoded bits)
1. **Best Sellers** → add a `featured` flag on `menu_items`; website renders featured items.
2. **Testimonials** → replace with the reviews system (§3.6) or, minimally, a small DB-backed list.
3. **Catering menu** → move `cateringData.ts` into DB tables so Dine Central can manage catering
   items/portions/prices (mirror of the main menu, with small/large tray pricing).
4. Remove the static menu **fallback** reliance once the DB menu is fully populated (keep as safety).

---

## 5. Dine Central wiring tasks (the build)
- **Persist menu edits** — the Menu page currently doesn't write to Supabase. Wire name / description
  / price / category / spice / available / sort to `menu_items` updates. **[IN SOW]**
- **Add / delete items and categories** (the "New item" button is a no-op today). **[IN SOW]**
- **Image upload** to Storage. **[IN SOW]**
- **Per-location availability/price/stock** editor + aggregate view. **[IN SOW]**
- **Add-on / modifier manager** (groups + options + attach to items). **[CHANGE ORDER]**
- **Reviews moderation** queue. **[CHANGE ORDER]**
- **Coupons** manager + checkout validation. **[CHANGE ORDER]**
- **RBAC** finish: Owner / Admin / **Shop-Manager (location-restricted)**, ≤10 users (enum currently
  `owner|manager|staff|developer`; map to SOW tiers + enforce location scoping). **[IN SOW]**

## 6. What we need FROM THE BRAND to wire it up (intake checklist)
Collect this from Jamaican Kitchen before/while wiring:

**Per menu item:**
- Exact item name + short description
- Category it belongs to
- Price (and any per-location price differences)
- High-res photo (square, ≥ 1000×1000px, on-brand; one per item, more if gallery)
- Spice level (mild/medium/hot)
- Add-ons/extras for that item + each add-on's price, and whether required or optional, and how many
  can be chosen (e.g. "pick 1 side", "add extra plantain +$2")
- Dietary tags (veg/vegan/GF/contains-nuts/halal, etc.)
- Starting stock + the low-stock threshold (when to alert)
- Whether it's a "best seller / featured" item

**Per location (×6):**
- Which items it actually serves (availability differs by location?)
- Any location-specific prices
- Address, phone, hours (already seeded — confirm correct)

**Catering:**
- Catering item list + portion sizes (small/large tray) + prices
- Lead-time / minimum guest rules

**Coupons (if approved):**
- The promo codes, discount amount/%, validity dates, min order, usage limits, which items/locations

**Reviews (if approved):**
- Source: collect new ones on the site, import existing Google reviews, or staff-curated?

**Brand assets:**
- Logo files (have), licensed fonts (pending per brand book), brand color confirmations, any
  photography/style guidelines for the food images.

**Accounts / access:**
- The up-to-10 staff who need logins + which tier (Owner / Admin / Shop-Manager) + which location(s)
  each Shop-Manager is restricted to.

---

## 7. Open decisions for the client
1. Add-ons/modifiers — build the structured system? **[change order]**
2. Reviews — customer-submitted + moderation, or staff/Google-imported only? **[change order]**
3. Coupons — confirm scope + rules. **[change order]**
4. Per-location menu differences — do items/prices actually differ by location, or is the menu
   identical everywhere (affects how much per-location wiring is needed)?
5. Image hosting — upload to our Storage (recommended) vs client provides hosted URLs.
