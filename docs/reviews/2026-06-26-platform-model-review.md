# Code Review Results

**Scope:** current working tree, focused on database schema, account routing, onboarding, and booker/team workflow  
**Intent:** identify why the app currently violates the platform's actor/principal model and produces confusing dashboards/onboarding  
**Mode:** interactive, report-only

**Reviewers:** correctness, security/authz, data-model, product-architecture, UX-copy
- data-model -- schema and service shape now include `Org`, `Membership`, `BookerProfile`, and `BookingRequest`
- security/authz -- workspace/dashboard access is authority-sensitive
- UX-copy -- onboarding copy and entry points currently shape the wrong mental model

### P1 -- High

| # | File | Issue | Reviewer | Confidence |
|---|------|-------|----------|------------|
| 1 | `web/app/account/page.tsx:45` | Every signed-in user sees every dashboard | correctness, UX-copy | 100 |
| 2 | `web/db/auth-schema.ts:10` | Binary intent stored as account identity | data-model, product-architecture | 100 |
| 3 | `web/server/identity/mutations.ts:93` | Booker creation is personal-only | data-model | 100 |
| 4 | `web/components/sign-up-form.tsx:55` | Sign-up asks users to pick a side | UX-copy, product-architecture | 100 |
| 5 | `web/server/booking/queries.ts:66` | Booker drafts leak to artist teams | correctness, security/authz | 100 |
| 6 | `web/server/identity/authorize.ts:7` | Direct artist ownership bypass remains primary | security/authz, data-model | 75 |
| 7 | `web/app/sign-up/actions.ts:13` | Intent save can silently miss new sessions | correctness | 75 |

- **#1** -- `/account` renders `Team dashboard` and `Booker dashboard` links unconditionally. A booker-only account is therefore pushed toward the team dashboard even when no team principal exists. Fix direction: render actual workspaces and principals from `getActorWorkspace`, then show setup CTAs only for missing lanes.
- **#2** -- `user.onboarding_intent` treats artist/booker as a single account-level role. The docs define `User` as the actor and `Org`/`ArtistProfile`/`BookerProfile` as principals. Fix direction: keep account state actor-only and move workflow identity to workspace/principal records.
- **#3** -- `ensureBookerProfileForUser` always inserts `type: "individual"` with required `ownerUserId`, while docs require personal and org-backed buyer principals. Fix direction: support `BookerProfile` creation under an existing or newly-created `Org`, and allow multiple profiles per org.
- **#4** -- Sign-up asks "How are you entering Showman?" as a mutually exclusive artist/team vs booker choice. That creates the exact wrong expectation for an account that may manage artists and book talent. Fix direction: make sign-up account-only; move "create/join workspace" to onboarding.
- **#5** -- `createBookingRequestForUser` stores both `draft` and `request_sent` rows with an `artistId`, but `listInboundRequestsForArtistTeam` selects all requests for manageable artists without filtering to `request_sent`. Private booker drafts can therefore show in `/team`. Fix direction: filter artist-team inbound queues to sent/visible request states and add a regression test.
- **#6** -- `canManageArtist` grants direct authority through `artist.ownerUserId` before checking org membership. That is acceptable only as migration scaffolding. Fix direction: new profile creation should always attach to an org, and direct owner checks should be isolated as legacy compatibility.
- **#7** -- sign-up calls Better Auth and then separately calls `saveOnboardingIntent`, which depends on the newly established session being readable. If not, it returns without error and leaves the client pending/ambiguous. Fix direction: remove the post-sign-up intent write or make onboarding URL/state explicit and recoverable.

### P2 -- Moderate

| # | File | Issue | Reviewer | Confidence |
|---|------|-------|----------|------------|
| 8 | `web/components/onboarding/onboarding-flow.tsx:33` | "Demand side" is internal jargon | UX-copy | 100 |
| 9 | `web/components/onboarding/onboarding-flow.tsx:53` | Booker dossier lacks trust fields | UX-copy, data-model | 100 |
| 10 | `web/components/team/team-dashboard.tsx:19` | Team dashboard is artist-only | product-architecture | 75 |
| 11 | `web/app/artists/[slug]/page.tsx:75` | Public projection may leak market detail | security/authz, product-architecture | 75 |
| 12 | `web/app/artists/[slug]/page.tsx:120` | "Request access" undersells booking request | UX-copy | 75 |

### Actionable Findings

| # | File | Issue | Route | Notes |
|---|------|-------|-------|-------|
| 1 | `web/app/account/page.tsx:45` | Every signed-in user sees every dashboard | `gated_auto -> downstream-resolver` | Use workspace/principal-derived cards and suppress unavailable dashboards |
| 2 | `web/db/auth-schema.ts:10` | Binary intent stored as account identity | `manual -> downstream-resolver` | Requires migration path and onboarding redesign |
| 3 | `web/server/identity/mutations.ts:93` | Booker creation is personal-only | `manual -> downstream-resolver` | Requires schema/service changes for org-backed booker profiles |
| 4 | `web/components/sign-up-form.tsx:55` | Sign-up asks users to pick a side | `gated_auto -> downstream-resolver` | Account creation can be simplified before workspace onboarding |
| 5 | `web/server/booking/queries.ts:66` | Booker drafts leak to artist teams | `gated_auto -> downstream-resolver` | Filter inbound queues to sent/visible states and add a test |
| 6 | `web/server/identity/authorize.ts:7` | Direct artist ownership bypass remains primary | `manual -> downstream-resolver` | Keep legacy reads but make new writes org-owned |
| 7 | `web/app/sign-up/actions.ts:13` | Intent save can silently miss new sessions | `gated_auto -> downstream-resolver` | Remove or make non-critical once onboarding stops depending on it |

### Coverage

- Residual risks: no browser re-test was run in this review pass because no product code was changed.
- Testing gaps: current tests should add account routing cases for booker-only, artist-team-only, and dual-capability users.
- Untracked workflow files are part of the current local work and were reviewed as current implementation surface, not as merged baseline.

---

> **Verdict:** Not ready for another feature pass until the actor/principal routing is corrected.
>
> **Reasoning:** The schema has useful pieces, but the app still routes by signed-in user and binary intent instead of actual principals. It also exposes private booker drafts to artist teams. That creates exactly the confusing dashboard and workflow behavior reported in manual testing.
>
> **Fix order:** draft visibility filter -> account workspace selector -> remove account-level side choice -> org-backed booker profiles -> richer booker onboarding -> public projection cleanup.
