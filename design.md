# Projects Page — Figma Build Spec

A build-ready spec for the Projects page (carousel + card grid), measured from the rendered app at an iPhone 14 Pro viewport (390×844, @2x). Every value below is a **read computed style**, not inferred from source — where the two could plausibly diverge (e.g. a Tailwind utility class vs. the global type-scale rule), the rendered value is what's recorded.

This is a page-level companion to [`design-system.md`](./design-system.md), which owns the full token set (all 12 steps × 6 colour families × light/dark, the full 10-step type scale, spacing, radius). This file only inlines the specific values this one page actually uses, resolved to concrete px/hex, so you're not cross-referencing two docs while building. **When the two disagree on anything, `design-system.md` is the source of truth** — file an issue rather than trusting this doc's copy.

**Platform note for Figma's font-matching**: the product typeface is **not Inter**. Headlines are **Fraunces** (serif, semibold, default axis — not Google Fonts' "soft" preset), body/UI text is **Nunito Sans**. Both are free on Google Fonts. If Figma can't resolve a font by that exact name, search "Fraunces" / "Nunito Sans" in the font picker rather than falling back to a default.

---

## 1. Frame

| Property | Value |
|---|---|
| Width | **390px** (iPhone 14 Pro — also test 375px and 430px, the other common iOS widths; layout is fluid, not fixed-width) |
| Background | `#f8faf8` (olive/2) |
| Content column padding | **16px** left/right, applied to a `<main>` that otherwise spans the frame |
| Safe area | Content ends ~96px above the frame bottom to clear the floating tab bar (see §6) |

---

## 2. Section-by-section

### 2.1 App header (shared chrome — same on every page, not specific to Projects)

| Element | Font | Size | Weight | Line-height | Letter-spacing | Colour | Position |
|---|---|---|---|---|---|---|---|
| "Woolgaze" (h1) | Fraunces | **32px** | 700 | 42.7px | −0.64px | `#1d211c` (olive/12) | x:16 y:16, 358×43 |
| Subtitle ("What you're making now") | Nunito Sans | 14px | 400 | 20px | normal | `#60655f` (olive/11) | x:16 y:59, 358×20 |

No logo/icon — just the wordmark, center-aligned as a block, left-aligned text within it. Header has `padding-top: max(16px, safe-area-inset-top)`.

### 2.2 Page header

| Element | Spec |
|---|---|
| "Projects" (h2) | Fraunces, **24px**, weight 600, line-height 28.8px, letter-spacing −0.36px, `#1d211c`. Position x:16 y:102, 94×29 (hugs content) |
| "New project" button | Capsule button, primary style — see §5.1. Position x:240 y:95, 134×44 |

Row is `flex`, `justify-content: space-between`, `align-items: center`, 12px gap, wraps on narrow widths.

### 2.3 "In progress" carousel

Only rendered when ≥1 project has status `in-progress`; shows at most the 3 most-recently-updated.

| Element | Spec |
|---|---|
| "In progress" (h3) | Fraunces, 20px, weight 600, line-height 25px, letter-spacing −0.2px, `#1d211c`. x:16 y:155, 358×25. 8px margin below. |
| Scroll region | Horizontal, `gap: 12px`. **Left edge flush with the 16px content margin** (do not inset); **right edge bleeds past the frame edge** — the region's own right padding is 16px but its container has a −16px right margin canceling the frame's padding, so an unscrolled card gets visibly clipped at the frame's right edge. This clipping *is* the "there's more to scroll" affordance — don't add arrows or dots. |
| Card width | **258px** (≈ 72% of the 358px content column, capped at 288px/18rem on wider frames) |
| Card height | 285px (hugs content) |

**Carousel card anatomy** (top → bottom, see §5.2 for the reusable component):
1. Image, 256×192 (4:3), full bleed to the card's rounded corners at the top
2. 12px padding (all sides) below the image containing:
   - Title: Nunito Sans, 16px, weight 700, single line, truncate with ellipsis, 232×26
   - 8px gap
   - Progress bar: 232×10 track (see §5.3)
   - 4px gap
   - Percentage label: Nunito Sans, 14px, weight 400, `#60655f`, e.g. "41%"

If the project's counter has no target (can't compute a percentage), the percentage row is replaced by plain counter text ("12 rows") in the same style — no progress bar shown.

### 2.4 Search + filter row

| Element | Spec |
|---|---|
| Search input | Pill, 44px tall, flex-grow (259px in this measurement, fills remaining width). Placeholder "Search projects", a search icon at x+12 inset. Background: 85% `--secondary` (olive/3, `#eff1ef`) + 15% `--card` (olive/1, `#fcfdfc`) — a very light neutral fill, not pure white. Border: none, radius 12px. |
| Filter button | Outline capsule button, 44px tall × 91px (hugs "Filter" + icon). When ≥1 filter is active, a small count badge appears inline after the label — a tiny pill, `mint/4` fill with `mint/12` text, same formula as the primary button. |
| Row gap | 8px between search and filter |

### 2.5 "All projects" grid

| Element | Spec |
|---|---|
| "All projects" (h3) | Fraunces, 20px/600/−0.2px, `#1d211c`, with a count ("12") right-aligned on the same row in Nunito Sans 14px `#60655f` tabular figures. 16px top margin, 8px bottom margin. |
| Grid | **2 columns**, `gap: 12px` both axes. Content column width 358px → each card **173px** wide. |

**Grid card anatomy** (top → bottom, see §5.2):
1. Image, 171×171 (1:1 square), full bleed to the card's rounded top corners
2. Title: Nunito Sans, 16px, weight 700, single line, truncate, **10px padding** on all sides (not 12px like the carousel — the square card is tighter)

