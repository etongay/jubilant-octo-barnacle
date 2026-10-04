# Woolgaze Design System

A minimal, cozy token system for Woolgaze, built on [Radix UI Colors](https://www.radix-ui.com/colors). The companion file [`src/tokens.css`](./src/tokens.css) implements every token below as a CSS custom property, and `src/app.css` wires it into the app — see [§5](#5-wired-into-the-app).

**Personality**: soft, warm, uncluttered. Colour does real work (status, hierarchy, brand) rather than decorating — most surfaces stay quiet (neutral Olive), and the three accent families (Mint, Orange, status hues) appear only where they mean something.

---

## 1. Colour

### 1.1 Source scales

Four Radix families cover the whole palette. Each ships as a matched 12-step light/dark pair — same hue, re-tuned for the opposite background, so dark mode is a lookup, not a redesign.

| Role | Radix scale |
|---|---|
| Primary | `mint` |
| Secondary | `orange` |
| Neutral | `olive` |
| Error | `red` |
| Warning | `yellow` |
| Info | `blue` |
| Success | `green` — see [1.4](#14-green-not-mint-for-success) |

### 1.2 Semantic roles

Every family maps its 12 raw steps to the same nine roles, so a component asking for "a family's border" or "a family's button" behaves identically regardless of which hue is in play.

| Role | Step | Use |
|---|---|---|
| `bg` | 4 | Tonal fill — buttons, banners, selected chips |
| `bg-hover` | 5 | Hover/pressed state of a `bg` fill |
| `bg-active` | 6 | Active/selected state of a `bg` fill |
| `border` | 7 | Default border on a tonal surface |
| `border-strong` | 8 | Border on hover, or an interactive outline |
| `solid` | 9 | Vivid, non-text accent — progress fill, active-tab indicator, toggle-on |
| `solid-hover` | 10 | Hover state of a `solid` fill |
| `text` | 11 | Standalone coloured text/icon on a neutral background (links, status icons) |
| `fg` | 12 | High-contrast text — heading-weight text, and **button/banner foreground on a `bg` fill** |

### 1.3 The button formula

> Buttons are a lighter background and a darker foreground: `{family}-4` as the fill, `{family}-12` as the text. A primary button is `mint-4` on `mint-12`, not a solid `mint-9` fill with white text.

This is deliberate, not just a style choice — verified below, it also clears WCAG AA by a wide margin in every family, in both modes, which a solid step-9 fill with white text frequently cannot (Mint's own step 9 is a pale wash; white text on it lands at **1.43:1**, nowhere near AA). The same `bg`/`fg` pair additionally serves as the tint/tint-foreground pair for banners and alerts — one formula, two uses.

### 1.4 Green, not Mint, for success

Mint is the brand colour — it appears on every primary button and interactive accent. If success also used Mint, "this succeeded" and "this is just a primary action" would look identical, which defeats the point of a status colour. Green is close enough in hue to still read as "positive" at a glance, but distinct enough to be its own signal, so it's a fifth family alongside the three named status hues.

### 1.5 Full scale reference

<details>
<summary>Primary — Mint</summary>

| Step | Light | Dark |
|---|---|---|
| 1 | `#f9fefd` | `#0e1515` |
| 2 | `#f2fbf9` | `#0f1b1b` |
| 3 | `#ddf9f2` | `#092c2b` |
| 4 | `#c8f4e9` | `#003a38` |
| 5 | `#b3ecde` | `#004744` |
| 6 | `#9ce0d0` | `#105650` |
| 7 | `#7ecfbd` | `#1e685f` |
| 8 | `#4cbba5` | `#277f70` |
| 9 | `#86ead4` | `#86ead4` |
| 10 | `#7de0cb` | `#a8f5e5` |
| 11 | `#027864` | `#58d5ba` |
| 12 | `#16433c` | `#c4f5e1` |
</details>

<details>
<summary>Secondary — Orange</summary>

| Step | Light | Dark |
|---|---|---|
| 1 | `#fefcfb` | `#17120e` |
| 2 | `#fff7ed` | `#1e160f` |
| 3 | `#ffefd6` | `#331e0b` |
| 4 | `#ffdfb5` | `#462100` |
| 5 | `#ffd19a` | `#562800` |
| 6 | `#ffc182` | `#66350c` |
| 7 | `#f5ae73` | `#7e451d` |
| 8 | `#ec9455` | `#a35829` |
| 9 | `#f76b15` | `#f76b15` |
| 10 | `#ef5f00` | `#ff801f` |
| 11 | `#cc4e00` | `#ffa057` |
| 12 | `#582d1d` | `#ffe0c2` |
</details>

<details>
<summary>Neutral — Olive</summary>

| Step | Light | Dark |
|---|---|---|
| 1 | `#fcfdfc` | `#111210` |
| 2 | `#f8faf8` | `#181917` |
| 3 | `#eff1ef` | `#212220` |
| 4 | `#e7e9e7` | `#282a27` |
| 5 | `#dfe2df` | `#2f312e` |
| 6 | `#d7dad7` | `#383a36` |
| 7 | `#cccfcc` | `#454843` |
| 8 | `#b9bcb8` | `#5c625b` |
| 9 | `#898e87` | `#687066` |
| 10 | `#7f847d` | `#767d74` |
| 11 | `#60655f` | `#afb5ad` |
| 12 | `#1d211c` | `#eceeec` |
</details>

<details>
<summary>Success — Green</summary>

| Step | Light | Dark |
|---|---|---|
| 1 | `#fbfefc` | `#0e1512` |
| 2 | `#f4fbf6` | `#121b17` |
| 3 | `#e6f6eb` | `#132d21` |
| 4 | `#d6f1df` | `#113b29` |
| 5 | `#c4e8d1` | `#174933` |
| 6 | `#adddc0` | `#20573e` |
| 7 | `#8eceaa` | `#28684a` |
| 8 | `#5bb98b` | `#2f7c57` |
| 9 | `#30a46c` | `#30a46c` |
| 10 | `#2b9a66` | `#33b074` |
| 11 | `#218358` | `#3dd68c` |
| 12 | `#193b2d` | `#b1f1cb` |
</details>

<details>
<summary>Error — Red</summary>

| Step | Light | Dark |
|---|---|---|
| 1 | `#fffcfc` | `#191111` |
| 2 | `#fff7f7` | `#201314` |
| 3 | `#feebec` | `#3b1219` |
| 4 | `#ffdbdc` | `#500f1c` |
| 5 | `#ffcdce` | `#611623` |
| 6 | `#fdbdbe` | `#72232d` |
| 7 | `#f4a9aa` | `#8c333a` |
| 8 | `#eb8e90` | `#b54548` |
| 9 | `#e5484d` | `#e5484d` |
| 10 | `#dc3e42` | `#ec5d5e` |
| 11 | `#ce2c31` | `#ff9592` |
| 12 | `#641723` | `#ffd1d9` |
</details>

<details>
<summary>Warning — Yellow</summary>

| Step | Light | Dark |
|---|---|---|
| 1 | `#fdfdf9` | `#14120b` |
| 2 | `#fefce9` | `#1b180f` |
| 3 | `#fffab8` | `#2d2305` |
| 4 | `#fff394` | `#362b00` |
| 5 | `#ffe770` | `#433500` |
| 6 | `#f3d768` | `#524202` |
| 7 | `#e4c767` | `#665417` |
| 8 | `#d5ae39` | `#836a21` |
| 9 | `#ffe629` | `#ffe629` |
| 10 | `#ffdc00` | `#ffff57` |
| 11 | `#9e6c00` | `#f5e147` |
| 12 | `#473b1f` | `#f6eeb4` |
</details>

<details>
<summary>Info — Blue</summary>

| Step | Light | Dark |
|---|---|---|
| 1 | `#fbfdff` | `#0d1520` |
| 2 | `#f4faff` | `#111927` |
| 3 | `#e6f4fe` | `#0d2847` |
| 4 | `#d5efff` | `#003362` |
| 5 | `#c2e5ff` | `#004074` |
| 6 | `#acd8fc` | `#104d87` |
| 7 | `#8ec8f6` | `#205d9e` |
| 8 | `#5eb1ef` | `#2870bd` |
| 9 | `#0090ff` | `#0090ff` |
| 10 | `#0588f0` | `#3b9eff` |
| 11 | `#0d74ce` | `#70b8ff` |
| 12 | `#113264` | `#c2e6ff` |
</details>

### 1.6 WCAG AA verification

Every pairing below was computed with the WCAG 2.1 relative-luminance formula, not eyeballed. Two deviations from the "standard" role mapping are called out — both are places a family's usual step fails AA and a darker step is substituted.

| Pairing | Light | Dark | AA (4.5:1)? |
|---|---|---|---|
| `fg` on `bg` (button/banner text) — Mint | 9.24:1 | 10.52:1 | ✅ |
| `fg` on `bg` — Orange | 9.11:1 | 11.29:1 | ✅ |
| `fg` on `bg` — Red | 9.72:1 | 10.78:1 | ✅ |
| `fg` on `bg` — Yellow | 9.67:1 | 11.85:1 | ✅ |
| `fg` on `bg` — Blue | 10.59:1 | 9.73:1 | ✅ |
| `fg` on `bg` — Green | 10.27:1 | 9.70:1 | ✅ |
| `foreground` on `background` (neutral) | 15.56:1 | 15.13:1 | ✅ |
| `foreground` on `card` (neutral) | 16.01:1 | — | ✅ |
| `muted-foreground` on `background` | 5.68:1 | 8.43:1 | ✅ |
| `text` (step 11) on neutral bg — Mint | 5.17:1 | 9.78:1 | ✅ |
| `text` (step 11) on neutral bg — Red | 4.97:1 | 8.37:1 | ✅ |
| `text` (step 11) on neutral bg — Blue | 4.54:1 | 8.39:1 | ✅ (closest pass — 4 significant figures: 4.5435:1) |
| ~~`text` (step 11) on neutral bg — Green~~ | ~~4.4970:1~~ | — | ❌ **fails** — rounds to 4.50 at 2dp but is under 4.5 at full precision; use `fg` (step 12, 11.74:1) instead |
| ~~`text` (step 11) on neutral bg — Yellow~~ | ~~4.35:1~~ | — | ❌ **fails** — use `fg` (step 12, 10.46:1) instead |
| ~~`text` (step 11) on neutral bg — Orange~~ | ~~4.30:1~~ | — | ❌ **fails** — use `fg` (step 12, 11.07:1) instead |
| White text on `solid` (step 9) — Mint | 1.43:1 | — | ❌ **fails badly** — Mint 9 is a pale wash; never pair `solid` with white text in this family. Use dark text (`olive-12`, 11.45:1) on any Mint 9 fill instead. |

**Rule of thumb this produces**: when a status or secondary colour is used as standalone text/icon color directly on the neutral background (not inside its own `bg` tint), check it precisely, not to two decimal places — Yellow, Orange, and Green's step 11 all read too light at normal text size (Green fails only at full floating-point precision: 4.4970 vs the 4.5000 threshold, a reminder to compute rather than round). Step 12 is the safe default for that specific case across every family; step 11 only for Mint, Red, and Blue.

---

## 2. Typography

**Headlines**: [Fraunces](https://fonts.google.com/specimen/Fraunces), semibold (600), at its default `SOFT` axis (0) — carries the "cozy" half of the personality through its warm, high-contrast serifs. (An earlier pass raised `SOFT` toward 100 for an even rounder terminal, but that rounds off exactly what makes Fraunces recognizable; at 100 it reads as close enough to the Georgia fallback that the font looked like it wasn't loading.)
**Body**: [Nunito Sans](https://fonts.google.com/specimen/Nunito+Sans), a humanist sans with a tall x-height and open apertures — chosen as Fraunces's complement because it stays calm and legible at small sizes and over long stretches of text (pattern notes, settings copy), where a display serif would tire the eye.

Both are open-source (SIL Open Font License), self-hostable as variable fonts.

### 2.1 Scale

| Step | Token | Font | Size | Weight | Line-height | Letter-spacing | Use |
|---|---|---|---|---|---|---|---|
| 1 | `display` | Fraunces | 2.5rem / 40px | 600 | 1.1 | −0.02em | Hero / splash moments |
| 2 | `h1` | Fraunces | 2rem / 32px | 600 | 1.15 | −0.02em | Page title |
| 3 | `h2` | Fraunces | 1.5rem / 24px | 600 | 1.2 | −0.015em | Section heading |
| 4 | `h3` | Fraunces | 1.25rem / 20px | 600 | 1.25 | −0.01em | Card / dialog title |
| 5 | `h4` | Fraunces | 1.125rem / 18px | 600 | 1.3 | −0.005em | Minor heading, emphasis label |
| 6 | `body-lg` | Nunito Sans | 1.125rem / 18px | 400 | 1.6 | 0 | Lead paragraph |
| 7 | `body` | Nunito Sans | 1rem / 16px | 400 | 1.6 | 0 | Default body copy |
| 8 | `body-sm` | Nunito Sans | 0.875rem / 14px | 400 | 1.5 | 0 | Secondary / supporting text |
| 9 | `caption` | Nunito Sans | 0.75rem / 12px | 500 | 1.4 | 0.01em | Captions, timestamps, metadata |
| 10 | `label` | Nunito Sans | 0.875rem / 14px | 600 | 1.2 | 0.01em | Buttons, form labels, nav items |

---

## 3. Spacing & Radius

### 3.1 Spacing — base 4px grid

| Token | Value |
|---|---|
| `spacing.1` | 4px |
| `spacing.2` | 8px |
| `spacing.3` | 12px |
| `spacing.4` | 16px |
| `spacing.5` | 20px |
| `spacing.6` | 24px |
| `spacing.8` | 32px |
| `spacing.10` | 40px |
| `spacing.12` | 48px |
| `spacing.16` | 64px |
| `spacing.20` | 80px |
| `spacing.24` | 96px |

### 3.2 Radius

| Token | Value | Use |
|---|---|---|
| `radius.sm` | 8px | Inputs, small chips |
| `radius.md` | 12px | Default controls |
| `radius.lg` | 18px | Cards |
| `radius.xl` | 28px | Dialogs, sheets |
| `radius.full` | 9999px | Pills, capsule buttons, avatars |

---

## 4. Tokens as JSON

Machine-readable form of everything above — raw scales, semantic role aliases (resolved to hex, per mode), type scale, spacing, and radius.

```json
{
  "color": {
    "mint":   { "light": { "1": "#f9fefd", "2": "#f2fbf9", "3": "#ddf9f2", "4": "#c8f4e9", "5": "#b3ecde", "6": "#9ce0d0", "7": "#7ecfbd", "8": "#4cbba5", "9": "#86ead4", "10": "#7de0cb", "11": "#027864", "12": "#16433c" },
              "dark":  { "1": "#0e1515", "2": "#0f1b1b", "3": "#092c2b", "4": "#003a38", "5": "#004744", "6": "#105650", "7": "#1e685f", "8": "#277f70", "9": "#86ead4", "10": "#a8f5e5", "11": "#58d5ba", "12": "#c4f5e1" } },
    "orange": { "light": { "1": "#fefcfb", "2": "#fff7ed", "3": "#ffefd6", "4": "#ffdfb5", "5": "#ffd19a", "6": "#ffc182", "7": "#f5ae73", "8": "#ec9455", "9": "#f76b15", "10": "#ef5f00", "11": "#cc4e00", "12": "#582d1d" },
              "dark":  { "1": "#17120e", "2": "#1e160f", "3": "#331e0b", "4": "#462100", "5": "#562800", "6": "#66350c", "7": "#7e451d", "8": "#a35829", "9": "#f76b15", "10": "#ff801f", "11": "#ffa057", "12": "#ffe0c2" } },
    "olive":  { "light": { "1": "#fcfdfc", "2": "#f8faf8", "3": "#eff1ef", "4": "#e7e9e7", "5": "#dfe2df", "6": "#d7dad7", "7": "#cccfcc", "8": "#b9bcb8", "9": "#898e87", "10": "#7f847d", "11": "#60655f", "12": "#1d211c" },
              "dark":  { "1": "#111210", "2": "#181917", "3": "#212220", "4": "#282a27", "5": "#2f312e", "6": "#383a36", "7": "#454843", "8": "#5c625b", "9": "#687066", "10": "#767d74", "11": "#afb5ad", "12": "#eceeec" } },
    "red":    { "light": { "1": "#fffcfc", "2": "#fff7f7", "3": "#feebec", "4": "#ffdbdc", "5": "#ffcdce", "6": "#fdbdbe", "7": "#f4a9aa", "8": "#eb8e90", "9": "#e5484d", "10": "#dc3e42", "11": "#ce2c31", "12": "#641723" },
              "dark":  { "1": "#191111", "2": "#201314", "3": "#3b1219", "4": "#500f1c", "5": "#611623", "6": "#72232d", "7": "#8c333a", "8": "#b54548", "9": "#e5484d", "10": "#ec5d5e", "11": "#ff9592", "12": "#ffd1d9" } },
    "yellow": { "light": { "1": "#fdfdf9", "2": "#fefce9", "3": "#fffab8", "4": "#fff394", "5": "#ffe770", "6": "#f3d768", "7": "#e4c767", "8": "#d5ae39", "9": "#ffe629", "10": "#ffdc00", "11": "#9e6c00", "12": "#473b1f" },
              "dark":  { "1": "#14120b", "2": "#1b180f", "3": "#2d2305", "4": "#362b00", "5": "#433500", "6": "#524202", "7": "#665417", "8": "#836a21", "9": "#ffe629", "10": "#ffff57", "11": "#f5e147", "12": "#f6eeb4" } },
    "blue":   { "light": { "1": "#fbfdff", "2": "#f4faff", "3": "#e6f4fe", "4": "#d5efff", "5": "#c2e5ff", "6": "#acd8fc", "7": "#8ec8f6", "8": "#5eb1ef", "9": "#0090ff", "10": "#0588f0", "11": "#0d74ce", "12": "#113264" },
              "dark":  { "1": "#0d1520", "2": "#111927", "3": "#0d2847", "4": "#003362", "5": "#004074", "6": "#104d87", "7": "#205d9e", "8": "#2870bd", "9": "#0090ff", "10": "#3b9eff", "11": "#70b8ff", "12": "#c2e6ff" } },
    "green":  { "light": { "1": "#fbfefc", "2": "#f4fbf6", "3": "#e6f6eb", "4": "#d6f1df", "5": "#c4e8d1", "6": "#adddc0", "7": "#8eceaa", "8": "#5bb98b", "9": "#30a46c", "10": "#2b9a66", "11": "#218358", "12": "#193b2d" },
              "dark":  { "1": "#0e1512", "2": "#121b17", "3": "#132d21", "4": "#113b29", "5": "#174933", "6": "#20573e", "7": "#28684a", "8": "#2f7c57", "9": "#30a46c", "10": "#33b074", "11": "#3dd68c", "12": "#b1f1cb" } }
  },
  "semantic": {
    "note": "Each family resolves roles bg/bg-hover/bg-active/border/border-strong/solid/solid-hover/text/fg to steps 4/5/6/7/8/9/10/11/12 respectively — see §1.2. Yellow, orange and green substitute step 12 for the 'text' role (§1.6).",
    "primary": "mint", "secondary": "orange", "neutral": "olive",
    "error": "red", "warning": "yellow", "info": "blue", "success": "green"
  },
  "typography": {
    "fontFamily": { "display": "'Fraunces', Georgia, serif", "body": "'Nunito Sans', ui-rounded, system-ui, sans-serif" },
    "display":  { "font": "display", "size": "2.5rem",   "weight": 600, "lineHeight": 1.1,  "letterSpacing": "-0.02em" },
    "h1":       { "font": "display", "size": "2rem",     "weight": 600, "lineHeight": 1.15, "letterSpacing": "-0.02em" },
    "h2":       { "font": "display", "size": "1.5rem",   "weight": 600, "lineHeight": 1.2,  "letterSpacing": "-0.015em" },
    "h3":       { "font": "display", "size": "1.25rem",  "weight": 600, "lineHeight": 1.25, "letterSpacing": "-0.01em" },
    "h4":       { "font": "display", "size": "1.125rem", "weight": 600, "lineHeight": 1.3,  "letterSpacing": "-0.005em" },
    "bodyLg":   { "font": "body",    "size": "1.125rem", "weight": 400, "lineHeight": 1.6,  "letterSpacing": "0" },
    "body":     { "font": "body",    "size": "1rem",     "weight": 400, "lineHeight": 1.6,  "letterSpacing": "0" },
    "bodySm":   { "font": "body",    "size": "0.875rem", "weight": 400, "lineHeight": 1.5,  "letterSpacing": "0" },
    "caption":  { "font": "body",    "size": "0.75rem",  "weight": 500, "lineHeight": 1.4,  "letterSpacing": "0.01em" },
    "label":    { "font": "body",    "size": "0.875rem", "weight": 600, "lineHeight": 1.2,  "letterSpacing": "0.01em" }
  },
  "spacing": {
    "1": "4px", "2": "8px", "3": "12px", "4": "16px", "5": "20px", "6": "24px",
    "8": "32px", "10": "40px", "12": "48px", "16": "64px", "20": "80px", "24": "96px"
  },
  "radius": {
    "sm": "8px", "md": "12px", "lg": "18px", "xl": "28px", "full": "9999px"
  }
}
```

---

## 5. Wired into the app

`src/app.css` imports `tokens.css` and maps the family/role tokens onto the shadcn-convention variable names components already use (`--primary`, `--destructive-foreground`, …) — no component markup changed, only what each variable resolves to. Two exceptions needed an actual component touch:

- **`Button`** gained a new `accent` variant (Orange `bg`/`fg`) alongside the existing neutral `secondary` — shadcn's `secondary` is a generic muted surface used throughout the app (card backgrounds, grouped fields), so it stays Olive rather than becoming Orange; `accent` is the one that's actually the Secondary brand colour. `ChartReader`'s "Mark row complete" now uses it.
- **Focus ring**: the usual "step 9 solid" convention fails badly for Mint specifically (`mint-9` is a pale wash, 1.36:1 against the app background — nowhere near the 3:1 a focus ring needs under WCAG 1.4.11). `--ring` uses `mint-11` instead (5.17:1), caught by computing rather than assuming the pattern holds for every hue.

**Surface finish** — iOS-shaped components (capsule buttons, bottom-sheet dialogs with a grabber, grouped-inset fields, floating tab bar) come in two finishes, same shapes and radii in both:
- **Flat** (default): opaque surfaces, no blur — a plain shadow replaces the glass depth cue.
- **Liquid Glass** (`<html data-surface="glass">`): the identical shapes, translucent, blurred surfaces — the treatment built in the previous pass.

Both pass axe-core clean across light/dark (24 states audited: 2 colour schemes × 2 finishes × 6 screens). No Settings toggle exists yet for switching finishes at runtime.
