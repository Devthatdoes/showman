# Landing Brief Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic split homepage with a brief-led landing page that feels music-native, alive, scrollable, and trustworthy without exposing private artist booking data.

**Architecture:** Keep the reset frontend-only. Put landing copy/sample records in a tiny typed module, isolate the interactive brief in a focused client component, and compose the page from semantic sections in `web/app/page.tsx`. Use CSS variables and scoped landing classes in `web/app/globals.css` for motion, cursor light, reveal timing, and reduced-motion behavior.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS v4, CSS custom properties, Playwright for rendered QA.

## Global Constraints

- Do not add new database tables.
- Do not add paid or network-dependent design assets.
- Do not add a public booking API in this pass.
- Do not add production celebrity likenesses.
- Do not rebuild the signed-in workspace.
- Public landing content must not expose real artist availability, booking terms, location specificity, fees, travel requirements, notes, or team/contact details.
- Avoid the words/frames `democratize`, `no middleman`, and anti-agent/anti-manager positioning.
- Use the orange lane as a live signal, not a one-note blanket.
- Respect `prefers-reduced-motion`.
- Update `docs/BUILD-JOURNAL.md` before finishing the turn.

---

## File Structure

- Create `web/lib/landing-content.ts`
  - Owns typed landing-page copy/data: parsed brief chips, sample scene cards, workflow steps, audience doors, trust promises.
  - Keeps dev-only artist/sample language centralized so production replacement is easy.
- Create `web/components/landing/living-booking-brief.tsx`
  - Client component for the hero's signature interaction: editable phrase, cursor-following orange light, resolving chips, and request fragments.
  - Produces an accessible, non-submitting visual prototype that can later connect to Describe the Gig parsing.
- Modify `web/app/page.tsx`
  - Replaces the split hero with the living brief first viewport and adds scene, workflow, two-door, and trust sections.
- Modify `web/app/globals.css`
  - Adds sharper landing color tokens, hero cursor-light styling, reveal animations, scene-card media placeholders, and reduced-motion fallbacks.
- Modify `docs/BUILD-JOURNAL.md`
  - Records plan approval, implementation scope, verification outcome, screenshots, and remaining product decisions.

---

### Task 1: Landing Content Contract

**Files:**
- Create: `web/lib/landing-content.ts`
- Modify: `docs/BUILD-JOURNAL.md`

**Interfaces:**
- Produces: `landingBrief`, `sceneCards`, `workflowSteps`, `audienceDoors`, `trustPromises`
- Consumes: no implementation dependencies

- [ ] **Step 1: Create the typed content module**

Create `web/lib/landing-content.ts` with this full content:

