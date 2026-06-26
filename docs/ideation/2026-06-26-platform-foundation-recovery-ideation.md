---
date: 2026-06-26
topic: platform-foundation-recovery
focus: account onboarding database dashboard model
mode: repo-grounded
---

# Ideation: Platform Foundation Recovery

## Grounding Context

The foundation docs already define the platform as a two-sided booking infrastructure where `User` is the human actor and `Org`, `ArtistProfile`, and `BookerProfile` are the principals that hold reputation, money, authority, and deal state. The current implementation has started to add `Org`, `Membership`, `BookerProfile`, `BookerEvent`, `BookingRequest`, and `Event`, but the visible account/onboarding experience still behaves like a signed-in user chooses one global side.

The recovery work needs to stop reinforcing account-level roles and instead make the product legible as principal/workspace-based infrastructure.

## Topic Axes

- Identity and workspace routing
- Booker onboarding and trust dossier
- Artist/team onboarding and roster ownership
- Database/model cleanup
- Test and documentation guardrails

## Ranked Ideas

### 1. Workspace Switcher as the Account Home

**Description:** Replace the current account hub with a principal-derived workspace selector. It lists active org memberships, personal booker profiles, and setup paths for missing capabilities.  
**Axis:** Identity and workspace routing  
**Basis:** `direct:` `/account` currently shows both dashboards unconditionally, while the docs say authority is per-principal via membership.  
**Rationale:** This fixes the user's visible bug and establishes the right mental model for every later dashboard.  
**Downsides:** Requires a small amount of empty-state design so a brand-new user is not dumped into a blank selector.  
**Confidence:** 95%  
**Complexity:** Medium

### 2. Account Creation Becomes Account-Only

**Description:** Remove the binary "artist/team vs booker/promoter" sign-up choice. After sign-up, onboarding asks what workspace or principal the user wants to create or join.  
**Axis:** Identity and workspace routing  
**Basis:** `direct:` `user.onboarding_intent` conflicts with the docs' actor/principal model and causes side selection to masquerade as identity.  
**Rationale:** A human can manage artists, book artists, or do both through different principals. Sign-up should not pre-decide that.  
**Downsides:** Needs the onboarding page to become more thoughtful because sign-up no longer hides that complexity.  
**Confidence:** 90%  
**Complexity:** Medium

### 3. Org-Backed Booker Profiles

**Description:** Let bookers create either a personal buyer profile or a workspace-backed buyer profile for a venue, festival, promoter, agency, or label.  
**Axis:** Booker onboarding and trust dossier  
**Basis:** `direct:` docs state one org can own multiple booker profiles, but current code always creates one individual profile per user.  
**Rationale:** This makes booker-side value real for professional buyers instead of treating every buyer as a solo account.  
**Downsides:** Requires schema/service changes and clear UI language around "who is asking."  
**Confidence:** 92%  
**Complexity:** Medium

### 4. Booker Dossier Builder

**Description:** Expand booker onboarding into a dossier: logo/image, website, social links, buyer type, markets, venue/event affiliations, track record, and structured credibility.  
**Axis:** Booker onboarding and trust dossier  
**Basis:** `direct:` docs describe `BookerProfile` as what artists use to size up a request; current form only collects a few text fields.  
**Rationale:** Artist teams will not trust a money-moving booking request from an empty text-only profile.  
**Downsides:** Upload/storage work must be done carefully and later verification/KYB fields should not be faked as completed trust.  
**Confidence:** 88%  
**Complexity:** Medium

### 5. New Artist Profiles Always Attach to a Workspace

**Description:** Keep legacy `owner_user_id` reads for old rows, but make new artist creation select or create an owning org. Self-managed artists become one-person orgs.  
**Axis:** Artist/team onboarding and roster ownership  
**Basis:** `direct:` foundation doc 07 chooses self-managed artists as degenerate orgs; current code still privileges direct user ownership.  
**Rationale:** This prevents the next wave of code from compounding the temporary ownership scaffold.  
**Downsides:** Existing edit/delete authorization must support both legacy and org-owned profiles during transition.  
**Confidence:** 86%  
**Complexity:** Medium

### 6. Public Projection Contract

**Description:** Define and enforce a narrow public artist profile projection separate from signed-in verified-user detail views.  
**Axis:** Database/model cleanup  
**Basis:** `direct:` docs call out legal names, floors, raw calendars, payment details, and actor identities as private; user specifically objected to public booking/location details.  
**Rationale:** This avoids repeatedly leaking implementation fields into public pages because they are convenient to query.  
**Downsides:** Requires deciding which market/location hints are acceptable on public cards.  
**Confidence:** 82%  
**Complexity:** Low

### 7. Route Tests for Actor/Principal Cases

**Description:** Add tests for booker-only, artist-team-only, dual org, and no-workspace accounts across `/account`, `/team`, `/booker`, onboarding, and request creation.  
**Axis:** Test and documentation guardrails  
**Basis:** `direct:` the visible regression came from missing account routing coverage.  
**Rationale:** These tests catch the exact whack-a-mole pattern before manual testing does.  
**Downsides:** Requires seed helpers for memberships and booker profiles.  
**Confidence:** 90%  
**Complexity:** Low

## Rejection Summary

| # | Idea | Reason Rejected |
|---|------|-----------------|
| 1 | Keep separate team/booker dashboards and only tweak copy | Duplicates the current confusion; copy cannot fix the wrong routing model. |
| 2 | Build escrow/payment next | Too far downstream while account/principal routing is broken. |
| 3 | Add more public landing-page polish first | UI quality matters, but this issue is now architectural and will keep surfacing. |
| 4 | Make all users dual-capability by default | Recreates the same dashboard confusion under a different label. |
| 5 | Hide booker until verification exists | Blocks useful demand-side workflow and ignores staged onboarding in the docs. |

