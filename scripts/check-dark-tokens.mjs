// Dark mode is declared twice: once under prefers-color-scheme (follow the
// OS) and once under [data-theme="dark"] (forced, e.g. Storybook's toggle).
// Fails if any rule's two copies have drifted apart.
import { readFileSync } from 'node:fs';

const files = ['src/tokens.css', 'src/app.css'];
const OS = ':root:not([data-theme="light"])';
const FORCED = ':root[data-theme="dark"]';
const norm = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').trim();

let failed = false;
for (const file of files) {
  const css = readFileSync(file, 'utf8');
  const rules = new Map();
  for (const [, sel, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    rules.set(norm(sel), norm(body));
  }
  // A rule inside the media query without the :not() guard would ignore
  // data-theme="light" and have no forced twin — catch it at the source.
  for (const [, inner] of css.matchAll(/@media \(prefers-color-scheme: dark\) \{((?:[^{}]*\{[^{}]*\})*)\s*\}/g)) {
    for (const [, sel] of inner.matchAll(/([^{}]+)\{/g)) {
      if (!norm(sel).startsWith(OS)) {
        console.error(`${file}: "${norm(sel)}" in the dark media query should start with ${OS}`);
        failed = true;
      }
    }
  }
  for (const [sel, body] of rules) {
    if (!sel.startsWith(OS)) continue;
    const twin = FORCED + sel.slice(OS.length);
    if (!rules.has(twin)) {
      console.error(`${file}: "${sel}" has no "${twin}" counterpart`);
      failed = true;
    } else if (rules.get(twin) !== body) {
      console.error(`${file}: "${sel}" and "${twin}" declare different values`);
      failed = true;
    }
  }
  for (const sel of rules.keys()) {
    if (sel.startsWith(FORCED) && !rules.has(OS + sel.slice(FORCED.length))) {
      console.error(`${file}: "${sel}" has no "${OS}…" counterpart`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log('Dark-mode blocks match.');
