# 🧶 Hearth & Hook

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
A PDF pattern gets its own **page bookmark**: a stepper (same shape as every
other counter in the app) records which page you're on as you read, so
leaving the pattern and coming back later picks up from there automatically
rather than starting over at page one. Bumping the count never disrupts the
page you're actually looking at — it only updates the bookmark; a "Jump
viewer to page N" button appears if you want the viewer itself to follow.
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

### 🎨 Cozy by design, accessible by default
- **Typography**: headings are set in [Fraunces](https://fonts.google.com/specimen/Fraunces)
  with its `SOFT` axis at 100 — rounded, friendly terminals — while body
  copy and controls use [Nunito Sans](https://fonts.google.com/specimen/Nunito+Sans),
  a humanist sans with a tall x-height and open apertures that stays
  comfortable over long stretches of pattern notes. The serif/sans pairing
  is what carries the heading hierarchy, so headings stay distinct without
  relying on size alone. Both are self-hosted (latin + latin-ext variable
  subsets, ~90 KB for a typical device) and precached, so the app keeps its
  voice offline.
- Six themes — **Hearth** (clay rust and wool, the default), **Meadow**,
  **Lavender**, **Orchid** (blush and plum), **Night** (dark), and
  **High contrast** — plus three text sizes. The default follows your
  system's light/dark preference.
- Feedback banners (Ravelry connection results, backup import errors) use a
  shared **error / warning / info / success** token set that's tuned per
  theme rather than fixed to one palette, so a banner reads correctly in
  Night or High contrast the same as in Hearth.
- **Platform-adaptive design**: on iPhone the app wears an iOS 26
  liquid-glass skin (translucent blurred surfaces, floating capsule tab
  bar, bottom-sheet dialogs, large-title header); on Android it follows
  Material 3 (tonal elevated surfaces, full-pill buttons, navigation-bar
  active indicator, 28dp dialogs). The skins change shape and surface, not
  type — the Fraunces/Nunito Sans voice stays constant so the app reads as
  itself on every device. Detection is automatic, and **More → App style**
  can pin any skin. All six colour themes flow through every skin, and
  High contrast disables translucency so contrast stays guaranteed.
- WCAG 2.2 AA throughout: all text meets contrast minimums in every theme,
  every control is keyboard-operable with visible focus, touch targets are
  ≥44 px, counters and actions announce through a live region, dialogs trap
  focus and return it to whatever opened them, reduced-motion preference
  is respected, and the chart grid exposes per-stitch labels
  ("Row 5, stitch 12, colour A, done") to screen readers.

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
src/App.jsx                   navigation shell, tab bar, theming
src/app.css                   type system, theme tokens (six palettes),
                              platform skins
src/components/ui/            shadcn/ui components (button, card, dialog,
                              input, label, select, textarea, checkbox,
                              radio-group, progress, badge, alert)
src/features/                 app views: projects, counters, chart reader,
                              yarn stash + scanner, patterns, settings
src/lib/db.js                 IndexedDB + localStorage helpers
src/lib/counters.js           expected-stitch-count math
src/lib/lookup.js             barcode lookup chain
src/lib/tags.js               built-in + custom project tags
src/lib/ravelry.js            Ravelry API client + share text
src/lib/announce.js           screen-reader live region
src/lib/platform.js           iOS / Material / cozy skin detection
src/assets/fonts/             self-hosted variable font subsets
public/manifest.webmanifest   PWA install metadata (SW via vite-plugin-pwa)
```

The shadcn components live in `src/components/ui/` in the usual copy-in
style, themed through the standard shadcn CSS variables (`--background`,
`--primary`, `--ring`, …) so every component follows all five themes
automatically.
