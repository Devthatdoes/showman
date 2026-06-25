# 11 — Go-to-Market, Liquidity & Trust & Safety Ops

> Part of the **showman** foundation doc set (`docs/foundation/`). This doc owns the **launch motion** — how showman goes from an empty database to a liquid, trustworthy marketplace, and how it is operated day-to-day once people are inside it.
>
> It answers three questions the rest of the doc set deliberately leaves to this one:
> 1. **Cold-start:** how do you get the first transactions when a two-sided marketplace is worthless until both sides show up?
> 2. **Liquidity:** which side seeds first, in which beachhead, and what makes the product useful *before* it's liquid?
> 3. **Ops:** who runs trust & safety, with what queues, SLAs, and appeals — the human layer behind the automation specified in [`03-trust-verification.md`](./03-trust-verification.md).
>
> **Scope discipline.** This doc consumes, it does not redefine. It uses the strategy frame from [`01-vision-strategy.md`](./01-vision-strategy.md) (the beachhead, the take-rate band, aid-not-replace), the trust mechanics from [`03-trust-verification.md`](./03-trust-verification.md) (the three trust problems, money-as-spam-filter, the verification state machines, the T&S queue *definitions*), the escrow/dispute mechanics from [`04-payments-escrow-disputes.md`](./04-payments-escrow-disputes.md), and the profile/discovery surface from [`08-profiles-pitches-discovery.md`](./08-profiles-pitches-discovery.md) (single-player EPK, `unlisted` visibility, cold-start-fair ranking). Where `03` defines *what a queue is and what feeds it*, this doc defines *who works it, how fast, and how appeals run*.
>
> **Ubiquitous language.** All entity and role terms (`ArtistProfile`, `BookerProfile`, `Org`, `Membership`, `Listing`, `BookingRequest`, `Pitch`, `Agreement`, `Dispute`, `ReputationScore`, `Event`, actor-vs-principal, `staff`) are the canonical terms from [`02-domain-model.md`](./02-domain-model.md). Invariant references (I-x) point at `02` §4.
>
> **⚖️ LEGAL FLAG markers** carry to [`12-roadmap-risks-open-questions.md`](./12-roadmap-risks-open-questions.md). This doc states operational policy, not legal advice; T&S adjudicates *platform/escrow outcomes*, never legal liability ([`01`](./01-vision-strategy.md) non-goal: not a law firm).

---

## 0. The cold-start problem, stated honestly

A two-sided marketplace has a brutal property: **it is worth nothing to either side until the other side is already there.** A booker visiting an empty catalog leaves and never returns. An artist who lists and gets zero requests stops checking. This is the chicken-and-egg problem, and most marketplaces die in it, not later.

The research anchor we build on (carried from the blueprint): a transactional two-sided marketplace needs roughly **~70 engaged participants on each side** in a single, tight segment to reach *first liquidity* — the point where a typical search returns enough fit-and-available counterparties that a transaction is plausible without manual matchmaking. That number is not magic; it is the order-of-magnitude reminder that **liquidity is local**. Seventy artists and seventy bookers spread across every genre, tier, and city is a dead marketplace; seventy and seventy inside *one scene* is a living one.

Three principles govern everything below, and they are non-negotiable:

| Principle | What it means | Why |
| --- | --- | --- |
| **Seed supply first** | Onboard artists/teams before chasing bookers. | Supply is easier to onboard ([`01`](./01-vision-strategy.md) §2), and a catalog of verified, available acts is the thing a booker comes to see. An empty catalog converts no demand. |
| **Single-player before multiplayer** | The product must be useful to an artist/team with *zero* bookers present. | This breaks the chicken-and-egg: supply has a reason to show up and stay before liquidity exists. See §2. |
| **Narrow the beachhead until it's almost embarrassing** | One scene, one genre, one city, one tier. | Liquidity is local. Depth in a sliver beats breadth across the market. See §3. |

> **The cold-start thesis in one line:** *make showman valuable to a single artist team on day one (single-player), seed a deliberately tiny beachhead by hand (concierge), and let verification + money-gating keep that beachhead serious enough that the first bookers find it credible.*

---

## 1. The sequencing logic — why supply, why single-player, why narrow

### 1.1 Why supply first (and why that's the *easy* side here)

[`01`](./01-vision-strategy.md) §2 already establishes that **above the emerging tier the person transacting is a manager or agent acting on behalf of the artist** (the actor-vs-principal keystone). That has a direct GTM consequence: **we do not onboard 70 artists, we onboard the handful of managers/agents who control 70 artists.** A single mid-tier management company or agency roster *is* a supply cohort. This is the leverage point — and it is exactly why supply is the easier side to seed:

- One verified `Org` ([`03`](./03-trust-verification.md) §1.2b roster attestation) brings its entire roster of `ArtistProfile`s in one motion. Authority propagates from the verified org root; we don't re-verify each artist by hand.
- The "aid, not replace" principle ([`01`](./01-vision-strategy.md) §5) is the pitch: the manager keeps their ~10%, gets a roster workspace ([`07`](./07-roster-org-rbac.md)), kills email overhead, and removes collections risk. We are selling them a better back office, not threatening their job.
- **The manager is the gatekeeper to supply AND a single point of high-leverage onboarding.** Win the gatekeeper, inherit the roster.

### 1.2 Why single-player mode is the unlock

The standard cold-start failure: supply lists, sees no demand, churns before demand arrives. The fix is to make the product **deliver standalone value to the supply side with no demand present at all** — so the artist/team gets utility on day one and is *still there* when bookers arrive. showman has an unusually strong single-player story because the supply-side tooling is genuinely useful as a stand-alone product (detailed in §2):

- a **verified EPK** ([`08`](./08-profiles-pitches-discovery.md) §2) that is a better press kit than the PDF/Squarespace status quo, shareable at `/a/<handle>` *off-platform*;
- a **free availability calendar** ([`06`](./06-availability-confirmation.md)) the team uses to coordinate even for off-platform gigs;
- a **roster CRM** ([`07`](./07-roster-org-rbac.md)) that replaces a manager's spreadsheet.