```ts
export type BriefChip = {
  label: string;
  tone: "signal" | "plain";
};

export type SceneCard = {
  name: string;
  role: string;
  caption: string;
  palette: string;
  devOnly: true;
};

export type WorkflowStep = {
  kicker: string;
  title: string;
  body: string;
};

export type AudienceDoor = {
  label: string;
  href: string;
  eyebrow: string;
  title: string;
  body: string;
};

export const landingBrief = {
  prompt: "Need a DJ for a warehouse show in Berlin, mid-Oct, around EUR8k.",
  chips: [
    { label: "Berlin", tone: "signal" },
    { label: "mid-Oct", tone: "plain" },
    { label: "90 min", tone: "plain" },
    { label: "EUR8k", tone: "signal" },
    { label: "travel covered", tone: "plain" },
    { label: "verified artist teams", tone: "signal" },
  ] satisfies BriefChip[],
  fragments: [
    "brief parsed",
    "team authority checked",
    "private details stay gated",
    "window request ready",
  ],
};

export const sceneCards = [
  {
    name: "ASAP Rocky",
    role: "development visual placeholder",
    caption: "A high-energy public teaser without booking details.",
    palette: "from-[#070707] via-[#18324a] to-[#ff6a00]",
    devOnly: true,
  },
  {
    name: "Fakemink",
    role: "development visual placeholder",
    caption: "Raw scene texture, not production marketplace proof.",
    palette: "from-[#151515] via-[#5e5b65] to-[#ff2d1d]",
    devOnly: true,
  },
  {
    name: "PinkPantheress",
    role: "development visual placeholder",
    caption: "Soft motion and pop-world signal, still privacy-safe.",
    palette: "from-[#041418] via-[#0b6472] to-[#ffb06a]",
    devOnly: true,
  },
] satisfies SceneCard[];

export const workflowSteps = [
  {
    kicker: "01",
    title: "Describe the gig",
    body: "Start with plain language: room, date, budget, set length, and the kind of energy the night needs.",
  },
  {
    kicker: "02",
    title: "Match real teams",
    body: "Showman turns messy intent into booking terms and routes the request toward authorized artist teams.",
  },
  {
    kicker: "03",
    title: "Request a window",
    body: "Availability stays controlled. Bookers ask for time, teams decide what becomes visible, held, or declined.",
  },
] satisfies WorkflowStep[];

export const audienceDoors = [
  {
    label: "Start a request",
    href: "/sign-up",
    eyebrow: "I am booking",
    title: "Bring the brief. Keep the terms clear.",
    body: "For promoters, curators, brands, and rooms trying to put the right artist in the right moment.",
  },
  {
    label: "Set up artist workspace",
    href: "/artists/new",
    eyebrow: "I am an artist or team",
    title: "Control what gets seen before anything gets sent.",
    body: "For artists, managers, and teams who need profile, authority, availability, and request flow in one place.",
  },
] satisfies AudienceDoor[];

export const trustPromises = [
  "Real artist identity and team authority",
  "Controlled access to sensitive booking details",
  "Availability windows that can become holds",
  "Rails ready for contracts and payments later",
];
```

- [ ] **Step 2: Run typecheck against the new module**

Run:

```bash
cd web && npx tsc --noEmit
```

Expected: PASS. No import errors because the module is not consumed yet.

- [ ] **Step 3: Update the build journal**

Append a dated entry to `docs/BUILD-JOURNAL.md`:

```markdown
## 2026-06-26 — Landing brief reset implementation plan

### Decision

- User approved the landing brief reset direction.
- Implementation will start with a frontend-only landing reset rather than backend/API expansion.
- The page will center a living booking brief, privacy-safe scene teasers, the Describe the Gig -> Match real teams -> Request a window spine, two audience doors, and concrete trust promises.

### Guardrails

- Public landing content must not expose real artist booking details.
- Development artist examples are placeholder-only and must be replaced before production launch.
- Build verification must include typecheck, lint, production build, and Playwright desktop/mobile screenshot QA.
```

- [ ] **Step 4: Commit**

Run:

```bash
git add web/lib/landing-content.ts docs/BUILD-JOURNAL.md
git commit -m "docs: plan landing brief reset content"
```

Expected: commit succeeds and does not include unrelated Playwright/design-sync files.

---

### Task 2: Living Booking Brief Hero

**Files:**
- Create: `web/components/landing/living-booking-brief.tsx`
- Modify: `web/app/globals.css`

**Interfaces:**
- Consumes: `landingBrief` from `web/lib/landing-content.ts`
- Produces: default export `LivingBookingBrief(): JSX.Element`

- [ ] **Step 1: Create the client component**

