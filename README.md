# 🧶 Hearth & Hook

A cozy crochet companion for your phone. Track projects with stitch and row
counters, manage your yarn stash by scanning ball-band barcodes, read mosaic
crochet charts row by row, keep a pattern library from any source, and share
finished projects to Ravelry.

Built as a **progressive web app (PWA)**: no app store needed. Open it in your
phone's browser, choose *Add to Home Screen*, and it installs like a native
app and works offline. All of your data stays on your device.

## Features

### 🧺 Projects & counters
- Each project tracks its pattern, hook size, status, notes, and linked yarn.
- Every project starts with **Rows** and **Stitches** counters; add as many
  more as you like (pattern repeats, colour changes…), each with an optional
  target and a progress bar.
- Counter buttons are oversized for mid-stitch tapping, with gentle haptic
  feedback and screen-reader announcements of every count.

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

### 📖 Pattern library
Import patterns three ways, then tag and filter them:
- **From the web** — save a link with a title and tags.
- **Upload** — PDFs, images, or text files are stored inside the app
  (available offline).
- **Take a photo** — opens the camera directly on phones.

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
- Six themes — **Hearth** (warm cream), **Meadow**, **Lavender**,
  **Orchid** (blush and plum), **Night** (dark), and **High contrast** —
  plus three text sizes. The default follows your system's light/dark
  preference.
- **Platform-adaptive design**: on iPhone the app wears an iOS 26
  liquid-glass skin (translucent blurred surfaces, floating capsule tab
  bar, bottom-sheet dialogs, system font, large-title header); on Android
  it follows Material 3 (tonal elevated surfaces, full-pill buttons,
  navigation-bar active indicator, Roboto, 28dp dialogs). Detection is
  automatic, and **More → App style** can pin any skin — including the
  cozy classic serif look. All five color themes flow through every skin,
  and High contrast disables translucency so contrast stays guaranteed.
- WCAG 2.2 AA throughout: all text meets contrast minimums in every theme,
  every control is keyboard-operable with visible focus, touch targets are
  ≥44 px, counters and actions announce through a live region, dialogs are
  real `<dialog>` elements with focus containment, reduced-motion preference
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
src/app.css                   shadcn theme tokens — five cozy palettes
src/components/ui/            shadcn/ui components (button, card, dialog,
                              input, label, select, textarea, checkbox,
                              radio-group, progress, badge)
src/features/                 app views: projects, counters, chart reader,
                              yarn stash + scanner, patterns, settings
src/lib/db.js                 IndexedDB + localStorage helpers
src/lib/lookup.js             barcode lookup chain
src/lib/ravelry.js            Ravelry API client + share text
src/lib/announce.js           screen-reader live region
public/manifest.webmanifest   PWA install metadata (SW via vite-plugin-pwa)
```

The shadcn components live in `src/components/ui/` in the usual copy-in
style, themed through the standard shadcn CSS variables (`--background`,
`--primary`, `--ring`, …) so every component follows all five themes
automatically.
