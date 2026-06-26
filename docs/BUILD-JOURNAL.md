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

## 2026-06-25 — Review follow-up

### Adjusted

- Tightened public/account copy so the UI stays Phase 0-safe: profiles, availability, ownership, and future booking rails, without promising escrow, holds, org/RBAC, or on-behalf-of workflows in the current app.
- Updated `web/README.md` to reflect the local system font stack after removing `next/font`.

### Review Notes

- Final subagent review found no critical issues.
- Re-verification after review fixes: typecheck passed, lint passed, production build passed, gate tests passed `8/8`, and HTTP smoke passed for `/`, `/artists`, `/artists/limmi-sendrixx`, `/sign-in`, and `/sign-up`.
- Remaining important review item is true browser/mobile screenshot QA. This environment has no Browser plugin, no local Playwright/Puppeteer package, and no system Chrome/Firefox binary, so screenshot QA is still blocked without adding tooling.

## 2026-06-25 — Auth preview fix and design correction feedback

### User Feedback

- Current visual foundation still reads too generic/static and too close to common quick-generated app design.
- Landing page needs actual scroll depth, scene energy, examples, movement, and a less suffocated feel.
- Public artist surfaces should not expose real artist profile details, availability, booking details, or location/market data to anonymous visitors.
- The `~/incubator/ui-testing` prototype at `http://localhost:8000/` remains an important vibe reference: fluid cursor/background energy, grain, reveal motion, breathing room, and a search-as-entry utility.
- Temporary development artist examples may use ASAP Rocky, Fakemink, and PinkPantheress imagery in that order, but this must be clearly treated as development-only placeholder content and never production launch material.

### Debugging

- Sign-in/sign-up failed on the stable production preview because Better Auth rejected `Origin: http://localhost:3002`.
- Root cause: local `.env` had `BETTER_AUTH_URL=http://localhost:3000`, while the stable preview was running on `3002`.
- Added local trusted origins for `3000`, `3001`, and `3002`, with `BETTER_AUTH_TRUSTED_ORIGINS` override support.

### Verification

- Typecheck passed after the auth fix.
- Lint passed after the auth fix.
- Production build passed after the auth fix.
- Playwright is now installed locally. A Playwright browser pass confirmed sign-up from `http://localhost:3002/sign-up` succeeds and lands on `/account`.
- Playwright screenshots captured current app desktop/mobile and the `localhost:8000` prototype for visual comparison.

## 2026-06-25 — Availability and location UX repair

### User Feedback

- Availability management felt almost unusable because the native date picker affordance was visually hidden and the visible calendar was not clickable.
- `Open` / `Blocked` language and badge styling felt generic.
- Free-text `market` entry is not enough for future search or matching; misspellings and spacing differences would make location matching brittle.
- Artist profile creation still feels under-customized and should eventually support richer identity, imagery, socials/media, booking regions, and travel terms.
- The `ui-testing/showman-v2` prototype remains a reference for smoother, less boxed interactions: clear focus states, breathing room, animated/revealed surfaces, and a human booking flow.

### Implemented

- Added `web/lib/booking-locations.ts` with curated starter booking-location groups and travel-policy options.
- Replaced the availability page's old black native date fields plus display-only calendar with a clickable two-month availability composer.
- Composer now supports date-range selection, `Taking requests` / `Not accepting` posture, structured location chips, travel terms, internal note, and hidden fields that submit through the existing server action.
- Updated native date/select affordances so any fallback date input has visible pointer/calendar behavior.
- Restyled status badges away from generic admin-state wording.
- Kept the database unchanged for this pass: `market` stores the selected location label, and travel policy is stored in the existing note text. A real location/search schema remains a future design task.

### Verification

- Typecheck passed (`cd web && npx tsc --noEmit`).
- Lint passed (`cd web && npm run lint`).
- Production build passed (`cd web && npm run build`).
- Gate tests passed `8/8` on port `3001`.
- Playwright availability flow passed on port `3002`: sign up, seed owned test artist, open availability management, click a date range, select `New York, NY`, select travel terms, submit, and confirm the window appears.
- Playwright screenshots captured desktop before/after and mobile at `/tmp/showman-availability-repair`.