That's it — **no status badge, no tags, no counter text**. This is deliberately the minimal version; full project info lives on the detail page one tap away.

### 2.6 Floating counter bar (conditional — not shown in the base screenshots)

Appears only when a project is marked active (status `in-progress` and opened at least once) and the user hasn't dismissed it. It's a separate component (`CounterBar`) — see the live app or `src/components/counter-bar.jsx` if you need to mock this state; out of scope for this spec's measurements.

---

## 3. Shared chrome visible on this page

### 3.1 Tab bar (bottom navigation — same on every page)

| Property | Value |
|---|---|
| Position | Floating, inset 14px from left/right, bottom-anchored with safe-area padding |
| Size | 361×63 (fills the inset width) |
| Background | `#fcfdfc` (olive/1) in the default **flat** finish; translucent + blurred in the **glass** finish (see design-system.md §5) |
| Border | 1px, `#cccfcc` (olive/7) |
| Radius | Fully rounded (pill) |
| Items | 5 icon+label buttons, equal width (72px each), icon above label |
| Active item | Icon + label coloured `#027864` (mint/11 — the `--link` token); inactive items use `#60655f` (olive/11, muted-foreground) |
| Label | Nunito Sans, 12px, weight 700 active / 400 inactive, line-height 16px |

---

## 4. Colour reference (resolved values used on this page, light mode)

Full system — all 12 steps, all 6 families, dark-mode pairs — is in `design-system.md`. This is just what's actually on-screen here, named to match that doc's token vocabulary so a Figma variable collection can mirror it 1:1.

| Token | Hex | Used for |
|---|---|---|
| `olive/1` | `#fcfdfc` | Card/tab-bar background |
| `olive/2` | `#f8faf8` | Page background |
| `olive/3` | `#eff1ef` | Progress track, subtle fills |
| `olive/7` | `#cccfcc` | Borders |
| `olive/11` | `#60655f` | Muted/secondary text |
| `olive/12` | `#1d211c` | Primary text |
| `mint/4` | `#c8f4e9` | Primary button fill ("New project") |
| `mint/11` | `#027864` | Active tab-bar item, link text |
| `mint/12` | `#16433c` | Primary button text |
| `orange/11` | `#cc4e00` | Progress-bar fill — deliberately step 11, not the button-formula's usual step 4/12 (`src/features/ProjectsView.jsx` has the inline rationale): step 4 is too pale and step 12 is a dark text-ink shade, neither reads as orange for a thin fill |

Card/grid cover images are **not** a fixed colour — each is a generated two-tone diagonal (135°) gradient, hue derived from the project's id. Don't pick one fixed pair for the Figma mock; use a handful of varied sample gradients (e.g. pink→orange, green→blue, purple→pink) across the grid so it reads as "real photos," not one repeated swatch.

---

## 5. Reusable components

### 5.1 Capsule button (primary variant)

Pill shape (`border-radius: 9999px`), height 44px, horizontal padding 16px, vertical padding 8px, 8px gap between icon and label. Label: Nunito Sans 14px weight 500, letter-spacing 0.14px. Primary fill `mint/4` (`#c8f4e9`), text `mint/12` (`#16433c`). Outline variant: same shape/type, transparent-to-`olive/1` fill, 1px `olive/7` border, text `olive/12`.

### 5.2 Card (carousel + grid share this shell)

- Radius: **28px** (`--radius-xl`)
- Border: 1px, `olive/7`
- Background: `olive/1` (shows only as a sliver — the image fills almost the whole card)
- Image: full-bleed to the card's top corners only (the card's own radius clips it — don't separately round the image's top corners, round the card and let `overflow: hidden` clip it)
- Caption area: solid `olive/1` background, **not** a scrim over the image — title/progress sit below the image in ordinary text, never overlaid on it (a generated gradient has no predictable luminance, so there's no overlay opacity that could guarantee legible contrast against every possible hue)

Carousel variant: 4:3 image, 12px caption padding, includes progress bar + percentage.
Grid variant: 1:1 image, 10px caption padding, title only.

### 5.3 Progress bar

- Track: full width, 10px tall, radius pill, background `olive/3`, 1px border `olive/7`
- Fill: inset to the track (effectively ~8px tall accounting for the border), radius pill, background `orange/11` (`#cc4e00`) — scales horizontally by percentage, left-aligned
- Percentage label sits below the bar, not inside/overlapping it: Nunito Sans 14px, `olive/11`

---

## 6. States not covered above

These exist in the live app but weren't re-measured for this spec — note them as "build if needed," not "already speced":
- **Empty state** (zero projects): a single centered card with italic muted text, no carousel, no grid
- **Search/filter active**: grid re-filters live; carousel is deliberately unaffected by search (a "continue making" rail, not part of the searchable archive)
- **Filter sheet / New project sheet**: bottom sheets with a drag grabber — see design-system.md §5 for the shared dialog/sheet treatment (iOS-shaped, flat or glass finish)
- **Dark mode**: swap every hex above for its `design-system.md`-documented dark pair (e.g. `olive/2` → `#181917`); nothing in this page's structure changes, only token values
- **Glass finish**: cards/tab-bar/sheets become translucent + blurred instead of opaque — see design-system.md §5

---

## 7. What's deliberately *not* here

- No photo-upload feature exists — the "preview image" is a placeholder gradient, not real project photos. If you mock this in Figma with real stock photos, that's a step ahead of the current app, not a spec mismatch.
- No per-card status badge or tags — removed on purpose from the redesign; still shown in full on the project detail page.