None of these require a single booker to exist. They are the bait that holds supply in place during the liquidity build.

### 1.3 Why narrow

A booker's experience is determined entirely by **the local density of fit-and-available supply**, not by the total artist count. So the only thing that matters in the cold-start phase is depth inside one slice. A narrow beachhead also:

- lets concierge seeding (§4) actually cover the segment by hand — you cannot hand-hold a whole market, but you can hand-hold one scene;
- makes word-of-mouth work (the scene talks to itself — managers, agents, promoters in one genre/city all know each other);
- makes the **verification quality gate** (§5) credible — "every act here is verified and every booker here is real" is a claim you can guarantee in a sliver and not across a market;
- produces clean, legible **liquidity metrics** (§6) you can actually read.

---

## 2. Single-player mode — value before the marketplace is liquid

This is the cold-start unlock and it deserves a precise spec. **Single-player mode is the set of features that are useful to an artist/team with zero bookers present.** It is not a marketing demo; it is real, retained utility. The strategic claim from [`01`](./01-vision-strategy.md) §3.1 and [`08`](./08-profiles-pitches-discovery.md) §2.6 — *"a verified EPK + availability calendar that's useful on day one even if no booking ever comes through it"* — is realized here.

### 2.1 The three single-player tools

| Tool | What it is standalone | Owned by | Why a team uses it with zero bookers |
| --- | --- | --- | --- |
| **Verified EPK** | A live, provenance-backed press kit at `/a/<handle>`, shareable anywhere. | [`08`](./08-profiles-pitches-discovery.md) §2 | Replaces the stale PDF/Sonicbids EPK. The `unlisted` visibility mode ([`08`](./08-profiles-pitches-discovery.md) §2.6) means they get the rail without a public storefront. Verification provenance ([`03`](./03-trust-verification.md)) is a credential they can show off-platform. |
| **Free availability calendar** | A clean calendar of open/held/confirmed dates for the act, usable for *any* gig (on- or off-platform). | [`06`](./06-availability-confirmation.md) | A touring act/manager needs to track availability regardless of where a booking originates. Becomes the source of truth for routing; doubles as the engine behind routing-aware discovery once demand exists. |
| **Roster CRM** | A workspace where a manager/agency sees all their artists, roles, and (eventually) deals in one view. | [`07`](./07-roster-org-rbac.md) | Replaces the manager's spreadsheet. The on-behalf-of model ([`02`](./02-domain-model.md)) makes "see everything across my roster" native. Useful from member #1. |

### 2.2 The single-player → multiplayer ramp

The design intent: every single-player action **pre-builds the multiplayer marketplace** without the user having to opt into "going live."

```
   SINGLE-PLAYER (day 1, zero bookers)            MULTIPLAYER (liquidity arrives)
   ───────────────────────────────────            ──────────────────────────────
   build verified EPK (unlisted)        ──────►   flip visibility: unlisted → public  ([08] §2.6)
   populate availability calendar       ──────►   powers routing-aware discovery       ([08] §4.1)
   set up Listings (fee + private_floor)──────►   becomes requestable; floor governs    ([05] negotiation)
   manage roster in CRM                 ──────►   inbound requests route to the team    (I-12 dedup)
   self-asserted BookingCredits         ──────►   replaced/augmented by platform_confirmed ([08] §2.4)
```

The key property: **the work a team does for single-player utility is exactly the work that makes them marketplace-ready.** When the first verified bookers arrive in the beachhead, the supply side is already populated, verified, and priced — there is no "now go list yourself" cliff. A team flips `unlisted → public` (one toggle) and they are live.

> **Why `unlisted` is strategically load-bearing** ([`08`](./08-profiles-pitches-discovery.md) §2.6): the represented tier often does *not* want a public marketplace listing, but *does* want the escrow rail, the structured deal, and the confirmation artifact. `unlisted` lets showman be valuable to a team that will never go `public` — they transact via direct link only. This widens single-player adoption far beyond "artists who want to be discovered," which is most of the represented tier.

### 2.3 What single-player mode is NOT

- **Not free forever as a SaaS.** The single-player tools are free because they are **onboarding fuel and supply-side retention**, not a product line. Revenue is the take rate on confirmed bookings ([`01`](./01-vision-strategy.md) §7); single-player tooling exists to make that liquidity happen. A premium org/roster SaaS layer is a *future, secondary* revenue idea explicitly out of v1 scope ([`01`](./01-vision-strategy.md) §7.4).
- **Not a social surface.** No feed, no follower counts ([`01`](./01-vision-strategy.md) non-goal). The EPK is a decision aid and a press kit, not a profile to farm engagement on.
- **Not a substitute for verification.** A single-player EPK can be built in `draft`, but going `public` (or transacting via `unlisted` direct link) still requires verification per [`03`](./03-trust-verification.md). The quality gate (§5) never lowers for single-player users.

---

## 3. The beachhead — one scene, one genre, one city, one tier

[`01`](./01-vision-strategy.md) §2 locks the **tier**: **mid-tier represented artists** ($2,500–$50,000 deals, manager/agent-run, fragmented, underserved). This doc commits the rest of the beachhead vector and the selection logic. Per [`01`](./01-vision-strategy.md)'s open question and [`12`](./12-roadmap-risks-open-questions.md), the *exact* scene/genre/city is finalized with real-world founder knowledge — but the **selection criteria are decided here and are not negotiable**, and a concrete recommendation is made.

### 3.1 Beachhead selection criteria

The beachhead must score well on all of these, or it's the wrong one:

| Criterion | Why it matters | What "good" looks like |
| --- | --- | --- |
| **Mid-tier deal density** | Deals big enough that escrow + take rate matter ([`01`](./01-vision-strategy.md) §7), small enough to not be relationship-locked like festival headliners. | Lots of $3k–$30k bookings happening weekly in the segment. |
| **Fragmented representation** | No single agency owns the supply; many small managers/agents = many gatekeepers we can win one at a time. | Dozens of independent managers, not three mega-agencies. |
| **Verifiability via DSP claim** | The §1.1 [`03`](./03-trust-verification.md) primary path (Spotify/Apple/YouTube/Meta) must actually work for this segment. | Acts that are their own Spotify-for-Artists admins or have engaged managers who are. |
| **A self-aware scene** | Word-of-mouth is the cheapest growth; the scene must talk to itself. | A genre/city where the managers, agents, and promoters all know each other. |
| **Acute email-thread pain** | The status quo must hurt enough to switch. | High booking volume per act → many parallel email threads → real coordination pain. |
| **Reachable demand side** | We must be able to seed ~70 bookers by hand. | A countable set of promoters/venues/curators serving the scene. |

