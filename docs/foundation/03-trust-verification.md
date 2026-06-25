# 03 — Trust & Verification ⭐ (the priority deep-dive)

> Part of the **showman** foundation doc set (`docs/foundation/`). This is the **trust layer** — the load-bearing reason the marketplace can exist at all. `init-jot` names verification as *"the entire basis of trust of this software"* and flags *"unserious people or spam"* as the top operational fear. This doc is the detailed answer to both.
>
> **Scope of this doc:** *how trust is established, what the badges mean, the verification state machines, and the abuse/threat scenarios they defeat.* It owns the **behavior** of verification; the **entities** it acts on (`User` KYC, `Org` KYB, `Membership` counter-signature, `Integration` as verification source, provenance on `ArtistProfile`/`BookerProfile`) are defined in [`02-domain-model.md`](./02-domain-model.md) and must not be re-derived here.
>
> **What this doc deliberately does NOT cover** (cross-reference, don't duplicate):
> - The strategic *why* of verification-as-wedge → [`01-vision-strategy.md`](./01-vision-strategy.md)
> - The money mechanics of the deposit hold that backs a request → [`04-payments-escrow-disputes.md`](./04-payments-escrow-disputes.md)
> - What happens *after* a request is sent (the deal state machine) → [`05-negotiation-deal-lifecycle.md`](./05-negotiation-deal-lifecycle.md)
> - The `Membership` **role** permission matrix → [`07-roster-org-rbac.md`](./07-roster-org-rbac.md)
> - Where verification badges and reputation surface in discovery → [`08-profiles-pitches-discovery.md`](./08-profiles-pitches-discovery.md)
> - Secrets/PII handling for verification documents and OAuth tokens → [`09-system-architecture.md`](./09-system-architecture.md)
> - Trust & safety *staffing*, queues, and SLAs as a GTM/ops function → [`11-gtm-liquidity-trust-safety-ops.md`](./11-gtm-liquidity-trust-safety-ops.md)
>
> **Legal flag, not legal advice.** Several items here (ID-document retention, KYB obligations, biometric/selfie handling, sanctions screening) touch regulated territory. They are marked **⚖️ LEGAL FLAG** where they appear and are carried into [`12-roadmap-risks-open-questions.md`](./12-roadmap-risks-open-questions.md). showman offloads the regulated *custody and KYC machinery* to Stripe/Persona; it does not thereby become a compliance authority.

---

## 0. The thesis: trust is three problems, not one

The single biggest modeling error a marketplace like this can make is to treat "trust" as one checkbox — a blue tick that means "we looked at this account and it's fine." That conflation is fatal here, because the represented-artist tier has **three structurally different trust questions**, each with a different adversary, a different proof mechanism, and a different failure mode:

| # | Problem | The question | The adversary | If we get it wrong |
| --- | --- | --- | --- | --- |
| **1** | **Artist authenticity & authority** | *Is this really Prince's act, and is the person operating this account actually allowed to act for it?* | An impersonator claiming to be an artist or their team | The platform pays out a real booking fee to a fraudster wearing a famous name. Catastrophic — this is the trust the whole product rests on. |
| **2** | **Booker legitimacy & anti-spam** | *Is this booker real, solvent, serious — and not a tire-kicker, scammer, or harasser?* | A fake/insolvent buyer; a spammer; an account farmer | Artists get buried in junk, deposits never materialize, and the supply side leaves. **Research flags this as the *harder* side to onboard.** |
| **3** | **Platform integrity** | *Can the verified channels themselves be abused — cold-spam, scraping, harassment, sockpuppets?* | An otherwise-verified actor abusing the system; bots; coordinated rings | The marketplace becomes LinkedIn-spam-with-money; the "verified-only" promise rots from the inside. |

The defining decision of this document, carried straight from the blueprint:

> **Separate IDENTITY from AUTHORITY, always.** *Identity* = "this human is who they claim to be" (a KYC question, answerable by a government ID + selfie). *Authority* = "this human is allowed to act for *this principal*" (a possession/attestation question, answerable by control of an authoritative channel or a vouch from someone already trusted). **A verified identity grants zero authority** ([`02`](./02-domain-model.md) Invariant **I-5**). Stripe will happily confirm that a real human named Alex Rivera holds a real passport. That tells us *nothing* about whether Alex may speak for *Prince*. The entire fraud surface of this market lives in that gap, and the rest of this document is built to never let the two collapse into one badge.

```
        IDENTITY axis  ─────────────────────────►  (Stripe Identity / Persona; KYC)
          "is this human real & who they say?"
              │
              │   ┌───────────────────────────────────────────────┐
              │   │  A real human ...                              │
              ▼   │     ... with NO authority over Prince  ← FRAUD │
   AUTHORITY axis │     ... WITH authority over Prince     ← legit │
   "may this human│                                                │
    act for THIS  │  An unverified human ...                       │
    principal?"   │     ... claiming authority  ← block at the door│
                  └───────────────────────────────────────────────┘
   (DSP claim / channel possession / counter-signature / documentary)
```

Identity and authority are **orthogonal axes**, and a principal is only trustworthy in the corner where *both* are satisfied. The two are verified by **different mechanisms, stored as different state, and shown as different badges.**

---

## 1. Problem 1 — Artist authenticity & authority

> *"Is this really Prince, and does this person represent him?"* — the founder's exact worry, and the reason the product can charge a take rate at all.

The actor-vs-principal split from [`02`](./02-domain-model.md) §0 is what makes this tractable. We are never verifying "an artist user." We are independently establishing two facts:

- **(A) Authenticity of the `ArtistProfile`** — the act *Prince* is real and this profile genuinely represents it (not a fan page, not a tribute act, not a squatter).
- **(B) Authority of the `Membership`** — the specific `User` (actor) operating the profile holds an `active` `Membership` whose `role` permits what they're doing, on behalf of that `ArtistProfile` (principal).

These are verified by **three paths in priority order.** Higher paths are cheaper, faster, harder to fake, and produce a stronger, more legible badge. We always attempt the highest path first and fall back only when forced.

### 1.1 Primary path — claim + possession (mirror Spotify for Artists)

**The core insight, lifted from how the music industry *already* verifies authority:** the real team controls the artist's authoritative channels — their Spotify for Artists profile, Apple Music for Artists, Meta/Instagram verified business assets, their YouTube Official Artist Channel. **Demonstrated control of one of those channels is itself proof of authority**, because the gatekeeping already happened upstream (a distributor delivered the music; Meta verified the business; YouTube granted the OAC). We are not re-inventing artist verification — we are **inheriting** verification that authoritative platforms already performed, via the channels' OAuth/claim flows.

This is exactly Spotify's own model: you claim your artist profile by proving you control it (via your distributor-delivered artist URI, an admin invite, or a linked verified social account), and access is gated by an **admin who invites the rest of the team**. We mirror that mechanism directly.

**Supported verification sources** (modeled as `Integration` rows with `direction = verification_source`, see [`02`](./02-domain-model.md)):

| Source | What control proves | Mechanism | Strength |
| --- | --- | --- | --- |
| **Spotify for Artists** | This account is on the artist's S4A team (gated upstream by distributor catalog match + admin approval). | OAuth claim against the artist URI; confirm S4A team membership / admin grant. | **Strongest** — most aligned with represented-tier reality; distributor-backed. |
| **Apple Music for Artists** | Equivalent team access on Apple's side. | OAuth claim. | Strong. |
| **YouTube Official Artist Channel** | Control of the OAC (granted by YouTube to verified-topic artists, distributor-fed). | OAuth/channel-ownership claim. | Strong. |
| **Meta / Instagram verified** | Control of the verified business/artist assets. | Meta OAuth + verified-badge presence. | Medium-strong (verified ≠ artist-specific, but high signal). |

**Why "control of the channel ≈ proof of authority":** to be the S4A admin for *Prince*, someone *already* had to satisfy Spotify (correct artist URI delivered by the distributor, identity/role attested, admin approval). We free-ride on that chain of trust rather than rebuild it. The badge we then mint records *which* source proved it: **"Verified via Spotify for Artists."**

**What the claim flow looks like (happy path):**

1. Actor (`User`, already KYC'd — see §1.5 on sequencing) initiates a claim on an `ArtistProfile`.
2. They paste the artist URI / connect via OAuth to the chosen source.
3. showman confirms, via the source's API, that this account has team/admin access to that artist on that source.
4. On success: the `ArtistProfile` gains an authenticity provenance record, and the claiming actor's `Membership` is granted `owner` role (first claimer becomes the team admin, mirroring S4A). The badge **"Verified via {source}"** is minted with a timestamp and the source name.

> **Possession is re-checkable, not one-shot.** OAuth grants can be revoked upstream (the artist fires a manager; the distributor reassigns the catalog). We periodically re-validate `verification_source` integrations; loss of upstream access **degrades the badge** (see §1.6 state machine and §4 decay). A badge is a *standing claim about current reality*, not a permanent trophy.

### 1.2 Attestation path — distributor/label verification + verified-team counter-signature

Not every legitimate team member controls a DSP channel personally. A finance person at a label, a junior agent, a day-of-show rep — these people are real and authorized but won't be the Spotify admin. For them, **authority is conferred by someone who already has it.** Two sub-mechanisms:

**(a) Verified-team counter-signature (the vouch).** Once an `ArtistProfile` has at least one `owner` whose authority is established (via §1.1), that owner can **invite** other `User`s onto the team. The invite creates a `Membership` (status `invited` → `active` on acceptance) with a role the owner chooses (`agent` / `finance` / `viewer`). The new member's authority badge reads **"Verified Team Member — vouched by {owner principal}"** and records the inviting member on the `Membership` (the `02` model stores "the inviting/vouching member" precisely for this). This is the *exact* shape of the Spotify "admin invites the team" model — authority propagates from an established root, never from a stranger asserting it.

> **Counter-signature is a directed trust edge, not a free-for-all.** Only `owner` (and optionally `agent`, per the [`07`](./07-roster-org-rbac.md) matrix) can invite. A `viewer` can never mint authority. This keeps the vouch graph rooted in a strongly-verified node and prevents a low-trust member from laundering authority sideways.

**(b) Distributor/label attestation.** For an `Org` of type `label` or `management`, the org itself can be verified once (KYB, §1.4-style business verification), and then it **attests** to the artists on its roster — the same logical move Spotify makes when it trusts a distributor's catalog delivery. A KYB-verified label vouching for "these 12 artists are on our roster" lets those `ArtistProfile`s inherit a **"Verified via {label} (roster attestation)"** badge without each artist independently completing a DSP claim. The trust root is the verified `Org`; the artists are leaves.

### 1.3 Documentary fallback — government ID + management agreement → manual review

When no channel can be claimed and no verified team can vouch (a brand-new act, a self-managed artist with no DSP admin access, an edge case), we fall back to **documents + a human.** This path is slow, expensive, and deliberately the *last* resort:

1. **Identity** of the actor via Stripe Identity / Persona — government-issued ID document + selfie liveness match. (This proves the *human*, not the *authority* — see I-5.)
2. **Documentary authority evidence:** a management agreement, a signed letter of direction, prior settlement statements / contracts naming the artist, distributor agreements, performance-rights-org registration.
3. **Manual review** by platform `staff` against a structured checklist; the reviewer mints (or denies) the badge **"Verified — documentary review"** and records the evidence reference and reviewer in the `Event` log.

> **⚖️ LEGAL FLAG.** Government-ID documents and selfies are sensitive PII/biometric data. We do **not** want to custody these ourselves where avoidable — Stripe Identity / Persona hold the raw documents and return a pass/fail + minimal attributes; showman stores the *result and provenance*, not the raw ID image, wherever the vendor allows. Retention, biometric-consent (e.g. BIPA-style), and deletion policy are carried to [`09`](./09-system-architecture.md) (handling) and [`12`](./12-roadmap-risks-open-questions.md) (policy/counsel).

### 1.4 Authority on the `Org` (label/agency/management) and self-managed artists

- A **managing `Org`** (agency/label/management) is verified as a business (KYB — see Problem 2 §2.2, the mechanism is shared) and then becomes a trust *root* for its roster via §1.2(b) attestation. Its team members get authority through `Membership`s on the `Org`, scoped by `role`.
- A **self-managed artist** (the artist is their own team) still goes through §1.1 if they hold their own DSP admin access (the common case — most indie artists *are* their own Spotify admin), or §1.3 otherwise. Per [`02`](./02-domain-model.md) open question, self-management may be modeled as a degenerate single-member `Org`; the verification path is identical either way.

### 1.5 Sequencing: identity first, authority second, but never conflated

Every `User` that will move money or sign a `Contract` completes **identity verification (KYC)** as table stakes — this is also forced by Stripe Connect onboarding for any payout-receiving account (§2.1). Authority verification is layered *on top* and *separately*:

```
   ┌─ KYC (Stripe Identity / Persona, or Connect onboarding) ─┐
   │   proves: this User is a real, identified human          │   ← IDENTITY (I-5)
   └──────────────────────────────────────────────────────────┘
                              │  (necessary, NOT sufficient)
                              ▼
   ┌─ Authority on a principal (DSP claim / vouch / documents) ┐
   │   proves: this User may act for THIS ArtistProfile/Org    │   ← AUTHORITY (I-4)
   └──────────────────────────────────────────────────────────┘
```

A `User` can be fully KYC'd and hold **zero** authority over any artist. The two states are stored separately, checked separately, badged separately. **Conflating them is the single failure this whole section exists to prevent.**

### 1.6 Artist authority — verification state machine

State lives on the pair (`ArtistProfile` authenticity) × (`Membership` authority). Here is the **`Membership` authority lifecycle** for an actor on an artist principal:

```
                         invite from verified owner
                         (counter-signature §1.2a)
        ┌──────────────┐        OR documentary submit         ┌───────────────┐
        │  UNVERIFIED  │ ───────────────────────────────────► │   PENDING     │
        │ (no claim)   │                                       │  (in review / │
        └──────────────┘ ──┐                                   │  awaiting     │
              ▲            │ DSP OAuth claim (§1.1)             │  OAuth grant) │
              │            ▼                                    └──────┬────────┘
              │     ┌─────────────────┐  source confirms team access  │
              │     │  CLAIM_STARTED  │ ─────────────────────────────►│
              │     └─────────────────┘                                │
              │                                          ┌─────────────┴─────────────┐
              │                                  approve │                           │ deny / fail
              │                                          ▼                           ▼
              │                                  ┌───────────────┐           ┌──────────────┐
              │   upstream access lost           │   VERIFIED    │           │   REJECTED   │
              │   (re-check fails) — DECAY        │  (badge live, │           │ (no badge;   │
              ├──────────────────────────────────┤  source on    │           │  appeal →    │
              │                                   │  record)      │           │  PENDING)    │
              │                                   └──────┬────────┘           └──────────────┘
              │                                          │
              │              owner revokes / suspends    │ artist fires manager,
              │              Membership (I-4)            │ revokes grant
              │                                          ▼
        ┌─────┴──────┐                            ┌──────────────┐
        │  REVOKED   │ ◄──────────────────────────┤  SUSPENDED   │
        │ (authority │                            │ (temporarily │
        │  removed   │                            │  frozen)     │
        │  for good) │                            └──────────────┘
        └────────────┘
```

**Key transitions and the invariants they honor:**

- `VERIFIED → SUSPENDED → REVOKED`: per **I-4**, revoking/suspending a `Membership` *immediately* removes authority. A suspended/revoked actor cannot send requests, counter-offer, sign, or trigger payouts on that principal — even mid-deal. Live deals where the actor was the only authority surface a re-authorization prompt to the team.
- `VERIFIED → UNVERIFIED (decay)`: upstream OAuth revocation (artist left the distributor, manager removed from S4A team) demotes the badge on the next re-check. The badge is a *current* claim (§4).
- `REJECTED → PENDING (appeal)`: every denial is appealable into the manual queue (§5 / [`11`](./11-gtm-liquidity-trust-safety-ops.md)).

Every transition writes an `Event` (`actor`, `principal`, `role`, before→after) — authority changes are **always** in the audit log (I-2).

### 1.7 Provenance-based, tiered badges — not an opaque checkmark

**The badge taxonomy is the public face of all of the above, and it is the founder's explicit ask realized:** when an artist receives a request, or a booker sizes up an act, the badge tells them *how* trust was established and *how strong* it is — the **source**, not a meaningless tick.

> **Design principle:** a checkmark says "trust us." A provenance badge says "here's exactly why, and you can judge it." Provenance badges are legible, defensible, and self-explaining — they let a counterparty calibrate their own risk. This is also a *moat*: an opaque tick is trivially copied; "Verified via Spotify for Artists" encodes a real, hard-to-fake upstream chain.

#### Badge taxonomy (artist/authority side)

| Badge (provenance) | Means | Path | Tier |
| --- | --- | --- | --- |
| **Verified via Spotify for Artists** | Actor controls the artist's S4A team. | §1.1 primary | ★★★★ Highest |
| **Verified via Apple Music for Artists** | Equivalent on Apple. | §1.1 primary | ★★★★ |
| **Verified via YouTube Official Artist Channel** | Controls the OAC. | §1.1 primary | ★★★☆ |
| **Verified via Meta / Instagram** | Controls verified business/artist assets. | §1.1 primary | ★★★☆ |
| **Verified via {Label/Agency}** | Roster attestation by a KYB-verified `Org`. | §1.2b attestation | ★★★☆ |
| **Verified Team Member — vouched by {owner}** | Invited/counter-signed by an established owner. | §1.2a counter-signature | ★★★☆ (inherits root strength) |
| **Verified — documentary review** | Passed manual document review. | §1.3 fallback | ★★☆☆ |
| **Identity verified** *(separate axis)* | KYC passed; says nothing about authority. | KYC | (identity only) |
| *(no badge)* | Unverified — cannot transact on the supply side. | — | — |

#### Role badges (who, on the team)

Provenance also shows the **`role`** (from [`02`](./02-domain-model.md)/[`07`](./07-roster-org-rbac.md)): **"Verified Manager"**, **"Verified Agent"**, **"Verified Label (finance)"**, etc. — so a booker can see they are negotiating with someone who *can actually close*, not a viewer with no signing authority.

> **Where badges render** is owned by [`08-profiles-pitches-discovery.md`](./08-profiles-pitches-discovery.md) (profiles, search ranking, request headers) — this doc defines what they *mean* and how they're *earned*; `08` defines where they *appear*. Badges and `ReputationScore` together drive discovery ranking.

---

## 2. Problem 2 — Booker legitimacy & anti-spam (the harder side)

> Research and the founder both flag the **demand side as the harder onboarding problem and the bigger integrity risk**: bookers already have agents and relationships, so they need a reason to show up; and once they do, a fake/insolvent/spammy booker is the fastest way to poison the supply side we worked to earn. Verification here is a *gate*, but it must not be so heavy it kills the demand we're trying to attract. The resolution: **make money — not paperwork — the primary filter.**

A booker is a `BookerProfile` principal, owned by either a `User` (independent buyer) or an `Org` (festival/venue/promoter talent buyer). We establish legitimacy in three layers.

### 2.1 KYC / Connect onboarding — identity of the booker

Any `User` who will *pay* through the platform completes **Stripe Connect onboarding**, which performs KYC (identity, sanctions/PEP screening, and for payout-side accounts, document/selfie checks) **on Stripe's rail and Stripe's licenses** — we ride their compliance, we don't build it ([`01`](./01-vision-strategy.md) non-goal: not a money transmitter; [`04`](./04-payments-escrow-disputes.md) for the money rail). For pure identity assurance independent of a Connect account, **Stripe Identity** (document + selfie liveness) is the tool. This produces the **"Identity verified"** signal — again, an *identity* axis fact, not an authority one.

### 2.2 KYB — legitimacy of the venue / festival / promoter business

A festival, venue group, or promoter transacts as an **`Org`-backed `BookerProfile`**. For these we run **Know-Your-Business**:

- **Stripe Connect / KYB** verifies the legal entity, beneficial owners (KYB follows the ownership chain to the natural persons behind it), tax ID, and business registration — the same machinery Stripe uses to onboard a platform's connected accounts.
- Supplementary signals where useful: business website/domain, prior event history, a known venue address, public promoter footprint.
- On success: **"Verified Business — {type}"** (e.g., "Verified Festival", "Verified Venue", "Verified Promoter") provenance badge on the `BookerProfile`, with the `Org`'s KYB status recorded.

> **KYB depth is a launch lever, not a fixed point.** How strict to be at v1 — full beneficial-owner verification on day one vs. a lighter business-existence check that hardens before first payout — is an open question carried to [`12`](./12-roadmap-risks-open-questions.md). The principle: **KYB must clear before money is held or released**, but onboarding friction can be staged so a booker can *browse* before they're fully KYB'd, and only hit the wall when they go to *transact*. ⚖️ LEGAL FLAG: KYB/beneficial-ownership and sanctions obligations are regulated; counsel reviews the launch threshold.

### 2.3 Money as the spam filter — the single best anti-spam mechanism we have

This is the keystone of the whole demand-side strategy, and it directly answers the founder's "how to regulate unserious people / spam" fear:

> **Sending a real `BookingRequest` requires (a) a charge-capable payment method on file and (b) an escrowed deposit hold placed at send time.** A tire-kicker, an impersonator, or a spammer will not put a real, charge-capable card behind a request, nor accept a real hold on real money. **The cost of spamming becomes the cost of fronting deposits**, which collapses the spam economics that plague every "free to message" marketplace.

- The deposit hold's mechanics (authorization vs capture, void on decline/expiry, how it backs a `Hold` on the artist's calendar) are owned by [`04-payments-escrow-disputes.md`](./04-payments-escrow-disputes.md) and the [`02`](./02-domain-model.md) `Hold` entity (`hold strength = deposit-backed`). This doc only asserts its **trust function**: it is the money-gated entry toll that filters demand-side intent.
- It also reinforces [`01`](./01-vision-strategy.md)'s pricing-as-trust thesis: money-gated requests do *double duty* as monetization and as the anti-spam wall.
- **Graduated gating:** the *strength* of the money gate can scale with the booker's trust — a brand-new, un-reviewed booker faces a firmer deposit-hold requirement to send a request; a booker with a strong completion history and KYB faces a lighter one. This is the reputation system (§2.4) feeding back into the gate.

### 2.4 Reputation — completion rate, dispute rate, two-sided reviews

Verification gets a booker *in*; **reputation keeps the marketplace honest over time.** Per [`02`](./02-domain-model.md), `ReputationScore` is a per-principal derived signal (no review without a completed `Agreement` — Invariant **I-20**, the anti-fake-review rule). For bookers it tracks:

- **Completion rate** — confirmed deals that reached `Settled` vs. that fell apart post-confirmation.
- **Dispute rate** — how often this booker opens or loses `Dispute`s (a serial false-disputer is exactly the "artist gets screwed by a false dispute" adversary from `init-jot`; their dispute rate makes them visible and gateable).
- **Payment reliability** — did the balance get escrowed on time (I-16), or did they repeatedly ghost?
- **Two-sided reviews** — artists/teams review bookers and vice-versa, tied to a real `Agreement`.

Reputation feeds back into (a) the **money-gate strength** (§2.3), (b) **discovery ranking** ([`08`](./08-profiles-pitches-discovery.md)), and (c) **outreach privileges** (§3). A high-trust booker earns a lighter touch; a low-trust one earns more friction. This is the "trust compounds" loop.

### 2.5 Booker badge taxonomy

| Badge (provenance) | Means | Mechanism |
| --- | --- | --- |
| **Identity verified** | KYC passed (Stripe Identity / Connect). | §2.1 |
| **Verified Festival / Venue / Promoter** | KYB on the backing `Org` passed. | §2.2 |
| **Payment-backed** | Charge-capable method on file; can place deposit holds. | §2.3 |
| **Trusted Booker** | Earned: strong completion rate, low dispute rate over N deals. | §2.4 (reputation-derived) |

### 2.6 Booker legitimacy — verification state machine

```
   ┌──────────────┐   signs up     ┌────────────────┐  KYC/Connect onboarding
   │   GUEST /    │ ─────────────► │   REGISTERED   │ ───────────────────────────┐
   │  UNVERIFIED  │                │ (can browse,   │                             │
   └──────────────┘                │  cannot send   │                             ▼
                                   │  a request)    │                    ┌──────────────────┐
                                   └────────────────┘                    │ IDENTITY_VERIFIED│
                                                                         └────────┬─────────┘
                                              org-backed? run KYB                 │
                                       ┌────────────────────────────────┐         │ add charge-capable
                                       ▼                                 │         │ payment method
                              ┌─────────────────┐                        │         ▼
                              │  KYB_PENDING    │── fail ──► REJECTED     │  ┌────────────────┐
                              └───────┬─────────┘   (appeal)             │  │ PAYMENT_BACKED │
                                      │ pass                             │  │ (CAN now send  │
                                      ▼                                  │  │  a deposit-    │
                              ┌─────────────────┐                        │  │  backed        │
                              │ BUSINESS_VERIFIED│◄──────────────────────┘  │  request)      │
                              └───────┬─────────┘                           └───────┬────────┘
                                      │                                             │ completes deals
                                      │     reputation accrues (I-20)               │ cleanly over time
                                      └──────────────────┬──────────────────────────┘
                                                         ▼
                                                ┌──────────────────┐    serial disputes /
                                                │  TRUSTED_BOOKER  │    fraud signals
                                                │  (lighter gate)  │ ──────────────► FLAGGED / SUSPENDED
                                                └──────────────────┘                  (T&S review §5)
```

> **The gate that matters:** a booker **cannot send a real `BookingRequest` until `PAYMENT_BACKED`** (charge-capable method + able to place the deposit hold). KYB (`BUSINESS_VERIFIED`) must clear before funds are *held or released* for org-backed buyers. Browsing is open; *transacting* is gated. This staging keeps demand-side onboarding friction low (attract them) while keeping money safe (protect supply).

---

## 3. Problem 3 — Platform integrity & anti-spam mechanics

Even with both sides verified, the *channels between them* can be abused. This section hardens the platform itself, and it is the direct answer to the founder's most ambivalent feature: *"a feature that allows an artist to reach out to a potential booker's profile? Although this may cause spam and overloads of cold messages."*

### 3.1 Verified-only, money-gated outreach — the cold-outreach answer

**The resolution to the cold-message worry is structural, not moderation-based:**

- **No open inbox.** There is no generic DM channel. Contact happens **only inside a typed `BookingRequest`** (which carries the `Pitch` — see [`08`](./08-profiles-pitches-discovery.md)). There is no "message any profile" surface to spam.
- **Booker → artist** outreach is the `BookingRequest`, which is already **money-gated** (§2.3) and **verified-gated** (§2). A booker can't cold-blast artists because every request costs a real deposit hold.
- **Artist → booker** outreach (the founder's risky idea) is allowed **only for verified principals, only as a bounded, rate-limited, structured pitch — never a free-text cold DM.** An artist/team reaching out to a booker is itself a typed, throttled object (an outbound availability pitch tied to a real `Listing` and `AvailabilityWindow`), visible and reportable, not an open message. The "verified-only outreach" rule is what makes this safe enough to ship.

> **Principle (from [`01`](./01-vision-strategy.md) non-goals):** showman is **not a social network**. There is no feed, no follow, no open DM, no engagement loop. Every channel of contact is **money-gated, verified-only, and typed** — which is precisely what makes the cold-outreach feature safe rather than a spam vector.

### 3.2 Rate limits & graduated trust throttles

| Surface | Limit | Scales with |
| --- | --- | --- |
| Outbound `BookingRequest`s (booker) | Per-day / per-artist caps | Booker reputation + KYB status (trusted ⇒ higher) |
| Artist→booker outreach pitches | Tight per-day cap | Authority badge strength + reputation |
| Verification attempts (DSP claim, doc submit) | Hard cap + backoff | Prevents claim-spam / brute-forcing a profile claim |
| New-account actions (first 30 days) | Conservative caps | Account age + identity/KYB completion |
| Failed payment-method adds | Cap + cooldown | Anti card-testing |

Limits are **graduated by trust**: a brand-new, barely-verified account is throttled hard; a `TRUSTED_BOOKER` or a `Verified via Spotify for Artists` team operates with room. Trust *buys* throughput — which is itself an incentive to verify.

### 3.3 Report / block / takedown

- **Report** is available on every principal, request, and message-in-thread, with structured reason codes (impersonation, spam, fraud, harassment, non-payment, off-platform-circumvention). Reports feed the T&S queue (§5) and the principal's risk signals.
- **Block** lets any principal prevent a specific counterparty from contacting or requesting them, independent of T&S action.
- **Takedown / suspend**: `staff` can suspend a `User`, freeze a principal's ability to transact, or revoke a verification badge — each writing an `Event` and triggering the relevant `Membership`/authority transitions in §1.6 / §2.6.

### 3.4 Anti-circumvention (the marketplace-leakage risk)

A structural threat unique to high-value marketplaces: **both parties meet on the platform, then take the deal off-platform to dodge the take rate** — which also strips the escrow protections that justify the platform. Mitigations (detailed economically in [`11`](./11-gtm-liquidity-trust-safety-ops.md)):

- The platform's *value* is the escrow + dispute protection + the confirmation artifact — leaving means **giving up I-16/I-17 protection** (no escrowed balance before the show; no auto-release; no dispute recourse). The protection *is* the lock-in.
- Detect-and-flag signals: requests that open then abruptly cancel post-introduction, contact-info exfiltration patterns in `Pitch`/thread text, repeated near-miss deals between the same pair that never close on-platform.
- **Reputation and verified badges are non-portable** — the trust you build lives here; off-platform you're a stranger again.

### 3.5 Trust & safety operations (the human layer)

Automation gates the common case; humans handle the edges. T&S **ops** (staffing model, queue SLAs, appeals workflow) is owned by [`11-gtm-liquidity-trust-safety-ops.md`](./11-gtm-liquidity-trust-safety-ops.md); this doc specifies what the queues *are* and what feeds them:

| Queue | Fed by | Decision |
| --- | --- | --- |
| **Documentary verification review** | §1.3 fallback submissions | Mint / deny **"Verified — documentary review"** badge |
| **Authority disputes** | "someone else claims to represent this artist" | Adjudicate competing claims; one wins, others REJECTED |
| **Report triage** | §3.3 reports | Warn / throttle / suspend / takedown |
| **KYB exceptions** | §2.2 edge cases | Approve / reject business verification |
| **Appeals** | every REJECTED / SUSPENDED state | Re-review; back to PENDING or uphold |

Every T&S action is an `Event` (I-2): auditable, reversible-where-appropriate, and appealable.

---

## 4. Badge decay, re-verification & trust as a living signal

A verification is a **claim about the present**, not a permanent award. Two reasons a once-true badge goes stale:

1. **Upstream authority changes.** The artist fires the manager; the distributor reassigns the catalog; Meta revokes a verified badge. Our periodic re-check of `verification_source` integrations catches this and **demotes** the affected badge (the `VERIFIED → UNVERIFIED` decay edge in §1.6). A manager who lost S4A access loses **"Verified via Spotify for Artists"** on the next re-check.
2. **Behavioral trust erodes.** Reputation (`ReputationScore`) recomputes continuously from `Agreement` outcomes, `Dispute` history, and reviews. A rising dispute rate or a string of ghosted balances degrades a booker's standing and **tightens their gates** (§2.3, §3.2) automatically.

> **Why decay matters:** a marketplace whose badges only ever go *up* eventually fills with stale, hollow trust — the exact rot that made Sonicbids' "verification" worthless ([`01`](./01-vision-strategy.md)). Trust that can *fall* is trust worth showing.

Re-verification cadence (illustrative, tuned in ops): `verification_source` re-checks on a periodic schedule + on any high-value transaction; KYC/KYB refresh on regulatory cadence or risk-trigger; reputation continuous.

---

## 5. Abuse & threat scenarios (concrete, with the defense)

The point of the three-problem split is that each scenario has a *named* defense. These are the attacks this document is designed to defeat — useful as a test suite for the model and as a red-team checklist.

| # | Scenario / attacker | Attack | Primary defense | Backstop |
| --- | --- | --- | --- | --- |
| **T1** | **Impersonator-as-artist** | Creates a profile claiming to be Prince to collect deposits/payouts. | §1.1 DSP claim — they can't pass S4A/Apple team-access OAuth; §1.3 doc review otherwise. **Identity ≠ authority (I-5)** — even a real human can't get the authority badge. | Payout follows the *principal's* connected account (I-19); authority dispute queue (§3.5). |
| **T2** | **Real human, no authority** (rogue ex-manager) | A genuinely KYC'd person tries to act for an artist they no longer represent. | **I-4**: authority requires an `active` `Membership`; revocation removes it immediately. Decay (§4) demotes a stale S4A grant. | Owner can `SUSPEND`/`REVOKE` the `Membership` (§1.6); audit log (I-2). |
| **T3** | **Sockpuppet vouch ring** | A fake "owner" invites a network of fake team members to manufacture authority. | Counter-signature is **rooted in a strongly-verified node** (§1.2a); only `owner`/`agent` can invite; a `viewer` can't mint authority. Root must pass §1.1/§1.4. | Vouch graph is auditable; collapsing the root REVOKEs the leaves. |
| **T4** | **Tire-kicker / spam booker** | Mass-sends requests with no intent to pay. | **Money as the spam filter (§2.3)** — every request needs a charge-capable method + deposit hold. Spamming costs real held money. | Rate limits (§3.2); reputation gate tightens (§2.4). |
| **T5** | **Insolvent / fake booker** | Looks legit, can't actually pay the balance. | KYB (§2.2) + **balance escrowed before performance (I-16)** — no balance, no show eligibility. | Completion/payment-reliability reputation (§2.4) flags repeat offenders. |
| **T6** | **Serial false-disputer** | Books, lets the artist perform, then falsely disputes to claw funds back. | **Auto-release unless an in-window, evidence-backed `Dispute` lands (I-17)**; dispute *rate* is a tracked reputation signal (§2.4) that gates them. | T&S adjudication ([`04`](./04-payments-escrow-disputes.md)); dispute mechanics owned there. |
| **T7** | **Cold-outreach spammer** | Wants to blast artists or bookers with pitches. | **No open inbox; verified-only + money-gated + typed outreach (§3.1)**; tight rate limits (§3.2). There is no surface to spam. | Report/block (§3.3); not-a-social-network ([`01`](./01-vision-strategy.md)). |
| **T8** | **Account farmer / bot** | Spins up many accounts to evade limits or scrape. | KYC at the identity layer (one human → one `User`, [`02`](./02-domain-model.md)); new-account throttles + card-testing caps (§3.2). | Device/risk signals; T&S takedown (§3.5). |
| **T9** | **Off-platform circumvention** | Meet here, transact off-platform to dodge take rate + escrow. | Protection-as-lock-in: leaving forfeits I-16/I-17 escrow + dispute recourse (§3.4); reputation/badges non-portable. | Circumvention-pattern detection (§3.4); economics in [`11`](./11-gtm-liquidity-trust-safety-ops.md). |
| **T10** | **Stale-badge exploit** | Trades on a verification that's no longer true. | **Badge decay / re-verification (§4)** — badges are present-tense claims, re-checked. | High-value-transaction re-check trigger (§4). |
| **T11** | **Competing authority claim** | Two parties both claim to be the real team for one artist. | Single-active-claim lock (mirrors S4A "one active claim per profile"); **authority dispute queue (§3.5)** adjudicates; one wins. | Documentary evidence + manual review (§1.3, §3.5). |
| **T12** | **Verification-doc data breach risk** | Sensitive ID/biometric data exposed. | **Don't custody what we can offload** — Stripe Identity/Persona hold raw docs; we store result + provenance, not the raw image (§1.3). ⚖️ LEGAL FLAG. | Secrets/PII handling ([`09`](./09-system-architecture.md)); retention policy ([`12`](./12-roadmap-risks-open-questions.md)). |

---

## 6. How this doc honors the spine (invariant traceability)

This doc owns the *behavior* for the verification-related entities in [`02-domain-model.md`](./02-domain-model.md). The invariants it is on the hook for:

| Invariant ([`02`](./02-domain-model.md) §4) | How this doc enforces it |
| --- | --- |
| **I-4 — Authority gates every OBO action** | §1.6 `Membership` state machine; `SUSPEND`/`REVOKE` immediately removes authority; only authorized roles can invite (§1.2a) or transact. |
| **I-5 — Identity ≠ authority** | §0 thesis; §1.5 sequencing; KYC never confers authority anywhere in §1–§2. The orthogonal-axes diagram is the whole point. |
| **I-2 — Every action attributable** | Every verification/T&S transition writes an `Event` (§1.6, §3.5). |
| **I-20 — No deal, no review** | Reputation (§2.4) derives only from completed `Agreement`s — no fake-review attack surface. |
| **I-19 — Payout follows the principal** | T1/T2 defenses rely on payout going to the *principal's* connected account, not whichever actor triggered it. |
| **I-16 / I-17 — Balance escrowed before show / auto-release unless disputed** | Referenced as the backstop for booker-side threats T5/T6; *mechanism* owned by [`04`](./04-payments-escrow-disputes.md). |

---

## 7. Open questions (carried, not blocking)

- **KYB depth at launch** — full beneficial-owner verification on day one vs. staged business-existence check that hardens before first payout. → [`12`](./12-roadmap-risks-open-questions.md).
- **ID-document & biometric retention/consent** — exact retention window, BIPA-style consent flow, deletion policy; how much we can keep at the vendor vs. ourselves. ⚖️ LEGAL FLAG → [`09`](./09-system-architecture.md) / [`12`](./12-roadmap-risks-open-questions.md).
- **DSP API access reality** — which of Spotify for Artists / Apple Music for Artists / YouTube / Meta expose a usable OAuth/claim API for *third-party* verification vs. require a partnership or a scrape-and-screenshot fallback. The §1.1 primary path's strength depends on this; spike before committing. → [`09`](./09-system-architecture.md), [`12`](./12-roadmap-risks-open-questions.md).
- **Vouch-chain depth limit** — can a counter-signed `agent` themselves vouch for others, or only `owner`s? Bounds the §1.2a trust graph; interacts with the [`07`](./07-roster-org-rbac.md) role matrix.
- **Re-verification cadence** — exact schedule for `verification_source` re-checks and KYC/KYB refresh; balance of friction vs. staleness (§4). → ops in [`11`](./11-gtm-liquidity-trust-safety-ops.md).
- **Persona vs. Stripe Identity** for the documentary path — single vendor (Stripe) for tight Connect integration vs. Persona for richer orchestration. → [`09`](./09-system-architecture.md), blueprint open questions.

---

### Cross-references

- Entities, ubiquitous language, invariants (the spine) → [`02-domain-model.md`](./02-domain-model.md)
- Why verification is the strategic wedge; provenance-over-checkmark positioning → [`01-vision-strategy.md`](./01-vision-strategy.md)
- The deposit-hold money mechanics behind "money as the spam filter" → [`04-payments-escrow-disputes.md`](./04-payments-escrow-disputes.md)
- What happens after a request is sent (deal state machine) → [`05-negotiation-deal-lifecycle.md`](./05-negotiation-deal-lifecycle.md)
- The `Membership` **role** permission matrix that authority badges reflect → [`07-roster-org-rbac.md`](./07-roster-org-rbac.md)
- Where badges & reputation render in profiles/discovery → [`08-profiles-pitches-discovery.md`](./08-profiles-pitches-discovery.md)
- Secrets/PII handling for ID docs and OAuth tokens; DSP API integration reality → [`09-system-architecture.md`](./09-system-architecture.md)
- T&S staffing, queue SLAs, appeals, anti-circumvention economics → [`11-gtm-liquidity-trust-safety-ops.md`](./11-gtm-liquidity-trust-safety-ops.md)
- Verification-spoofing risk register, legal flags, open questions → [`12-roadmap-risks-open-questions.md`](./12-roadmap-risks-open-questions.md)

---

*End of 03-trust-verification.md — the priority deep-dive. Trust is three problems, never one. Identity ≠ authority. Provenance over checkmarks. Money is the spam filter.*
