# Jamaican Kitchen — Brand (from Brand Book v2.0)

Source: `Jamaican_Kitchen_Brand_Book.pdf` (Viscabulary, 2026, v2.0). Full text in `brand/book/text.md`.

## Colour
| Name | HEX | RGB | HSL (tokens) |
|---|---|---|---|
| Flag Gold | `#FED100` | 254·209·0 | `49 100% 50%` → `--primary` |
| Flag Green | `#009B3A` | 0·155·58 | `142 100% 30%` → `--secondary`, `--accent` |
| Black | `#0E0E0E` | 14·14·14 | `0 0% 5%` → `--foreground` |
| Off-white bg | ~`#F5F5F2` | — | `60 9% 96%` → `--background` |

Usage proportion: **black-dominant, green secondary, gold accent**. No orange (removed from tokens).

## Typography — four-font system
| Role | Brand font | Stand-in used (free) | Token |
|---|---|---|---|
| Display / hero | **Tomato Ketchup** | Fredoka | `--font-display` / `font-display` |
| Headings / nav | **Geomanist** | Poppins | `--font-heading` / `font-heading` |
| Body / long-form | **Avenir** | Nunito Sans | `--font-body` / `font-sans` |
| Buttons / UI | **SF Pro** | system stack (`-apple-system…`) | `--font-ui` / `font-ui` |

**Licensed fonts not yet supplied** — Geomanist (Atipo), Avenir (Linotype), Tomato Ketchup, SF Pro (Apple). Drop the font files in and update the `--font-*` vars in `src/index.css` + the Google Fonts `<link>` in `index.html` to swap for an exact match.

Type scale: Display 54pt · H1 Geomanist Bold 36 · H2 Geomanist Medium 26 · Body Avenir 16 · Caption 12 · Button SF Pro Semibold 15.

## Buttons
Pill — `rounded-full`, SF Pro Semibold (applied in `src/components/ui/button.tsx`).

## Logo
- Primary: outlined wordmark + thin keyline (`src/assets/logo.png`).
- Secondary: **JK monogram** for favicon / app icon / avatars (`public/favicon.*`, `brand/jamaican-kitchen-icon.png`).
- Don't: stretch, condense, rotate, recolour, add effects. No palm trees / tourist stereotypes.

## Voice
Warm · Bold · Playful · Clear. Signature phrase: **"Bold Jamaican Flavor"**.
