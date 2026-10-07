// Builds src/tokens.generated.css from tokens/tokens.json.
//
//   npm run tokens          write the CSS
//   npm run check:tokens    fail if the committed CSS is out of date
//
// tokens/tokens.json is a snapshot of the "Woolgaze Design System" Figma file
// (see docs/figma-sync.md). Edit colours in Figma, re-export, then run this —
// never edit tokens.generated.css by hand.
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'tokens/tokens.json';
const OUT = 'src/tokens.generated.css';
const t = JSON.parse(readFileSync(SRC, 'utf8'));

const families = Object.keys(t.color);
const steps = Array.from({ length: 12 }, (_, i) => String(i + 1));

const rawBlock = mode =>
  families
    .map(f => '  ' + steps.map(s => `--${f}-${s}: ${t.color[f][mode][s]};`).join(' '))
    .join('\n\n');

// Figma name -> CSS custom property.
//   color/neutral/background -> --background   (shadcn-convention app tokens)
//   color/neutral/bg         -> --neutral-bg
//   color/primary/bg-hover   -> --primary-bg-hover
//   color/chart/1            -> --chart-1
const APP_NEUTRALS = new Set(['background', 'foreground', 'card', 'card-foreground', 'muted-foreground', 'border', 'border-strong', 'ring']);
const cssName = name => {
  const [, group, role] = name.split('/');
  if (group === 'neutral' && APP_NEUTRALS.has(role)) return `--${role}`;
  return `--${group}-${role}`;
};

// Step 11 of these hues fails WCAG AA as standalone text (design-system.md §1.6),
// so Figma aliases the text role to step 12. Kept as a comment for readers.
const AA_NOTE = new Set(['color/secondary/text', 'color/warning/text', 'color/success/text']);

const semanticLines = Object.entries(t.semantic).map(([name, target]) => {
  const [fam, step] = target.split('/');
  const note = AA_NOTE.has(name) ? '  /* step 12: step 11 fails AA as standalone text, see design-system.md §1.6 */' : '';
  return `  ${cssName(name)}: var(--${fam}-${step});${note}`;
});

const rem = px => (px === 9999 ? '9999px' : `${+(px / 16).toFixed(4)}rem`);
const px = v => parseFloat(v);
const spacingLines = Object.entries(t.spacing).map(([k, v]) => `  --spacing-${k}: ${rem(px(v))};  /* ${px(v)}px */`);
// Named --ws-radius-* so they don't collide with Tailwind's own --radius-* theme keys.
const radiusLines = Object.entries(t.radius).map(([k, v]) => `  --ws-radius-${k}: ${rem(px(v))};  /* ${v} */`);

const css = `/* ======================================================================
   GENERATED FILE — do not edit by hand.
   Source: tokens/tokens.json (snapshot of the Woolgaze Design System
   Figma file). Rebuild with \`npm run tokens\`.

   Contains: raw colour scales (light + dark), the semantic role aliases,
   spacing and radius. Typography and @font-face stay in tokens.css.
   ====================================================================== */

:root {
  /* ---- Raw scales, light ---- */
${rawBlock('light')}

  color-scheme: light;
}

/* Dark scales. Follows the OS by default; data-theme="light"|"dark" on
   <html> forces one mode (used by Storybook's theme toggle). Both dark
   blocks are generated from the same data, so they cannot drift. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${rawBlock('dark').replace(/^/gm, '  ').replace(/^ {2}$/gm, '')}

    color-scheme: dark;
  }
}

:root[data-theme="dark"] {
${rawBlock('dark')}

  color-scheme: dark;
}

/* ======================================================================
   Semantic layer — role aliases per family (design-system.md §1.2).
   Components resolve through these, not the raw steps above.
   ====================================================================== */
:root {
${semanticLines.join('\n')}

  /* ---- Spacing — base 4px grid ---- */
${spacingLines.join('\n')}

  /* ---- Radius ---- */
${radiusLines.join('\n')}
}
`;

if (process.argv.includes('--check')) {
  let current = '';
  try { current = readFileSync(OUT, 'utf8'); } catch {}
  if (current !== css) {
    console.error(`${OUT} is out of date — run \`npm run tokens\` and commit the result.`);
    process.exit(1);
  }
  console.log('tokens.generated.css is up to date.');
} else {
  writeFileSync(OUT, css);
  console.log(`Wrote ${OUT} (${Object.keys(t.semantic).length} semantic tokens, ${families.length * 12} raw colours × 2 modes).`);
}