Create `web/components/landing/living-booking-brief.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import { landingBrief } from "@/lib/landing-content";

const parsedTerms = [
  { pattern: /berlin/i, label: "Berlin", tone: "signal" },
  { pattern: /mid-?oct/i, label: "mid-Oct", tone: "plain" },
  { pattern: /90/i, label: "90 min", tone: "plain" },
  { pattern: /(eur|€)\s?8k|8k/i, label: "EUR8k", tone: "signal" },
  { pattern: /travel/i, label: "travel covered", tone: "plain" },
  { pattern: /dj|artist|act/i, label: "verified artist teams", tone: "signal" },
] as const;

export default function LivingBookingBrief() {
  const [brief, setBrief] = useState(landingBrief.prompt);
  const [pointer, setPointer] = useState({ x: 64, y: 42 });

  const chips = useMemo(() => {
    const matches = parsedTerms
      .filter((term) => term.pattern.test(brief))
      .map((term) => ({ label: term.label, tone: term.tone }));

    return matches.length > 0 ? matches : landingBrief.chips;
  }, [brief]);

  return (
    <section
      className="landing-brief"
      style={{
        "--brief-x": `${pointer.x}%`,
        "--brief-y": `${pointer.y}%`,
      } as React.CSSProperties}
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        setPointer({
          x: ((event.clientX - bounds.left) / bounds.width) * 100,
          y: ((event.clientY - bounds.top) / bounds.height) * 100,
        });
      }}
      aria-label="Living booking brief"
    >
      <div className="landing-brief__bar">
        <span>live brief</span>
        <span>private details gated</span>
      </div>

      <label className="sr-only" htmlFor="landing-brief-input">
        Describe a booking request
      </label>
      <textarea
        id="landing-brief-input"
        value={brief}
        onChange={(event) => setBrief(event.target.value)}
        className="landing-brief__input"
        rows={3}
        spellCheck={false}
      />

      <div className="landing-brief__chips" aria-label="Parsed booking terms">
        {chips.map((chip, index) => (
          <span
            key={`${chip.label}-${index}`}
            className={`landing-brief__chip landing-brief__chip--${chip.tone}`}
            style={{ "--chip-index": index } as React.CSSProperties}
          >
            {chip.label}
          </span>
        ))}
      </div>

      <div className="landing-brief__fragments" aria-label="Request state">
        {landingBrief.fragments.map((fragment) => (
          <span key={fragment}>{fragment}</span>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add the brief CSS**

Append these scoped classes to `web/app/globals.css`:

```css
.landing-brief {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 248, 236, 0.16);
  background:
    radial-gradient(circle at var(--brief-x, 64%) var(--brief-y, 42%), rgba(255, 106, 0, 0.34), transparent 12rem),
    linear-gradient(140deg, rgba(255, 248, 236, 0.08), rgba(255, 248, 236, 0.025) 38%, rgba(255, 106, 0, 0.08)),
    #11100e;
  padding: clamp(1rem, 3vw, 1.5rem);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
}

.landing-brief::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image: linear-gradient(rgba(255, 248, 236, 0.055) 1px, transparent 1px);
  background-size: 100% 2.35rem;
  mix-blend-mode: screen;
  opacity: 0.28;
}

