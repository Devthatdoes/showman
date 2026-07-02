# Showman design system — conventions

Showman is a **tokens-first** design system. It ships brand tokens and a base
surface treatment, not a React component library. Build UI with **Tailwind CSS
v4 utilities** whose values reference the Showman CSS custom properties below.
There are no importable Showman components and no Showman utility-class names —
style with plain Tailwind utilities + the `var(--showman-*)` tokens.

## The look

Dark, cinematic, warm-neutral. A near-black "carbon" canvas with two soft radial
glows (orange top-right, bone mid-left), bone-white text, hairline borders, and a
single hot-orange accent for primary actions. Rounded geometry throughout
(`rounded-full` for pills/buttons, `rounded-2xl`/`rounded-3xl` for panels).

## Tokens (use via `var(--…)`)

Surfaces: `--showman-carbon` (#090908, the page base), `--showman-carbon-2`
(#11100e), `--showman-carbon-3` (#1b1916). Aliases `--background` / `--foreground`
mirror carbon / bone.

Text: `--showman-bone` (#fff8ec, primary text), `--showman-muted` (#b8ad9d,
secondary/labels).

Lines: `--showman-line` (rgba(255,248,236,0.12), all hairline borders).

Accent: `--showman-orange` (#ff7a1a, primary actions), `--showman-orange-strong`
(#ff5f00, hover).

Status: `--showman-danger` (#ff5c7a), `--showman-success` (#6ee7a8).

The page surface (carbon background + radial glows + bone text + Arial/Helvetica
font + orange text selection) is applied to `html`/`body` by `styles.css`, so a
full-page design inherits it automatically.

## Styling idiom

Compose Tailwind utilities with arbitrary values pointing at the tokens, e.g.
`bg-[var(--showman-orange)]`, `text-[var(--showman-bone)]`,
`border-[var(--showman-line)]`. Translucent fills use rgba literals in the same
arbitrary-value form (e.g. `bg-[rgba(255,248,236,0.04)]`). The font is system
Arial/Helvetica — no web font is loaded.

Recipes the product uses (reproduce with Tailwind, not with class names this DS
exports):

- **Primary button** — pill, orange fill, dark ink:
  `inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-[var(--showman-orange)] text-[#160b02] hover:bg-[var(--showman-orange-strong)]`
- **Secondary button** — hairline border on faint bone fill:
  `… border border-[var(--showman-line)] bg-[rgba(255,248,236,0.04)] text-[var(--showman-bone)] hover:bg-[rgba(255,248,236,0.09)]`
- **Panel** — `border border-[var(--showman-line)] rounded-2xl bg-[rgba(17,16,14,0.78)]` (elevated: `rounded-3xl shadow-2xl shadow-black/30`).
- **Badge** — `inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold` tinted per status (orange/success/danger token).
- **Field** — `w-full rounded-xl border border-[var(--showman-line)] bg-[rgba(9,9,8,0.72)] px-4 py-3 text-sm text-[var(--showman-bone)] focus:border-[var(--showman-orange)] focus:outline-none`.
- **Label** — `text-xs font-semibold uppercase tracking-[0.16em] text-[var(--showman-muted)]`.

## Where the truth lives

`styles.css` (and the `_ds_bundle.css` it imports) is the authoritative token
source — read it before styling. The recipes above mirror the helper modules in
the product repo at `web/components/ui/` (`button`, `badge`, `panel`, `form`).

## One idiomatic snippet

```tsx
<div className="border border-[var(--showman-line)] rounded-2xl bg-[rgba(17,16,14,0.78)] p-6 flex flex-col gap-4">
  <h2 className="text-xl font-black tracking-[-0.06em] text-[var(--showman-bone)]">Book this artist</h2>
  <p className="text-sm text-[var(--showman-muted)]">Verified booking, escrowed payment, confirmed in one moment.</p>
  <button className="inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold bg-[var(--showman-orange)] text-[#160b02] hover:bg-[var(--showman-orange-strong)]">
    Request booking
  </button>
</div>
```
