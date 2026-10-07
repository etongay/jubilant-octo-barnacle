# Figma → code token sync

Figma is the source of truth for colour, spacing and radius. Code gets there in one direction, through a file you can review in a pull request.

```
Figma variables  ──export──▶  tokens/tokens.json  ──npm run tokens──▶  src/tokens.generated.css
(Woolgaze Design System)      (committed snapshot)                      (imported by tokens.css)
```

Figma file: `figma.com/design/r7purEe2WeU7or8KWmThLe` — collections **Radix Primitives** (raw colours, Light/Dark), **Semantic** (role aliases, Light/Dark) and **Layout** (spacing, radius).

## When you change something in Figma

1. Ask Claude Code: *"Sync tokens from Figma."* It reads the three variable collections through the Figma MCP, updates `tokens/tokens.json`, and runs `npm run tokens`.
2. Review the diff in `tokens/tokens.json` and `src/tokens.generated.css`. Every changed line is a token that changed in Figma.
3. Open Storybook (`npm run storybook`) and check the **Colors** story and any component you touched, in Light and Dark.
4. Merge. CI fails if `tokens.generated.css` doesn't match `tokens.json` (`npm run check:tokens`), so the two can't drift.

## Rules

- **Never hand-edit `src/tokens.generated.css`.** The next sync overwrites it. Change the value in Figma instead.
- **Add a token in Figma first**, then sync. A token that exists only in code will not survive a sync.
- Naming maps mechanically: Figma `color/primary/bg-hover` → `--primary-bg-hover`; `color/neutral/background` → `--background`; `color/chart/1` → `--chart-1`; `Layout/radius/md` → `--ws-radius-md`.
- Step 11 of orange, yellow and green fails WCAG AA as standalone text, so the Semantic collection aliases their `text` role to step 12 (see `design-system.md` §1.6). Keep that alias when editing Figma.

## What is *not* synced yet

- **Typography.** The type scale and `@font-face` rules in `src/tokens.css` are still hand-written. Figma has 11 text styles; one (`Label/Sm`, 10px Regular) has no counterpart in code.
- **Components.** Figma components are not linked to the React components yet. That is the next layer (Code Connect), and it should wait until the components stop changing.

## Why a plain script and not Style Dictionary

One output (CSS) doesn't need a framework. If a second output is ever needed (for example a React Native theme), swap `scripts/build-tokens.mjs` for Style Dictionary reading the same `tokens.json`.
