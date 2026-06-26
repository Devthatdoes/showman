# showman Build Journal

Persistent notes for the design and build process. Each entry should capture the turn's intent, decisions, open questions, and links to any specs, plans, or implementation changes. This is not a replacement for the foundation docs; it is the working memory between them and the code.

## 2026-06-25 — Visual foundation kickoff

### Context

- Current production app is a Phase 0 Next.js app with auth, user-owned `ArtistProfile`s, and manual availability windows.
- `~/incubator/ui-testing` provides visual direction: a raw, music-native gallery style inspired by DICE energy and FARFETCH editorial card systems.
- The desired first increment is visual polishing and design-system grounding before larger features are added.
- Future iOS/mobile support matters. The web app should not bury product behavior so deeply in page components that a Swift client later has no stable backend/API surface to use.

### Working Direction

- Start with a foundational visual pass over the existing Phase 0 surfaces rather than adding new domain capabilities.
- Treat this as a design-system and product-surface increment: landing, artist discovery/listing, artist profile, auth/account, and shared components.
- Keep copy aligned with the foundation strategy: direct booking infrastructure that empowers artists and their teams, not "no middleman" disintermediation language.
- Begin shaping toward API-first without prematurely splitting the app: isolate data access and domain operations behind small server-side modules, then expose formal route handlers when mobile needs them.

### Open Questions

- Which visual direction should be the baseline: raw/high-energy, editorial/professional, or a hybrid?
- How far should the first increment go beyond styling: shared UI tokens only, or also component/data-boundary cleanup?
- Should the first API-first step be documentation-only, internal service boundaries, or public JSON endpoints for artist discovery/profile reads?

### Companion

- Visual brainstorming companion started for mockups and architecture diagrams.

## 2026-06-25 — Visual direction feedback

### Decision Signal

- User prefers the message and product posture of **Raw Gallery** over Editorial Marketplace and Trust Console.
- The direction should keep the music-native, artist-led, direct-booking energy.
- The first mockup's small top text treatment (`SHOWMAN` / `VERIFIED`) was disliked and should not become the brand/header pattern.

### Refinement Needed

- Explore Raw Gallery with a calmer, more premium brand/header treatment.
- Keep some editorial restraint from the FARFETCH reference without making the product feel like fashion publishing.
- Revisit palette: raw red can remain as an accent candidate, but the first mockup's color balance is not approved.

## 2026-06-25 — Bold orange palette prompt

### Design Prompt

- User asked to explore a bolder contrasting color option, specifically orange.
- Direction: keep Raw Gallery's music-native confidence, but test orange as a stronger brand accent than red.
- Constraint: orange should create energy and recognizability without turning the full surface into a loud one-note palette.

### Feedback

- The limited companion mockup makes exact judgment hard, but the **orange lane has the most potential**.
- Treat orange as the leading direction for the first production pass, subject to real-app validation.
- The production implementation should avoid overcommitting to one exact mockup; it should establish tokens and reusable surfaces that can be tuned after screenshots/browser review.

## 2026-06-25 — First increment scope

### Decision

- Proceed with **Option 3: visual foundation + reusable components + light API-first/internal boundary prep**.

### Rationale

- Full public API-first conversion is deferred because the domain model will change materially once orgs, membership, on-behalf-of authority, verification, booking, holds, and escrow enter the app.
- The first architecture move is internal: extract data access and domain operations from page components/server actions into typed server-side modules so both current pages and future API route handlers can call the same logic.
- Public/mobile-facing API contracts should start with low-risk read surfaces after the visual foundation lands, then expand after authority/RBAC is clearer.

### Subagent Workflow

- Subagent tooling is available in this environment.
- Use subagents after the design/spec stage for independent, non-overlapping work: component/page polish, internal boundary extraction, or focused verification.
- Avoid parallel workers on shared files unless the plan assigns disjoint write ownership.

## 2026-06-25 — Voice refinement

### Direction

- Voice should sit between institutional trust and raw music-culture energy.
- Keep the verified/direct booking message, but make it feel like infrastructure for the next wave of artists, managers, promoters, curators, and live-culture builders.
- Avoid "no middleman" because it conflicts with the agent/manager strategy.
- Avoid the word "democratize" because it can carry unwanted connotations.

### Candidate Voice

- "Booking infrastructure for the next wave of live culture."
- "Verified artist booking for the people building what comes next."
- "Direct access to real artist teams, real availability, and serious booking rails."
- "A booking layer for artists, teams, and curators moving live culture forward."

### User Language To Preserve

- It should feel like it belongs to the people making new music scenes happen.
- It should stay trustworthy enough for money, contracts, and professional booking.
- The language can be raw and alive, but the promise stays concrete.
- Big on real artists, pushing the needle, pushing the culture, and putting people on.

## 2026-06-25 — Component direction accepted

### Decision

- Establish a small reusable visual system before restyling pages.
- Include app shell/header, buttons, cards, forms, pills/badges, and page scaffolds.
- Apply the system to existing Phase 0 surfaces only.

### Notes

- Orange is the primary action/accent candidate.
- The UI should be image-ready but not dependent on real artist imagery for this first production pass.
- Empty or sparse states should feel intentional rather than unfinished.

## 2026-06-25 — Spec approved and implementation planning

### Status

- User approved `docs/superpowers/specs/2026-06-25-visual-foundation-api-prep-design.md`.
- Implementation planning began using the `superpowers:writing-plans` workflow.

### Planning Shape

- Split implementation into tasks that can be reviewed independently:
  - Internal catalog server boundary.
  - Shared visual tokens and UI components.
  - Page-level polish on current Phase 0 surfaces.
  - Verification, screenshots/browser review, and documentation update.
- Favor subagent-driven execution after the plan is approved, with disjoint file ownership per task.

## 2026-06-25 — Visual foundation implementation

### Shipped

- Added internal catalog server boundary for profile and availability reads/writes.
- Added reusable UI primitives for buttons, panels, fields, and badges.
- Restyled current Phase 0 public, auth, owner, and availability surfaces around the carbon/bone/orange Raw Gallery direction.
- Removed the remote Google font build dependency by switching to local system font tokens.
- Set the Turbopack root explicitly in `web/next.config.ts`.

### Verification

- Typecheck: passed (`cd web && npx tsc --noEmit`).
- Lint: passed (`cd web && npm run lint`).
- Migration: passed (`cd web && DATABASE_URL=postgresql://showman:showman@localhost:5432/showman npx tsx db/migrate.ts`).
- Build: passed (`cd web && npm run build`, with sandbox escalation required because Turbopack binds a local internal port).
- Gate tests: passed (`8/8` via `start-server-and-test` on port `3001` with explicit `DATABASE_URL`, `BASE_URL`, and `BETTER_AUTH_URL`).
- HTTP smoke: passed for `/`, `/artists`, `/artists/limmi-sendrixx`, `/sign-in`, and `/sign-up`.
- Browser/visual screenshots: not run. Browser plugin is unavailable in this session and Playwright is not installed locally; no dependency was added for this pass.

### Follow-Ups

- Run a real browser screenshot QA pass once Browser plugin or Playwright is available.
- Tune exact orange shade, density, and mobile spacing after screenshot review.
- Public JSON read endpoints for artist discovery/profile after visual foundation stabilizes.
- Org/RBAC planning remains the next major domain increment.
