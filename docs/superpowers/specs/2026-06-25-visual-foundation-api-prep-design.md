# Visual Foundation and API-First Prep Design

Date: 2026-06-25
Status: Draft for user review

## 1. Goal

Establish showman's first production design foundation while lightly preparing the app for future API-first and iOS work.

This increment should make the existing Phase 0 app feel intentional and extensible without adding new domain capabilities. It covers the current surfaces only: home, artist directory, artist profile, create/edit profile, availability management, auth, account, and the shared app shell.

## 2. Product Voice

showman should feel like it belongs to the people making new music scenes happen while staying trustworthy enough for money, contracts, and professional booking.

The voice is raw and alive, but the promise stays concrete:

- Real artists and authorized teams.
- Real availability.
- Direct booking infrastructure.
- Professional rails for artists, managers, promoters, curators, venues, and live-culture builders pushing the culture forward.

Avoid language that frames agents or managers as enemies. Do not use "no middleman," "disrupt the industry," or "democratize." The product strategy is to aid artist teams and representatives, not route around them.

Candidate voice anchors:

- "Booking infrastructure for the next wave of live culture."
- "Verified artist booking for the people building what comes next."
- "Direct access to real artist teams, real availability, and serious booking rails."
- "A booking layer for artists, teams, and curators moving live culture forward."

## 3. Visual Direction

The visual direction is **Raw Gallery with carbon, bone, and orange**.

The app should feel music-native, direct, confident, and image-ready. It should borrow energy from the `~/incubator/ui-testing/showman-v2` prototype, but avoid the loud `SHOWMAN / VERIFIED` header treatment and avoid making the UI feel like a club flyer.

Design principles:

- Carbon/dark base with bone/off-white text.
- Orange as the signature action and accent color.
- Artist imagery should eventually carry much of the emotion, but the first pass must work without real image assets.
- Layouts should be mobile-first and iOS-aware.
- Sparse data states should feel intentional, not unfinished.
- Trust signals should be concrete and restrained.

Orange should be used for primary action, focus, key accents, and future confirmation/booking moments. It should not dominate every surface.

## 4. Component System

Create a small reusable UI foundation before restyling pages.

Initial components and patterns:

- App shell/header: quiet `showman` wordmark, mobile-friendly navigation, session-aware actions.
- Buttons/links: primary orange, secondary bone/outline, muted text links, destructive affordances.
- Cards/panels: artist cards, profile panels, account profile rows, availability rows/windows.
- Forms: inputs, selects, textareas, labels, help text, error text.
- Pills/badges: genres, availability status, future verification/provenance states.
- Page scaffolds: shared content widths, section rhythm, empty states, and background treatment.

The component system should be practical and local. Do not introduce a full third-party design system in this increment.

## 5. Page Scope

Apply the visual foundation to:

- `/`: a functional, product-forward landing page that points into artist discovery and profile creation.
- `/artists`: image-ready artist discovery/listing with genre and market metadata.
- `/artists/[slug]`: public artist profile with bio, genres, home market, and upcoming availability.
- `/artists/new` and `/artists/[slug]/edit`: profile forms using shared form styles.
- `/artists/[slug]/availability`: owner-only availability management using shared form/card/status styles.
- `/sign-in` and `/sign-up`: auth pages that match the production visual system.
- `/account`: account summary and owned profiles.
- Shared header in `components/site-header.tsx`.

No new booking, payment, org, verification, or search/filtering capability is in scope.

## 6. API-First Prep

This increment should prepare for future API-first architecture without exposing a full public mobile API yet.

Current pages and actions query Drizzle directly. Introduce a small server-side catalog/profile boundary so pages, server actions, and future route handlers can share the same logic.

Proposed structure:

- `web/server/catalog/queries.ts`
  - `listArtistProfiles`
  - `getArtistProfileBySlug`
  - `getUpcomingAvailabilityForArtist`
  - `listAvailabilityForOwnedArtist`
- `web/server/catalog/mutations.ts`
  - `createArtistProfileForUser`
  - `updateOwnedArtistProfile`
  - `deleteOwnedArtistProfile`
  - `addOwnedAvailabilityWindow`
  - `deleteOwnedAvailabilityWindow`
- `web/server/catalog/types.ts`
  - page/API-oriented view models and input types where useful.

The web app should call these server functions instead of embedding database access throughout pages and actions.

Out of scope for now:

- Full `/api/v1` route contract.
- Mobile auth/JWT/session redesign.
- GraphQL, tRPC, or RPC framework selection.
- Booking/payment/verification/org API shapes.

Rationale: the domain model will change significantly once organizations, memberships, on-behalf-of authority, verification, booking, holds, escrow, disputes, and confirmations enter the app. Locking a public API too early would likely create churn. Internal boundaries now provide most of the architectural benefit without freezing immature contracts.

## 7. Testing and Verification

Keep existing CI gates intact:

- Typecheck.
- Lint.
- Migrations.
- Build.
- Existing auth/ownership gate integration tests.

Add or adjust tests only where the internal extraction introduces meaningful behavior or authorization risk. Most visual work should be verified through browser review and screenshots after implementation.

Specific verification expectations:

- Anonymous users can still view public artist pages.
- Anonymous users are still redirected from account/create/edit/availability management surfaces.
- Owners can still manage their profiles and availability.
- Non-owners still cannot manage another artist's profile or availability.
- The app remains usable on mobile-width viewports.

## 8. Subagent Workflow

Subagents may be used during planning and implementation if tasks have clean ownership.

Likely safe splits:

- UI foundation/components.
- Page-level polish.
- Server catalog boundary extraction.
- Focused verification/review.

Avoid parallel workers on the same files unless the implementation plan explicitly assigns disjoint write ownership. The main agent remains responsible for integration, tests, browser review, and final coherence.

## 9. Non-Goals

- No new database tables.
- No new booking flow.
- No payment, escrow, dispute, or contract work.
- No verification/provenance implementation.
- No organization/RBAC implementation.
- No production mobile API.
- No native iOS code.
- No design dependency on external images being available.

## 10. Success Criteria

The increment is successful when:

- The current app has a coherent visual foundation aligned with the Raw Gallery carbon/bone/orange direction.
- Shared components reduce repeated ad hoc styling across current pages.
- Current Phase 0 functionality remains intact.
- Page-level data access and mutations are routed through a small internal catalog boundary rather than scattered Drizzle calls.
- The build journal and implementation plan reflect the design decisions and any deviations discovered during implementation.
