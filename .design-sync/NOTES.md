# design-sync notes — Showman

## Shape: tokens-only

`web/components/ui/{badge,button,form,panel}.tsx` are **className-helper modules**
(`buttonStyles()`, `badgeStyles()`, `panelStyles()`, plus `form.tsx` className
constants) — they return Tailwind class strings, not React components. There are
no PascalCase component exports anywhere, so design-sync runs as a **tokens-only
DS**: empty `_ds_bundle.js`, brand tokens shipped via `styles.css`, no preview
cards. Decided with the user (full component sync was offered and declined in
favour of tokens-only because there are no renderable components).

## Scaffold (committed, under `.design-sync/tokens-src/`)

- `entry.js` — `export {};` (no exports → triggers tokens-only detection, given `cssEntry`).
- `package.json` — name `showman-ds`, `module: ./entry.js`.
- `tokens.css` — the brand tokens + base surface treatment, hand-extracted from
  `web/app/globals.css` (the `:root` token block, `html`/`body` styling,
  `::selection`). Tailwind directives (`tailwindcss` import, `@theme inline`) are
  intentionally omitted so the file ships standalone.

## Build / re-sync command

No upstream dist to rebuild — the converter is the whole build:

```
node .ds-sync/package-build.mjs --config .design-sync/config.json \
  --node-modules ./web/node_modules --entry ./.design-sync/tokens-src/entry.js \
  --out ./ds-bundle
node .ds-sync/package-validate.mjs ./ds-bundle
```

`--node-modules ./web/node_modules` is where `react`/`react-dom` resolve (vendored
for `_vendor/`, even though there are no component previews).

## Gotchas

- The validator's CSS `@import` scanner matches `@import "x"` **even inside CSS
  comments** — keep `tokens.css` comments free of any literal `@import "…"`
  string (an early build failed `[CSS_IMPORT_MISSING] tailwindcss` because a
  comment quoted it).
- `[DTS_REACT]` (`@types/react not found`) on every build is **benign** here —
  it only matters for component prop extraction, and there are no components.

## Re-sync risks

- `tokens.css` is a **manual copy** of `web/app/globals.css`. If the `--showman-*`
  tokens or body treatment change in `globals.css`, re-extract them into
  `tokens.css` — nothing detects the drift automatically.
- If real React components are ever added to `web/components/ui/` (actual `.tsx`
  components, not className helpers), revisit the tokens-only decision and
  consider a full component sync — at that point the `conventions.md` recipes
  should be replaced by real component cards.
- The `conventions.md` recipes mirror the class strings in
  `web/components/ui/*.tsx`. If those helpers change their classes, update the
  recipes (they are illustrative, not auto-derived).