.landing-brief__bar,
.landing-brief__fragments {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.75rem;
  color: var(--showman-muted);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.landing-brief__input {
  position: relative;
  z-index: 1;
  margin-top: clamp(2rem, 8vw, 4.75rem);
  width: 100%;
  resize: none;
  border: 0;
  outline: 0;
  background: transparent;
  color: var(--showman-bone);
  font-size: clamp(2rem, 8vw, 5.8rem);
  font-weight: 950;
  line-height: 0.9;
  letter-spacing: 0;
  text-transform: uppercase;
}

.landing-brief__input:focus-visible {
  outline: 2px solid var(--showman-orange);
  outline-offset: 0.4rem;
}

.landing-brief__chips {
  position: relative;
  z-index: 1;
  margin-top: clamp(1.25rem, 4vw, 2.25rem);
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.landing-brief__chip {
  animation: resolve-chip 520ms ease both;
  animation-delay: calc(var(--chip-index, 0) * 70ms);
  border: 1px solid rgba(255, 248, 236, 0.15);
  background: rgba(255, 248, 236, 0.07);
  padding: 0.55rem 0.72rem;
  color: var(--showman-bone);
  font-size: 0.78rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.landing-brief__chip--signal {
  border-color: rgba(255, 106, 0, 0.55);
  background: rgba(255, 106, 0, 0.16);
  color: #ffb06a;
}

.landing-brief__fragments {
  margin-top: clamp(2rem, 6vw, 4rem);
  justify-content: flex-start;
}

@keyframes resolve-chip {
  from {
    opacity: 0;
    transform: translateY(0.5rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .landing-brief__chip {
    animation: none;
  }
}
```

- [ ] **Step 3: Temporarily import the component on the homepage for type validation**

At the top of `web/app/page.tsx`, add:

```tsx
import LivingBookingBrief from "@/components/landing/living-booking-brief";
```

Inside the existing hero section, temporarily render:

```tsx
<LivingBookingBrief />
```

- [ ] **Step 4: Run typecheck**

Run:

```bash
cd web && npx tsc --noEmit
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add web/components/landing/living-booking-brief.tsx web/app/globals.css web/app/page.tsx
git commit -m "feat: add living booking brief"
```

Expected: commit includes only the component, CSS, and temporary homepage integration.

---

### Task 3: Full Landing Composition

**Files:**
- Modify: `web/app/page.tsx`
- Modify: `web/app/globals.css`
- Modify: `docs/BUILD-JOURNAL.md`

**Interfaces:**
- Consumes: `LivingBookingBrief`, `sceneCards`, `workflowSteps`, `audienceDoors`, `trustPromises`
- Produces: completed public landing page at `/`

- [ ] **Step 1: Replace `web/app/page.tsx`**

Replace the file with:

```tsx
import Link from "next/link";
import LivingBookingBrief from "@/components/landing/living-booking-brief";
import { buttonStyles } from "@/components/ui/button";
import {
  audienceDoors,
  sceneCards,
  trustPromises,
  workflowSteps,
} from "@/lib/landing-content";

export default function Home() {
  return (
    <main className="overflow-hidden">
      <section className="relative min-h-[calc(100vh-65px)] px-4 py-10 sm:px-6 lg:py-14">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-end">
          <div className="max-w-xl pb-2 lg:pb-10">
            <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.24em] text-[#ffb06a]">
              Booking infrastructure for live culture
            </p>
            <h1 className="text-5xl font-black uppercase leading-[0.88] tracking-normal text-[var(--showman-bone)] sm:text-7xl lg:text-8xl">
              Bring the brief. Reach the real team.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[var(--showman-muted)] sm:text-lg">
              Showman turns rough booking intent into clear terms, controlled artist access, and request flow for the people putting new scenes on.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/sign-up" className={buttonStyles("primary")}>
                Start a request
              </Link>
              <Link href="/artists/new" className={buttonStyles("secondary")}>
                Set up artist workspace
              </Link>
            </div>
            <p className="mt-5 max-w-md text-sm leading-6 text-[var(--showman-muted)]">
              Public pages create context. Availability, travel terms, fees, and team details stay behind verified access.
            </p>
          </div>
          <LivingBookingBrief />
        </div>
      </section>

      <section className="landing-section landing-section--scene">
        <div className="landing-section__inner">
          <div className="landing-section__head">
            <p>Scene strip</p>
            <h2>Public energy, private booking data.</h2>
          </div>
          <div className="landing-scene-grid">
            {sceneCards.map((card, index) => (
              <article className="landing-scene-card" key={card.name}>
                <div className={`landing-scene-card__media bg-gradient-to-br ${card.palette}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div>
                  <p>{card.role}</p>
                  <h3>{card.name}</h3>
                  <span>{card.caption}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__inner landing-workflow">
          <div className="landing-section__head">
            <p>How it moves</p>
            <h2>From a rough ask to a request a real team can answer.</h2>
          </div>
          <div className="landing-workflow__steps">
            {workflowSteps.map((step) => (
              <article key={step.title}>
                <span>{step.kicker}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__inner">
          <div className="landing-doors">
            {audienceDoors.map((door) => (
              <Link key={door.eyebrow} href={door.href} className="landing-door">
                <span>{door.eyebrow}</span>
                <h2>{door.title}</h2>
                <p>{door.body}</p>
                <strong>{door.label}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--trust">
        <div className="landing-section__inner landing-trust">
          <div className="landing-section__head">
            <p>Trust without sterile walls</p>
            <h2>Raw enough for the scene. Concrete enough for the booking table.</h2>
          </div>
          <ul>
            {trustPromises.map((promise) => (
              <li key={promise}>{promise}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Add landing section CSS**

Append to `web/app/globals.css`:

```css
.landing-section {
  padding: clamp(4rem, 10vw, 8rem) 1rem;
}

.landing-section__inner {
  margin: 0 auto;
  max-width: 80rem;
}

.landing-section__head {
  max-width: 46rem;
}

.landing-section__head > p {
  color: #ffb06a;
  font-size: 0.75rem;
  font-weight: 850;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.landing-section__head h2 {
  margin-top: 0.85rem;
  color: var(--showman-bone);
  font-size: clamp(2.4rem, 7vw, 5.8rem);
  font-weight: 950;
  line-height: 0.9;
  letter-spacing: 0;
  text-transform: uppercase;
}

.landing-scene-grid {
  margin-top: 2rem;
  display: grid;
  gap: 1rem;
}

.landing-scene-card {
  display: grid;
  gap: 1rem;
  border-top: 1px solid var(--showman-line);
  padding-top: 1rem;
}

.landing-scene-card__media {
  min-height: 14rem;
  position: relative;
  overflow: hidden;
}

.landing-scene-card__media::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(115deg, transparent 0 42%, rgba(255, 248, 236, 0.18) 42% 43%, transparent 43%),
    radial-gradient(circle at 72% 18%, rgba(255, 248, 236, 0.22), transparent 10rem);
  mix-blend-mode: screen;
}

.landing-scene-card__media span {
  position: absolute;
  bottom: 0.8rem;
  left: 0.9rem;
  z-index: 1;
  color: rgba(255, 248, 236, 0.72);
  font-size: 0.78rem;
  font-weight: 850;
  letter-spacing: 0.16em;
}

.landing-scene-card p,
.landing-door span {
  color: var(--showman-muted);
  font-size: 0.72rem;
  font-weight: 850;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.landing-scene-card h3 {
  margin-top: 0.35rem;
  color: var(--showman-bone);
  font-size: clamp(2rem, 5vw, 4rem);
  font-weight: 950;
  line-height: 0.9;
  letter-spacing: 0;
  text-transform: uppercase;
}

.landing-scene-card div:last-child > span,
.landing-workflow article p,
.landing-door p {
  display: block;
  margin-top: 0.75rem;
  max-width: 28rem;
  color: var(--showman-muted);
  line-height: 1.65;
}

.landing-workflow__steps {
  margin-top: 2.5rem;
  display: grid;
  gap: 1rem;
}

.landing-workflow article,
.landing-door {
  border-top: 1px solid var(--showman-line);
  padding-top: 1.25rem;
}

.landing-workflow article > span {
  color: #ff6a00;
  font-size: 0.85rem;
  font-weight: 950;
}

.landing-workflow h3,
.landing-door h2 {
  margin-top: 0.9rem;
  color: var(--showman-bone);
  font-size: clamp(1.8rem, 4vw, 3.2rem);
  font-weight: 950;
  line-height: 0.94;
  letter-spacing: 0;
  text-transform: uppercase;
}

.landing-doors {
  display: grid;
  gap: 1rem;
}

.landing-door {
  display: block;
  color: inherit;
  text-decoration: none;
  transition: border-color 180ms ease, background 180ms ease, transform 180ms ease;
}

.landing-door:hover {
  border-color: rgba(255, 106, 0, 0.65);
  background: rgba(255, 106, 0, 0.055);
  transform: translateY(-0.18rem);
}

.landing-door strong {
  display: inline-flex;
  margin-top: 1.5rem;
  color: #ffb06a;
}

.landing-trust {
  display: grid;
  gap: 2rem;
}

.landing-trust ul {
  display: grid;
  gap: 0.85rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.landing-trust li {
  border-bottom: 1px solid var(--showman-line);
  padding: 0 0 0.85rem;
  color: var(--showman-bone);
  font-size: clamp(1.15rem, 2.5vw, 1.65rem);
  font-weight: 800;
}

@media (min-width: 760px) {
  .landing-scene-grid,
  .landing-workflow__steps,
  .landing-doors {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .landing-doors {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .landing-trust {
    grid-template-columns: 0.9fr 1.1fr;
  }
}
```

- [ ] **Step 3: Run static checks**

Run:

```bash
cd web && npx tsc --noEmit
cd web && npm run lint
```

Expected: both PASS.

- [ ] **Step 4: Run production build**

Run:

```bash
cd web && npm run build
```

Expected: PASS. If Turbopack needs to bind an internal local port, rerun with sandbox escalation.

- [ ] **Step 5: Run rendered QA with Playwright**

Start the app on a stable preview port:

```bash
cd web && npm run build && npm run start -- -p 3002
```

In a second command, run a temporary Playwright check from outside committed source. The check should:

```ts
import { chromium, devices } from "@playwright/test";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors: string[] = [];
page.on("console", (message) => {
  if (message.type() === "error") errors.push(message.text());
});
page.on("pageerror", (error) => errors.push(error.message));
await page.goto("http://localhost:3002/", { waitUntil: "networkidle" });
await page.screenshot({ path: "/tmp/showman-landing-reset-desktop.png", fullPage: true });
await page.getByLabel("Describe a booking request").fill("Need a live act in Atlanta next month around EUR8k with travel covered.");
await page.screenshot({ path: "/tmp/showman-landing-reset-interaction.png", fullPage: false });

const mobile = await browser.newPage({ ...devices["iPhone 15"], colorScheme: "dark" });
await mobile.goto("http://localhost:3002/", { waitUntil: "networkidle" });
await mobile.screenshot({ path: "/tmp/showman-landing-reset-mobile.png", fullPage: true });
await browser.close();

if (errors.length > 0) {
  throw new Error(errors.join("\n"));
}
```

Expected: screenshots exist; no framework overlay; no console/page errors; brief input remains usable; no mobile overlap.

- [ ] **Step 6: Update build journal**

Append:

```markdown
## 2026-06-26 — Landing brief reset implementation

### Implemented

- Replaced the generic split hero with a living booking brief and privacy-safe CTAs.
- Added scroll depth with scene teasers, product workflow, two audience doors, and trust promises.
- Kept development artist references as placeholder-only copy/visual blocks instead of remote likeness assets.

### Verification

- Typecheck: pending result.
- Lint: pending result.
- Production build: pending result.
- Playwright desktop/mobile screenshots: pending result.

### Remaining

- Replace placeholder visual blocks with user-supplied local development images or approved real launch artists.
- Redesign public artist access so anonymous visitors cannot view sensitive profile/availability data.
```

Replace each `pending result` with actual results before committing.

- [ ] **Step 7: Commit**

Run:

```bash
git add web/app/page.tsx web/app/globals.css docs/BUILD-JOURNAL.md
git commit -m "feat: reset landing page around booking brief"
```

Expected: commit succeeds and does not stage unrelated root Playwright/design-sync files.

---

## Self-Review

- Spec coverage: hero brief, orange cursor light, resolving chips, scene strip, workflow, two doors, trust section, private-data guardrails, reduced-motion CSS, and Playwright desktop/mobile QA are covered.
- Placeholder scan: the only intentional placeholder language is the required dev-only artist/sample warning; there are no implementation `TODO` or `TBD` gaps.
- Type consistency: `BriefChip`, `SceneCard`, `WorkflowStep`, and `AudienceDoor` exports are consumed by the page/component exactly as named.