### 3.2 The recommended beachhead profile (illustrative, to be finalized)

> **Recommendation: a single regional electronic-music / DJ scene in one major-metro touring corridor** — e.g. the mid-tier DJ/electronic circuit in one city + its routing radius. Rationale against the criteria:

- **DSP-claimable supply.** Electronic/DJ acts are overwhelmingly their own Spotify-for-Artists admins, making the [`03`](./03-trust-verification.md) §1.1 primary verification path strong out of the gate — the most important practical constraint.
- **Mid-tier deal density.** Club/festival-slot DJ bookings cluster squarely in the $3k–$30k band — escrow-worthy, take-rate-worthy, not headliner-relationship-locked.
- **Fragmented + self-aware.** The electronic scene is famously a network of independent managers, small agencies, promoters, and clubs who all know each other — ideal for word-of-mouth and one-gatekeeper-at-a-time onboarding.
- **Routing is real.** DJs tour dense corridors; the **routing-aware discovery** wedge ([`08`](./08-profiles-pitches-discovery.md) §4.1) — "verified, in-budget acts already routing near this open date" — is immediately valuable. This is a feature incumbents can't match and the scene will feel instantly.
- **`Listing` model fits cleanly.** "DJ set" as a `Listing` ([`08`](./08-profiles-pitches-discovery.md) §2.5, §7.2 `set_type_requested`) maps to how these acts actually sell.

This is the *recommended profile*, not a final pin. The decision is carried to [`12`](./12-roadmap-risks-open-questions.md); the **criteria in §3.1 are the binding part.**

### 3.3 Geographic and segment discipline during cold-start

- **One corridor, then adjacent corridors.** Expand by *routing adjacency* (the next city the same acts already tour to), not by jumping genres or tiers. Liquidity compounds along real tour routes.
- **Resist tier-drift downward.** Do not let emerging-tier acts dilute the beachhead's "serious, verified, mid-tier" character (the GigSalad trap, [`01`](./01-vision-strategy.md) §2). Emerging acts enter as single-player + top-of-funnel only, ranked and gated so they don't flood the beachhead.
- **Resist genre sprawl.** A second genre is a *second beachhead*, run with the same playbook — not a widening of the first. Density per slice is the whole game.

---

## 4. Concierge / manual seeding — doing things that don't scale

Cold-start is won by **manual, white-glove, deliberately-unscalable** seeding. Automation comes *after* liquidity, not before it. The founder (senior CS, solo) is the concierge in Phase 0; this is a feature, not a stopgap — the founder learns the segment's real workflow by running it by hand.

### 4.1 Supply-side concierge (seed first)

The motion, in order:

1. **Target the gatekeepers, not the artists.** Identify ~10–20 mid-tier managers/agencies in the beachhead whose combined roster is ~70 acts ([§1.1](#11-why-supply-first-and-why-thats-the-easy-side-here)). One verified `Org` = a roster cohort via attestation ([`03`](./03-trust-verification.md) §1.2b).
2. **Concierge onboarding & verification.** Walk each gatekeeper through `Org` KYB ([`03`](./03-trust-verification.md) §2.2) and the §1.1 DSP-claim path for their acts. Manually assist the documentary fallback ([`03`](./03-trust-verification.md) §1.3) where a claim isn't possible. The founder personally clears the first verification queue.
3. **Build their EPKs *for* them (white-glove).** Don't ask a busy manager to fill forms — offer to assemble the verified EPK ([`08`](./08-profiles-pitches-discovery.md) §2) from their existing materials. Lowering activation energy to near-zero is the job. The single-player value (§2) is what makes this an easy yes.
4. **Populate availability + listings.** Get real open dates and real fees/floors into the system so the catalog is *transactable*, not a directory of placeholders.
5. **Hand them single-player wins immediately.** The shareable EPK and the roster CRM deliver value before any booker exists — so the gatekeeper stays engaged through the liquidity build.

### 4.2 Demand-side concierge (seed second, but overlap)

Once the catalog has real, verified, available supply in the beachhead:

1. **Recruit the countable set of beachhead bookers** — the promoters, clubs, curators, and small festivals who book this scene. There are not thousands; there are dozens. Reach them by hand.
2. **Concierge KYC/KYB** ([`03`](./03-trust-verification.md) §2.1–§2.2). Stage the friction ([`03`](./03-trust-verification.md) §2.2): let them browse the verified catalog *before* full KYB, hit the wall only at transact-time.
3. **Manufacture the first transactions (manual matchmaking).** The founder plays matchmaker: "you have a Tuesday hole in March; these three verified acts are routing through and in budget." This is concierge liquidity — humans standing in for the discovery algorithm until density makes it automatic. **Every manually-brokered deal that runs through real escrow ([`04`](./04-payments-escrow-disputes.md)) and produces a real confirmation artifact ([`06`](./06-availability-confirmation.md)) is a proof point and a `platform_confirmed` `BookingCredit` ([`08`](./08-profiles-pitches-discovery.md) §2.4).**
4. **The confirmation artifact is the growth loop.** The shareable *"[Artist] is confirmed for [event]"* artifact ([`06`](./06-availability-confirmation.md)) is promotional gold for both sides and a viral surface that markets showman to the rest of the scene. Lean on it hard during seeding.

### 4.3 Why concierge first, automation later

- **You cannot debug a marketplace you've never run by hand.** Manual seeding teaches the real deal shapes, the real objections, the real verification edge cases — which de-risks every later automated flow.
- **Concierge guarantees the quality bar.** Early reputation is fragile; one fraud or one ghosted balance in a tiny beachhead poisons the whole scene's perception. Hand-running early deals lets the founder enforce the quality gate (§5) with human judgment before the rules are fully codified.
- **The first ~70+70 don't need scale; they need a person.** Scale is a Phase-1+ concern ([`12`](./12-roadmap-risks-open-questions.md)). Phase 0 is a concierge.

---

## 5. Verification as the quality gate (the GTM lever)

[`03`](./03-trust-verification.md) defines *how* verification works (the three trust problems, the state machines, the badges). This section is the **GTM/ops view of the same machinery**: verification is not just a fraud control, it is the **quality gate that makes the marketplace feel serious enough that the represented tier will participate** — and that is itself a growth and pricing lever ([`01`](./01-vision-strategy.md) §7.3).

### 5.1 The gate as a positioning asset

In a tiny beachhead, the claim **"every act here is a verified, authorized team; every booker here is KYC/KYB'd and payment-capable"** is *guaranteeable* and is the single biggest differentiator from GigSalad (self-asserted profiles), Sonicbids (pay-to-pitch, worthless verification), and The Bash (weddings/cover acts). The gate is the brand. Lowering it to chase volume would forfeit the entire wedge ([`01`](./01-vision-strategy.md) §4) — so **the gate never lowers for growth.** Growth comes from *depth in a verified sliver*, not from *breadth of unverified accounts*.

### 5.2 The two gates that make the marketplace serious

| Gate | Mechanism | Owned by | GTM effect |
| --- | --- | --- | --- |
| **Supply gate: authority verification** | No `public`/transactable `ArtistProfile` without provenance-backed authority ([`03`](./03-trust-verification.md) §1). | [`03`](./03-trust-verification.md) | The catalog contains only real, authorized teams. A booker never wastes a request on an impersonator. |
| **Demand gate: money + KYC/KYB** | No `BookingRequest` without `PAYMENT_BACKED` ([`03`](./03-trust-verification.md) §2.3, §2.6) — charge-capable method + deposit hold; KYB before funds held. | [`03`](./03-trust-verification.md) / [`04`](./04-payments-escrow-disputes.md) | Every inbound request is funded and serious. **Money is the spam filter** ([`03`](./03-trust-verification.md) §2.3) — the direct answer to `init-jot`'s "unserious people / spam" fear. |

Combined with the **structured-pitch gate** ([`08`](./08-profiles-pitches-discovery.md) §7.4, minimum-viable pitch), every request that reaches an artist's team is **verified + funded + substantive**. That triple gate is the operational definition of "serious marketplace."

### 5.3 The trust flywheel (why the gate compounds)

```
   verified supply  ─────►  bookers trust the catalog  ─────►  bookers transact
        ▲                                                            │
        │                                                            ▼
   more managers       platform_confirmed credits          real escrowed deals
   bring rosters  ◄──  + reputation accrue (I-20)  ◄──  + confirmation artifacts
        ▲                                                            │
        └──────────────  scene word-of-mouth  ◄─────────────────────┘
```

Each completed, escrowed deal mints a `platform_confirmed` `BookingCredit` ([`08`](./08-profiles-pitches-discovery.md) §2.4) and accrues `ReputationScore` ([`02`](./02-domain-model.md), I-20: no deal, no review) — which **cannot be faked** because it traces to a real escrowed transaction. Stronger profiles rank higher ([`08`](./08-profiles-pitches-discovery.md) §6), attract more demand, produce more proof points, and bring more gatekeepers via word-of-mouth. **Verification seeds the flywheel; reputation spins it.**

### 5.4 Cold-start fairness (so the gate doesn't kill new entrants)

A pure reputation flywheel has a failure mode: rich-get-richer, where only acts with history are ever seen and new entrants are buried — fatal in a cold-start where *everyone* is new. The defenses (owned by [`08`](./08-profiles-pitches-discovery.md) §6.2, restated here as a GTM commitment):

- **Verification provenance is weighted *high* in ranking and is available on day one** — it requires no transaction history. A freshly-verified, zero-credit act ranks respectably ([`08`](./08-profiles-pitches-discovery.md) §6.2).
- **`sample_size_note`** ([`08`](./08-profiles-pitches-discovery.md) §5.1) honestly labels `new` principals rather than penalizing or over-flattering them.
- **No pay-to-rank, ever** ([`08`](./08-profiles-pitches-discovery.md) §6.2) — the Sonicbids anti-pattern. Placement is a pure trust/fit function, which keeps the gate a *quality* signal and not a *wealth* signal.

---

## 6. Liquidity metrics — how we know it's working

Cold-start is measured, not vibed. The metrics below are the **leading indicators of liquidity** in the beachhead. They are read *per-beachhead-slice*, never marketwide (a healthy slice + ten dead slices is a dead marketplace, §0).

### 6.1 The liquidity scorecard

| Metric | Definition | Why it's the signal | Cold-start target (illustrative) |
| --- | --- | --- | --- |
| **Verified supply density** | Count of `public`/`unlisted`, verified, *available* `ArtistProfile`s in the beachhead. | The thing a booker comes to see. | ~70 in the beachhead slice (the liquidity anchor). |
| **Verified demand density** | Count of `PAYMENT_BACKED` ([`03`](./03-trust-verification.md) §2.6) bookers active in the beachhead. | The thing an artist comes for. | ~70 in the beachhead slice. |
| **Request → Confirmed rate** | `BookingRequest`s that reach `Confirmed` ([`05`](./05-negotiation-deal-lifecycle.md)/[`06`](./06-availability-confirmation.md)). | The core funnel health; low rate = bad fit/discovery or a trust gap. | Track trend; a *rising* rate is the real signal. |
| **Search-to-fit rate** | Fraction of booker searches returning ≥N fit-and-available results. | The literal definition of local liquidity ([§0](#0-the-cold-start-problem-stated-honestly)). | The marketplace is "liquid" when this crosses a threshold without manual matchmaking. |
| **Time-to-first-request** | Median time from a `public` `ArtistProfile` going live to its first real request. | Supply-side retention depends on this being short. | Falling over time as density grows. |
| **Concierge dependency ratio** | Share of confirmed deals that required founder matchmaking (§4.2) vs. organic discovery. | The graduation metric: liquidity is real when this approaches zero. | → 0 as the slice matures. |
| **GMV per confirmed deal** | Gross booking value of confirmed, escrowed deals. | Validates the take-rate unit economics ([`01`](./01-vision-strategy.md) §7, [`12`](./12-roadmap-risks-open-questions.md)). | In the $3k–$30k mid-tier band. |
| **Repeat rate** | Bookers/teams who transact more than once. | The retention signal; one-and-done = no real value delivered. | Rising. |

### 6.2 The graduation criteria (Phase 0 → Phase 1)

The beachhead has reached **first liquidity** — and concierge can begin to recede — when, *within the slice*:

1. **Both densities are met** (~70 verified supply, ~70 verified demand).
2. **Search-to-fit clears its threshold** — a typical beachhead search returns enough fit-and-available acts to transact *without* manual matchmaking.
3. **Concierge dependency ratio is falling toward zero** — deals are closing on organic discovery, not founder brokerage.
4. **The flywheel is observable** — `platform_confirmed` credits and reputation are accruing, and at least some new gatekeepers arrived via word-of-mouth rather than outbound.

Hitting these is the trigger to (a) automate the concierge motions and (b) expand by routing adjacency (§3.3) — *not before*. Phasing detail lives in [`12`](./12-roadmap-risks-open-questions.md).

---

## 7. Pricing & take-rate (GTM finalization)

[`01`](./01-vision-strategy.md) §7 locks the **strategy-level take rate**; this doc owns the **GTM finalization** of it — the side-split, the cold-start posture, and how pricing is communicated — consistent with the locked decisions. **This doc does not relitigate [`01`](./01-vision-strategy.md); it operationalizes it.**

### 7.1 The locked frame (from [`01`](./01-vision-strategy.md) §7, restated, not changed)

- **A take rate on *confirmed*, escrowed bookings** — never pay-to-pitch (the Sonicbids anti-pattern), never upfront supply-side fees.
- **Target ~8–12% all-in**, split across both sides, on the gross booking value of confirmed deals.
- **Benchmarked into the researched 2.5–17% band** ([`01`](./01-vision-strategy.md) §7.1): above the GigSalad commodity floor (~2.5–5%) because we do far more than lead-gen, and below the all-in cost of the represented-tier email status quo (an agent's ~10% *plus* the friction, collections risk, and legal overhead).
- **The agent's ~10% is preserved, not collected by us** ([`01`](./01-vision-strategy.md) §5) — it is a separate party's cut modeled in the money flow ([`04`](./04-payments-escrow-disputes.md)), not a showman line item.

### 7.2 GTM levers this doc sets

| Lever | Decision | Rationale |
| --- | --- | --- |
| **Side-split** | Split the ~8–12% across both sides so neither feels solely taxed; exact split tuned per beachhead. | Shared-value, shared-cost ([`01`](./01-vision-strategy.md) §7.2). A booker-only fee (The Bash) or a confused split kills one side's willingness. |
| **Cold-start pricing posture** | Consider a **reduced or waived take rate for the first cohort** of beachhead deals to manufacture proof points and GMV — explicitly time-boxed and framed as a launch concession, **never** as a permanent discount or a pay-to-pitch inversion. | Early deals are worth more as proof than as revenue. A waiver lowers activation energy for the first transactions without compromising the no-pay-to-pitch principle. |
| **Money-gate strength** | Graduated by trust ([`03`](./03-trust-verification.md) §2.3): new bookers face a firmer deposit-hold to send a request; `TRUSTED_BOOKER`s face a lighter one. | Pricing *is* the anti-spam mechanism ([`01`](./01-vision-strategy.md) §7.3, [`03`](./03-trust-verification.md) §2.3). The gate scales with earned reputation. |
| **No paid placement** | Ranking is never purchasable ([`08`](./08-profiles-pitches-discovery.md) §6.2). | Pay-to-rank poisons the trust signal — the one asset we can't sell. |

### 7.3 How pricing reinforces trust (the GTM read)

Restating [`01`](./01-vision-strategy.md) §7.3 as an operational stance: **the take rate buys both sides the escrow guarantee** ([`04`](./04-payments-escrow-disputes.md)) that removes the two canonical failures — ghosted balance (balance escrowed *before* the show, I-16) and false dispute (auto-release unless an in-window evidence-backed `Dispute` lands, I-17). That guarantee is worth paying for *precisely because* it is the value the email status quo cannot provide. And the **money-gated request** does double duty: monetization signal *and* the spam wall. Pricing and trust are the same mechanism viewed from two angles.

---

## 8. Anti-circumvention — defending the take rate (GTM economics)

[`03`](./03-trust-verification.md) §3.4 names the structural threat: **both parties meet on showman, then take the deal off-platform to dodge the take rate** — which also strips the escrow protections that justify the platform. This doc owns the **economic and policy** treatment of that threat (the *detection mechanics* are [`03`](./03-trust-verification.md) §3.4; the *escrow protections forfeited* are [`04`](./04-payments-escrow-disputes.md)).

### 8.1 The core defense: protection *is* the lock-in

The most durable anti-circumvention argument is not a contractual clause — it's that **leaving the platform means giving up the thing that made the platform worth using:**

- **No escrowed balance before the show** (forfeit I-16) → the artist re-exposes themselves to the ghosted-balance failure.
- **No auto-release / no dispute recourse** (forfeit I-17) → the booker re-exposes themselves to non-performance with no neutral resolution.
- **No confirmation artifact** ([`06`](./06-availability-confirmation.md)) → no canonical, promotable "[Artist] is confirmed for [event]."
- **No reputation accrual** (I-20) → the deal builds no `platform_confirmed` track record for either side ([`08`](./08-profiles-pitches-discovery.md) §2.4).

> **The pitch to both sides:** *the take rate is cheaper than the risk you re-acquire by leaving.* For a five-figure mid-tier deal, the escrow protection plus structured deal plus collections-removal is worth more than the spread. This is why the take rate must stay *below the all-in cost of the status quo* ([`01`](./01-vision-strategy.md) §7.2) — if it's cheaper than the friction it removes, circumvention is irrational.

### 8.2 Reputation & badges are non-portable

The trust an account builds on showman — provenance badges ([`03`](./03-trust-verification.md)), `platform_confirmed` credits, `ReputationScore` — **lives here and only here** ([`03`](./03-trust-verification.md) §3.4). Off-platform, both parties are strangers again. The longer a participant transacts on showman, the more non-portable trust they've accumulated, and the higher their switching cost. **Tenure compounds the lock-in.**

### 8.3 Policy & detection posture (ops)

- **Detect-and-flag** the circumvention signals from [`03`](./03-trust-verification.md) §3.4 (requests that open then abruptly cancel post-introduction; contact-info exfiltration patterns in `Pitch`/thread text; repeated near-miss deals between the same pair that never close on-platform). These feed the **Report triage** queue (§9).
- **Don't over-police early.** In the cold-start phase, heavy-handed anti-circumvention enforcement scares off the supply we're courting. Lead with *value* (protection-as-lock-in, §8.1), not surveillance. Enforcement hardens as the marketplace matures.
- **⚖️ LEGAL FLAG.** Any contractual anti-circumvention terms (non-circumvention clauses, off-platform-fee provisions) are a legal-policy question carried to [`12`](./12-roadmap-risks-open-questions.md). The *primary* defense is economic (protection-as-lock-in), not contractual.

---

## 9. Trust & Safety operations — queues, SLAs, appeals

[`03`](./03-trust-verification.md) §3.5 *defines the T&S queues and what feeds them*. This section owns the **operational reality**: who staffs them, how fast they must move, how appeals run, and how the function scales from "the founder" to "a team." T&S is the human layer behind the automated gates — automation handles the common case, humans handle the edges ([`03`](./03-trust-verification.md) §3.5).

### 9.1 The queues (from [`03`](./03-trust-verification.md) §3.5) and their operational SLAs

Every queue item is fed by an `Event` ([`02`](./02-domain-model.md), I-2) and every resolution writes an `Event` — T&S actions are **always auditable, appealable, and (where appropriate) reversible** ([`03`](./03-trust-verification.md) §3.5).

| Queue | Fed by ([`03`](./03-trust-verification.md) §3.5) | Decision | Target SLA (illustrative) | Priority |
| --- | --- | --- | --- | --- |
| **Documentary verification review** | §1.3 fallback submissions | Mint / deny "Verified — documentary review" | **2 business days** | High — blocks supply onboarding |
| **Authority disputes** | competing "I represent this artist" claims ([`03`](./03-trust-verification.md) T11) | Adjudicate competing claims; one wins, others `REJECTED` | **3 business days** | Critical — a wrong call pays a fraudster ([`03`](./03-trust-verification.md) T1) |
| **KYB exceptions** | §2.2 edge cases | Approve / reject business verification | **2 business days** | High — blocks demand onboarding |
| **Report triage** | §3.3 reports (impersonation, spam, fraud, harassment, non-payment, off-platform circumvention §8) | Warn / throttle / suspend / takedown | **Triage 24h; act per severity** | Mixed — fraud/harassment first |
| **Dispute adjudication** | a filed `Dispute` ([`04`](./04-payments-escrow-disputes.md)) | Resolve escrow fund release per platform policy | **Per the [`04`](./04-payments-escrow-disputes.md) dispute window + a hard resolution SLA** | Critical — real money held |
| **Appeals** | every `REJECTED`/`SUSPENDED` state ([`03`](./03-trust-verification.md) §1.6, §2.6) | Re-review; return to `PENDING` or uphold | **3 business days** | High — fairness + unblocks legit users |

> **SLA discipline matters because money is held.** A dispute or a stuck verification isn't an annoyance — it's escrowed funds frozen and a deal in limbo. The research critique of Airbnb's Resolution Center (backlog, inconsistency — carried into [`04`](./04-payments-escrow-disputes.md)'s tightened dispute model) is the anti-pattern: **a slow, inconsistent dispute queue destroys the trust the whole product sells.** Tight, published SLAs are a feature.

### 9.2 The dispute SLA in detail (the highest-stakes queue)

The dispute flow's *mechanics* (evidence windows, structured outcomes, auto-release) are owned by [`04`](./04-payments-escrow-disputes.md). The **ops layer** this doc adds:

- **A hard resolution clock.** Once a `Dispute` is filed within its window (I-17), it must reach a decision inside a **published, fixed SLA** — not "whenever someone gets to it." Funds-held disputes are first-in-line.
- **Structured, consistent adjudication.** Reviewers work from a **structured outcome rubric** (the [`04`](./04-payments-escrow-disputes.md) outcome set), not ad-hoc judgment — consistency is what makes dispute outcomes feel fair and defensible. Every decision records the evidence reference and the reviewer in the `Event` log (I-2).
- **Serial-disputer feedback.** Dispute *rate* is a tracked `ReputationScore` signal ([`03`](./03-trust-verification.md) §2.4) — the serial false-disputer ([`03`](./03-trust-verification.md) T6) becomes visible and gateable. T&S flags patterns; the reputation system gates them automatically.
- **Adjudicate platform/escrow outcomes only — never legal liability** ([`01`](./01-vision-strategy.md) non-goal: not a law firm). The dispute resolves *who gets the escrowed funds under platform policy*, not who is legally right.

### 9.3 The appeals workflow

Fairness is a trust feature. **Every adverse automated or human decision is appealable** ([`03`](./03-trust-verification.md) §1.6 `REJECTED → PENDING`, §2.6 `FLAGGED/SUSPENDED`):

```
   adverse decision (REJECTED / SUSPENDED / takedown / dispute loss)
          │
          ▼
   user files appeal ──► Appeals queue (SLA 3 business days)
          │
          ▼
   re-review by a DIFFERENT reviewer than the original decision (where staffing allows)
          │
     ┌────┴─────────────────────────┐
     ▼                              ▼
   overturned                    upheld
   → state back to PENDING/active  → decision stands; reason recorded
   → Event logged (I-2)            → Event logged; further appeal bounded
```

- **Independent re-review.** An appeal is reviewed by someone other than the original decider where staffing allows — this is the integrity property that keeps appeals from being rubber stamps.
- **Bounded re-appeal.** Appeals are not infinite; a final decision is final after one (or a bounded number of) re-reviews, to prevent appeal-spam as its own abuse vector.
- **Transparency.** The user is told *why* (the structured reason code), not just *that* — opaque rejections breed distrust and support load.

### 9.4 Lazy moderation for the public surface

For the public, indexable EPK surface, moderation is **lazy** (auto-approve + report/takedown), *not* pre-review ([`08`](./08-profiles-pitches-discovery.md) §2.3): `ProfileMedia.moderation_state` defaults to approved; abuse/rights complaints flow into **Report triage** (§9.1). Pre-review doesn't scale and is unnecessary because the marketplace is verification-gated at the account level — the people who can post are already verified. The kill switch (takedown) exists for the edge case.

### 9.5 The staffing model — from founder to function

T&S **staffing scales with the phases** ([`12`](./12-roadmap-risks-open-questions.md)); it does not start as a team:

| Phase | T&S staffing | Why it works at this scale |
| --- | --- | --- |
| **Phase 0 (concierge, ~70+70)** | **The founder** is T&S. Every queue is small enough to clear personally. | Volume is tiny by design (narrow beachhead). The founder's hands-on adjudication *defines* the rubrics that later staff will follow — same reason concierge seeding is founder-run (§4.3). |
| **Phase 1 (first liquidity, expanding)** | First dedicated `staff` reviewer(s); the founder writes down the rubrics learned in Phase 0. | Codified rubrics make the function delegable. SLAs (§9.1) become contractual, not aspirational. |
| **Phase 2 (multi-corridor)** | A small T&S team with on-call rotation for funds-held disputes; tooling to triage/route queues. | Disputes (real money) and authority adjudication (fraud surface) can't wait for business hours at scale. |

> **The Phase-0 founder-as-T&S is a deliberate asset, not a bottleneck.** Adjudicating the first verification, authority, and dispute cases by hand is how the rubrics and SLAs get written from reality rather than guessed — exactly the logic of concierge seeding (§4.3). Automation and staffing harden *after* the founder has run the queues, never before.

### 9.6 What T&S must never become

- **Not a legal authority** ([`01`](./01-vision-strategy.md) non-goal). T&S resolves platform/escrow outcomes; legal liability is out of scope and flagged to counsel ([`12`](./12-roadmap-risks-open-questions.md)).
- **Not a slow, inconsistent backlog** ([`04`](./04-payments-escrow-disputes.md) critique of Airbnb's Resolution Center). Published SLAs + structured rubrics are the antidote.
- **Not opaque.** Every decision has a reason code, an `Event` trail (I-2), and an appeal path. Opacity is the thing that makes users feel screwed even when the decision was right.

---

## 10. The launch playbook (sequenced summary)

A single, ordered checklist that composes everything above into the actual go-to-market motion:

```
PHASE 0 — CONCIERGE COLD-START (founder-run, narrow beachhead)
  1. Pin the beachhead         → one scene/genre/city/tier meeting §3.1 criteria (mid-tier locked by [01])
  2. Ship single-player mode   → verified EPK + free calendar + roster CRM ([08]/[06]/[07]) — useful at zero bookers (§2)
  3. Seed SUPPLY first         → win ~10–20 gatekeepers controlling ~70 acts; concierge-verify via Org KYB + DSP claim ([03])
  4. White-glove EPKs          → build profiles FOR the gatekeepers; populate availability + Listings (§4.1)
  5. Seed DEMAND second        → recruit the countable beachhead bookers; concierge KYC/KYB ([03]); stage the friction
  6. Manufacture first deals   → founder matchmaking → real escrowed deals ([04]) → confirmation artifacts ([06])
  7. Enforce the gate by hand  → founder is T&S; every queue cleared personally; rubrics written from reality (§9.5)
  8. Lean on the viral loop    → the "[Artist] is confirmed" artifact markets showman to the rest of the scene ([06])

GRADUATE when (§6.2): ~70+70 verified, search-to-fit clears threshold, concierge dependency → 0, flywheel observable.

PHASE 1+ — AUTOMATE & EXPAND ([12])
  • Automate the concierge matchmaking (discovery does what the founder did by hand)
  • Codify T&S rubrics + SLAs; hire first dedicated reviewer (§9.5)
  • Expand by ROUTING ADJACENCY (next corridor the same acts tour), not genre/tier sprawl (§3.3)
  • A second genre = a second beachhead, same playbook — never a widening of the first
```

The through-line: **single-player value holds supply in place → concierge seeds a tiny verified slice by hand → the verification gate + escrow protection make the slice serious → the first escrowed deals mint non-fakeable reputation → the flywheel and the confirmation artifact pull in the rest of the scene → only then automate and expand.**

---

## 11. How this doc connects to its siblings (cross-reference map)

| Sibling doc | What this doc consumes from it | What this doc provides to it |
| --- | --- | --- |
| [`01-vision-strategy.md`](./01-vision-strategy.md) | the mid-tier beachhead, aid-not-replace, the ~8–12% take-rate frame, non-goals, pricing-as-trust | GTM finalization of the take rate (side-split, cold-start posture); the beachhead selection criteria + recommendation |
| [`02-domain-model.md`](./02-domain-model.md) | all entity/role terms; invariants (I-12 dedup, I-16/I-17 escrow, I-20 no-deal-no-review, I-2 audit); actor-vs-principal | GTM/ops view of how the model is populated and operated; the liquidity metrics over its entities |
| [`03-trust-verification.md`](./03-trust-verification.md) | the three trust problems, money-as-spam-filter, verification state machines, the T&S **queue definitions** (§3.5), anti-circumvention **detection** (§3.4), badge decay | the **ops layer**: who staffs the queues, SLAs, appeals workflow, staffing model; the GTM read of verification-as-quality-gate; the **economics** of anti-circumvention |
| [`04-payments-escrow-disputes.md`](./04-payments-escrow-disputes.md) | escrow protections (I-16/I-17), the dispute mechanics + outcome rubric, the Airbnb-Resolution-Center critique | dispute **SLA/ops** layer; the protection-as-lock-in argument that defends the take rate |
| [`05-negotiation-deal-lifecycle.md`](./05-negotiation-deal-lifecycle.md) | the deal state machine that `Request → Confirmed` metrics measure; floor logic | the funnel metrics over the lifecycle; cold-start matchmaking that seeds deals |
| [`06-availability-confirmation.md`](./06-availability-confirmation.md) | the free availability calendar (single-player); the confirmation artifact (viral loop) | availability as a single-player retention tool; the artifact as the cold-start growth engine |
| [`07-roster-org-rbac.md`](./07-roster-org-rbac.md) | the roster CRM (single-player); org-as-supply-cohort; on-behalf-of routing (I-12) | the gatekeeper-onboarding motion (one verified `Org` = a roster cohort); the roster CRM as single-player value |
| [`08-profiles-pitches-discovery.md`](./08-profiles-pitches-discovery.md) | the verified EPK + `unlisted` (single-player); cold-start-fair ranking; lazy moderation; the structured-pitch gate | the GTM use of `unlisted`/standalone EPK; the quality-gate framing of verification + money + pitch gates |
| [`09-system-architecture.md`](./09-system-architecture.md) | the search index, moderation queue, bounded contexts that the ops surfaces run on | the operational requirements the T&S tooling + metrics surfaces must support |
| [`10-design-direction-ux.md`](./10-design-direction-ux.md) | visual treatment of the EPK, decision surface, confirmation artifact | the cold-start UX needs (white-glove onboarding, the viral artifact as a designed object) |
| [`12-roadmap-risks-open-questions.md`](./12-roadmap-risks-open-questions.md) | phasing, the risk register, the carried open questions | the beachhead pin, anti-circumvention legal-policy flag, T&S staffing scale, take-rate side-split — all carried here |

---

## 12. Open questions (carried, not blocking)

- **Exact beachhead pin.** §3 commits the *criteria* and a *recommended profile* (regional mid-tier electronic/DJ scene + routing corridor); the final scene/genre/city pin needs real-world founder knowledge of where the criteria score highest. → [`01`](./01-vision-strategy.md) open question / [`12`](./12-roadmap-risks-open-questions.md).
- **Take-rate side-split.** The ~8–12% all-in is locked ([`01`](./01-vision-strategy.md) §7); the exact artist-side vs. booker-side split and whether to vary it by tier/beachhead is a GTM lever to finalize against early unit economics. → [`12`](./12-roadmap-risks-open-questions.md).
- **Cold-start pricing concession.** Whether (and how steeply / for how long) to waive or reduce the take rate for the first beachhead cohort to manufacture proof points — without ever inverting into pay-to-pitch. → [`12`](./12-roadmap-risks-open-questions.md).
- **Liquidity thresholds.** The ~70+70 anchor and the search-to-fit threshold are illustrative; the *real* graduation numbers (§6.2) must be calibrated against the chosen beachhead's actual booking cadence. → [`12`](./12-roadmap-risks-open-questions.md).
- **Artist→booker outreach in v1.** Whether the narrow, gated artist→booker outreach surface ([`08`](./08-profiles-pitches-discovery.md) §4.2) earns its keep in the cold-start phase or is deferred to Phase 2 (it adds T&S surface area — §9 — for uncertain early payoff). → [`08`](./08-profiles-pitches-discovery.md) / [`12`](./12-roadmap-risks-open-questions.md).
- **Anti-circumvention contractual terms.** Whether to add non-circumvention/off-platform-fee clauses on top of the economic protection-as-lock-in defense (§8). ⚖️ LEGAL FLAG → [`12`](./12-roadmap-risks-open-questions.md).
- **T&S SLA commitments.** The SLAs in §9.1 are illustrative targets; which become *published, contractual* commitments (a trust feature) vs. internal goals, and how the funds-held dispute on-call rotation is structured at scale. → [`12`](./12-roadmap-risks-open-questions.md).

---

### Cross-references

- Strategy frame: beachhead tier, aid-not-replace, take-rate band, non-goals → [`01-vision-strategy.md`](./01-vision-strategy.md)
- Entities, roles, invariants (the spine) → [`02-domain-model.md`](./02-domain-model.md)
- The three trust problems, money-as-spam-filter, verification state machines, T&S queue definitions, anti-circumvention detection → [`03-trust-verification.md`](./03-trust-verification.md)
- Escrow protections (I-16/I-17), dispute mechanics & outcome rubric → [`04-payments-escrow-disputes.md`](./04-payments-escrow-disputes.md)
- Deal state machine the funnel measures → [`05-negotiation-deal-lifecycle.md`](./05-negotiation-deal-lifecycle.md)
- Free availability calendar (single-player) + the confirmation artifact (viral loop) → [`06-availability-confirmation.md`](./06-availability-confirmation.md)
- Roster CRM (single-player) + org-as-supply-cohort + on-behalf-of routing → [`07-roster-org-rbac.md`](./07-roster-org-rbac.md)
- Verified EPK + `unlisted` (single-player), cold-start-fair ranking, lazy moderation, structured-pitch gate → [`08-profiles-pitches-discovery.md`](./08-profiles-pitches-discovery.md)
- Search index, moderation queue, bounded contexts the ops surfaces run on → [`09-system-architecture.md`](./09-system-architecture.md)
- UX of the EPK, decision surface, confirmation artifact → [`10-design-direction-ux.md`](./10-design-direction-ux.md)
- Phasing, risk register, carried open questions → [`12-roadmap-risks-open-questions.md`](./12-roadmap-risks-open-questions.md)

---

*End of 11-gtm-liquidity-trust-safety-ops.md — seed supply first; single-player before multiplayer; narrow the beachhead until it's almost embarrassing; verification is the quality gate; the founder is T&S until the queues teach the rubrics. Liquidity is local, and it's won by hand before it's won by code.*