## 2026-06-26 — Landing brief reset implementation plan

### Decision

- User approved the landing brief reset direction after the PPTX/wireframe review.
- Created `docs/superpowers/plans/2026-06-26-landing-brief-reset.md` as the execution plan for the next build slice.
- Start with a frontend-only homepage reset rather than pulling API-first work forward into this pass.

### Planned Shape

- Central product moment: a living booking brief that turns a rough gig ask into structured terms.
- Scroll depth: privacy-safe scene strip, Describe the Gig -> Match real teams -> Request a window workflow, two audience doors, and a concrete trust section.
- Visual direction: sharper orange signal over obsidian/bone surfaces, fewer decorative boxes, more editorial scale and motion.

### Guardrails

- Public landing content must not expose real artist booking details.
- Development artist examples stay placeholder-only until the user supplies local approved assets or real launch artists.
- Verification must include typecheck, lint, production build, and Playwright desktop/mobile screenshot QA.

### Follow-Ups

- Existing gate tests still assert anonymous users can view full artist profiles; this needs to change when public/private artist access is redesigned.
- The new artist form did not reliably redirect in one headless browser attempt; investigate during the profile customization pass.
- Design a real structured location model before relying on location search/matching in production.
- Full landing page and public artist directory still need the Living Raw Gallery redesign pass.

## 2026-06-25 — PPTX wireframe read

### Artifact

- Reviewed `Showman_Wireframes.pptx`, a one-slide IA/flow wireframe map.
- The deck compares five possible product spines and three landing entry treatments.

### Wireframe Directions

- **A · The Deal Pipeline**: shared booking pipeline for managers, bookers, and artists. Best when the core value is replacing messy email threads with a clean source of truth.
- **B · Swipe the Scene**: discovery-first artist feed with quick-book sheet. Best when taste, momentum, and culture-native browsing are the primary magic.
- **C · Book the Window**: calendar-first availability and request flow. Best when the pain is scheduling chaos across artists, travel, holds, and open windows.
- **D · Roster HQ**: manager/org workspace where independent artists are an org of one. Best as a durable operating model for artists, managers, teams, and future RBAC.
- **E · Describe the Gig**: plain-language booking brief parsed into structured terms, ranked matches, and a shared offer object. Most novel and closest to a differentiated booking workflow.
- **F · Landing variants**: search-first, live-scene proof/momentum, and two-door entry for bookers vs. artists/teams.

### Product Read

- Current implementation has mostly been moving along **C** because availability was the immediate broken workflow.
- The strongest longer-term architecture likely combines **E + D + C**: a brief bar creates structured booking intent, the org/roster workspace owns operations, and calendar windows/holds become the scheduling substrate.
- **B** remains valuable for the public/creative feel, especially landing and discovery, but should not expose sensitive artist details to anonymous visitors.
- Wireframe copy includes some "no middleman" language; keep the structure, but adapt voice to the previously approved position: real artists, real teams, direct booking infrastructure, not anti-manager framing.

## 2026-06-26 — Landing page taste reset spec

### Decision

- User approved **Option 3: Product Spine Reset** and asked to start with the landing page.
- The landing page should become the first expression of the future **Describe the Gig + Roster HQ + Book the Window** product spine, not a standalone marketing hero.

### Design Direction

- Signature interaction: a living booking brief that visually resolves plain-language gig intent into structured terms.
- Public surface should carry scene energy and dev-only examples without exposing real artist booking details.
- Landing composition should move away from split dark-SaaS hero/card patterns and toward a more spatial, music-native, motion-led front door.
- Orange remains the signal color, but should act like live infrastructure/status rather than a blanket theme.

### Artifact

- Added spec: `docs/superpowers/specs/2026-06-26-landing-brief-reset-design.md`.

### Implementation Boundary

- Next pass should focus on `/` plus landing-specific components/data only.
- Do not add production celebrity likenesses, database tables, paid assets, or public booking APIs in this pass.
- Public/private artist access remains a follow-up, but the landing reset must not introduce new detail leaks.
