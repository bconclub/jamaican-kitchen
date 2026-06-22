# Changelog

## 2026-06-22 14:17 IST · Website header redesign, nav pages, favicon

- **Header redesigned** — replaced the broken oversized header (h-48, tiny floating logo) with a clean h-16/h-20 bar: logo left, real desktop nav (Order Online, Catering, Locations, More dropdown), Order Now + cart right, mobile hamburger drawer.
- Adjusted page top-offsets and sticky positions on Order/Catering/Locations/Hero to match the shorter header.
- **All nav items now wired** — created real pages: FAQ, Contact Us, About Us, Our Story, Rewards/Login, Download App. Added routes in App.tsx. No more 404s.
- **Contact form** posts to `contact_messages` (backend table) via `submitContactMessage`.
- Fixed hero "Contact Us" quick link (pointed to /faq → now /contact).
- **User-facing:** removed Lovable favicon, replaced with the Jamaican Kitchen logo; real page titles/SEO.
- New `PageLayout` component for consistent content pages.
- (pending) `contact_messages` table apply blocked on browser session — to run.
