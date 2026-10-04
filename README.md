# 🧶 Woolgaze

A cozy crochet companion for your phone. Track projects with stitch and row
counters, manage your yarn stash by scanning ball-band barcodes, read mosaic
crochet charts row by row, keep a pattern library from any source, and share
finished projects to Ravelry.

Built as a **progressive web app (PWA)**: no app store needed. Open it in your
phone's browser, choose *Add to Home Screen*, and it installs like a native
app and works offline. All of your data stays on your device.

## Features

### 🧺 Projects & the counter bar
The counter for whatever you're making **floats above the tab bar** rather
than sitting at the top of the page, so it stays reachable however far you
scroll. Advancing a row costs zero taps and no navigation, because the app
gets picked up mid-row with a hook in the other hand.

- **Condensed** is the count and its two buttons. **Expanded** adds the
  target and progress, the project's other counters, and Reset / Open
  project — the things that would otherwise cost a trip into the project.
  The bar remembers which state you left it in.
- **Dismiss** lives in the expanded panel, deliberately not beside the `+`,
  where a mis-tap would hide the thing you're using. Dismissing is never a
  dead end: a *Show counter* button sits above the list, and opening the
  project again brings the bar back.
- The project you last opened becomes the one on the hook (only if it's in
  progress — finishing something doesn't hijack the counter).
- The list shows **every** project, with the one on the hook marked, plus
  **search** and a **Filter** sheet for status and tags. The filter button
  carries a count so an active filter is never invisible.
- Each project tracks its pattern, hook size, status, tags, notes and yarn.
  Every project starts with **Rows** and **Stitches** counters; add as many
  more as you like (pattern repeats, colour changes…), each with an optional
  target and a progress bar.
- Counter buttons are oversized for mid-stitch tapping, with gentle haptic
  feedback and screen-reader announcements of every count.
- Statuses use crochet's own vocabulary: Planned, In progress, Finished,
  **Hibernating** (paused) and **Frogged** (ripped back) — the words Ravelry
  and the craft already use, rather than generic project-management ones.
- **Expected stitch counts.** Give a counter a starting stitch count and an
  optional change per row (6 for an increase round, −6 for a decrease round)
  and it tells you what you should be counting to on the row you're on —
  "≈ 12 sts this row" — in the counter and in the floating bar's expanded
  panel, and reads it aloud alongside the row count. Catches a miscount
  before it becomes six rows of frogging.
- **Checkpoints.** Save a photo and a note pinned to a counter's current
  value before a tricky section, so if it goes wrong you know exactly where
  to stop — **Restore** sets the counter straight back to that value.
  Checkpoints live on the project's detail page, under its counters.

### 🏷 Tags
Eight built-in tags (Blanket, Garment, Amigurumi, Gift, Quick make, Stash
buster, Baby, Home) plus **any custom tag you invent**, addable from either
the project form or the filter sheet. Custom tags persist independently of
projects, so a tag survives deleting the last project that used it.

### 🔲 Mosaic chart reader
- Create a chart grid (up to 200 × 300), or **import a photo of a chart** —
  the image is sampled into a two-colour grid you can touch up in edit mode.
- Reading mode highlights your **working row** (mosaic charts read bottom to
  top), lets you tap individual stitches to mark them done, and marks whole
  rows complete with one button. Completed rows dim and get a check mark.
- Progress is saved continuously — close the app mid-row and pick up where
  you left off.

### 🧶 Yarn stash & barcode scanning
- Scan the EAN/UPC barcode on any ball band with your camera. Scanning uses
  the native `BarcodeDetector` API where available and falls back to the
  ZXing library elsewhere (iOS Safari), with manual number entry as a last
  resort.
- Scanned barcodes are looked up in this order:
  1. **Your own scan history** — offline, instant, free. The first time you
     scan a new yarn you fill in the details once; every later skein of it is
     recognised immediately.
  2. **[UPCitemdb](https://www.upcitemdb.com/)** free endpoint (no key, ~100
     lookups/day).
  3. **[Go-UPC](https://go-upc.com/plans/api)** if you add an API key in
     Settings (paid, much larger database).
- A **“Look up details on Ravelry”** button fills in weight and company data
  from Ravelry's yarn database, which covers Scheepjes, Drops, Stylecraft,
  Lion Brand, and thousands more.

#### A note on yarn APIs (research findings)
There is **no Scheepjes-specific or yarn-industry product API** — Scheepjes
and most yarn companies don't publish one. What exists:

- **General UPC databases** ([Go-UPC](https://go-upc.com/),
  [Barcode Lookup](https://www.barcodelookup.com/api),
  [Barcode Spider](https://www.barcodespider.com/),
  [UPCitemdb](https://www.upcitemdb.com/)) — coverage of yarn is patchy
  because many yarn barcodes are never registered, which is why the app's
  own remembered-scan history is the primary source.
- **[Ravelry's API](https://www.ravelry.com/about/goodies)** — the only
  genuinely yarn-aware database API (brand, weight, fibre, yardage), but it
  is searched by name, not barcode. The app uses it to enrich details after
  a scan identifies the product name.

### 📖 Pattern library & folders
Import patterns three ways, then file, tag, search and filter them:
- **From the web** — save a link with a title and tags.
- **Upload** — PDFs, images, or text files are stored inside the app
  (available offline).
- **Take a photo** — opens the camera directly on phones.

**Folders** sit at the top as a two-column grid. Create, rename and delete
them freely; deleting a folder never deletes its patterns — they fall back to
**Unfiled**, and the confirmation says so before you commit. Any pattern can
be moved between folders, and search cuts across every folder so nothing is
lost by being filed.

**Opening an uploaded pattern reads it in the app** — a built-in viewer for
PDFs, images and text files, instead of handing the file off to a new tab.
A PDF pattern gets its own **place marker**: tap anywhere on the rendered
page to drop a pin at that exact spot — not just a page number, since one
page often holds several steps. The pin's position is stored as a fraction
of the page's width and height, so it lands in the same place no matter what
size screen you reopen it on. Leaving the pattern and coming back later —
even months later, for a project picked back up mid-way — scrolls straight
to the marked page with the pin already there. A page stepper still moves
through the document without disturbing the mark, a "Mark this page" button
drops a pin at page centre for anyone without a pointer (its focus then
lets the arrow keys nudge it into place), and "Clear mark" removes it.
"Open in new tab" stays available underneath, for anything better read full
screen or in a dedicated PDF app.

Patterns can be attached to projects and open with one tap.

### 🔗 Ravelry connection
1. Create free API keys at
   [ravelry.com/pro/developer](https://www.ravelry.com/pro/developer)
   (choose **Basic Auth: read only**).
2. Enter the two keys under **More → Ravelry connection** and tap *Test
   connection*. Keys never leave your device.

This enables Ravelry yarn lookups and identity checks. **Sharing a project**
composes a complete project summary (pattern, yarn, hook, progress, notes)
that goes out through your phone's share sheet or clipboard, ready to paste
into a new Ravelry project. (Creating Ravelry projects fully automatically
requires OAuth with a server-held secret, which a serverless, on-device app
deliberately avoids — your credentials stay yours.)

### 🎨 Design system: Mint, Orange & Olive, iOS-shaped
Full token documentation lives in [`design-system.md`](./design-system.md); the summary:
- **One shape language, native to iPhone**: capsule buttons, bottom-sheet
  dialogs with a grabber, grouped-inset form fields, floating tab bar,
  large-title header — applied everywhere rather than switched per
  platform. It ships in a **flat** finish (opaque surfaces, a plain
  shadow) by default; add `data-surface="glass"` to `<html>` for the
  translucent, blurred Liquid Glass alternative — same shapes and radii
  in both.
- **Colour**: [Radix UI](https://www.radix-ui.com/colors)'s **Mint** is
  the primary brand colour, **Orange** a secondary accent, **Olive** the
  full neutral scale (background, surface, borders, body text); status
  feedback uses Red/Yellow/Blue/Green. All matched 12-step light/dark
  pairs, so the app switches with your system's light/dark setting
  automatically rather than needing a theme picker. Buttons and banners
  share one formula — a family's light step 4 as the fill, its dark step
  12 as the text — verified at 9:1+ contrast in every family, in both
  modes; three families (Orange, Yellow, and Green by a hair) needed step
  12 instead of the usual step 11 for standalone coloured text, caught by
  computing the WCAG 2.1 relative-luminance formula rather than
  eyeballing it.
- **Typography**: [Fraunces](https://fonts.google.com/specimen/Fraunces)
  semibold for headlines, [Nunito Sans](https://fonts.google.com/specimen/Nunito+Sans)
  for body copy — both self-hosted, open-source variable fonts.
- Feedback banners (Ravelry connection results, backup import errors) use
  the same error/warning/info/success tokens as every other accent, so a
  banner reads correctly in light or dark without a separate palette.
- Three text sizes, independent of the colour scheme.
- WCAG 2.2 AA throughout: all text meets contrast minimums in both light
  and dark, every control is keyboard-operable with visible focus, touch
  targets are ≥44 px, counters and actions announce through a live region,
  dialogs trap focus and return it to whatever opened them, reduced-motion
  preference is respected, forced-colors mode (Windows High Contrast)
  gets opaque bordered surfaces regardless of finish, and the chart grid
  exposes per-stitch labels ("Row 5, stitch 12, colour A, done") to
  screen readers.

### 💾 Your data
Everything is stored on-device in IndexedDB. **More → Your data** exports a
single JSON backup (pattern files included) and imports it on a new phone.

## Running it

Built with **React**, **[shadcn/ui](https://ui.shadcn.com)** components,
**Tailwind CSS 4**, and **Vite**:

```sh
npm install
npm run dev      # local development
npm run build    # production build in dist/
```

Pushing to the deploy branch publishes automatically to GitHub Pages via
`.github/workflows/deploy-pages.yml`. Open the Pages URL on your phone and
*Add to Home Screen* — camera scanning requires HTTPS, which Pages provides.

## Structure

```
index.html                    entry document
src/main.jsx                  React bootstrap
src/App.jsx                   navigation shell, tab bar
src/tokens.css                Mint/Orange/Olive + status design tokens
                              (light + dark), type scale, spacing & radius
                              — see design-system.md
src/app.css                   adapts tokens.css to the shadcn-convention
                              variable names, the iOS-shaped surface rules
                              (cards, dialogs, tab bar, inputs) in both
                              flat (default) and Liquid Glass finishes
src/components/ui/            shadcn-style components, re-skinned for the
                              above (button, card, dialog, input, label,
                              select, textarea, checkbox, progress, badge,
                              alert)
src/features/                 app views: projects, counters, chart reader,
                              yarn stash + scanner, patterns, settings
src/lib/db.js                 IndexedDB + localStorage helpers
src/lib/counters.js           expected-stitch-count math
src/lib/lookup.js             barcode lookup chain
src/lib/tags.js               built-in + custom project tags
src/lib/ravelry.js            Ravelry API client + share text
src/lib/announce.js           screen-reader live region
public/manifest.webmanifest   PWA install metadata (SW via vite-plugin-pwa)
design-system.md              full design token documentation
```

The components in `src/components/ui/` keep their original Radix UI
primitives underneath (Dialog, Select, Checkbox, …) for accessible
keyboard/screen-reader behaviour — only the visual layer changed, themed
through the same CSS variables (`--background`, `--primary`, `--ring`, …)
derived from Mint, Orange and Olive, so every component follows the one
light/dark pair automatically.
