# 12 — Roadmap, Risks & Open Questions

> Part of the **showman** foundation doc set (`docs/foundation/`). This is the **closing doc**: it sequences the build, names what can kill us, and consolidates every open question the rest of the set has been deferring "to `12`."
>
> **Scope.** Three things, in order: (1) a **phasing plan** — Phase 0 single-player artist tools → Phase 1 verified booking + escrow in one beachhead → Phase 2 orgs/festivals/integrations — with a concrete milestone sequence; (2) a **risk register** covering verification spoofing, escrow/dispute edge cases, two-sided fraud, and regulatory exposure; (3) the **consolidated open-questions register** — every "carried to `12`" item from across the doc set, gathered into one place with a name, an owner, a decision deadline, and a recommended default.
>
> **This doc owns no new entities and no new invariants.** It re-derives nothing. Every term here is the ubiquitous language of [`02-domain-model.md`](./02-domain-model.md); every mechanism it sequences or risks is *owned* elsewhere and cross-referenced. If this doc and a sibling ever disagree on a term or a mechanism, **the sibling wins and this doc is wrong** — fix it here. The job of `12` is to be the project's single map of *when*, *what could go wrong*, and *what's still undecided* — not to invent.
>
> **Legal flag, not legal advice.** Several roadmap gates and most of §3 (Regulatory) touch licensed territory. They are marked **⚖️ LEGAL FLAG** and feed the open-questions register (§4). showman offloads regulated custody/KYC to Stripe/Persona (per [`04`](./04-payments-escrow-disputes.md) §0, [`03`](./03-trust-verification.md) §0); it does not thereby become a compliance authority, and the items below are flagged precisely because they need real counsel before money moves.

---

## 0. How to read this document

The three sections answer three different questions and are meant to be used differently:

| § | Question | Use it when |
| --- | --- | --- |
| **§1–§2 Roadmap & milestones** | *What do we build, in what order, and what proves each phase done?* | Planning a sprint; deciding what's in/out of a release; checking a feature is on-phase. |
| **§3 Risk register** | *What can kill this, how likely, how bad, and what's the named defense?* | Pre-mortem; deciding what to harden first; red-teaming a design. |
| **§4 Open-questions register** | *What did we deliberately leave undecided, who decides, and by when?* | Before committing to an implementation that an open question gates; tracking decision debt. |

A single principle threads all three, inherited from the blueprint and [`01`](./01-vision-strategy.md):

> **Buy the regulated rails; build the trust logic; sequence so that the moat (deal state machine, escrow-release policy, authority/verification model, dispute flow) is what we spend our scarce engineering on, and the commodity (custody, KYC, e-sign) is bought the moment it's needed and not a day before.**

---

## 1. Phasing — the three-phase shape

The phasing is a **liquidity strategy expressed as an engineering plan.** It follows directly from two locked strategic facts:

1. **Supply is easier to seed than demand** ([`01`](./01-vision-strategy.md) §2, [`03`](./03-trust-verification.md) §2, [`11`](./11-gtm-liquidity-trust-safety-ops.md)). Bookers already have agents and relationships; artists/teams feel the email-thread pain and have a reason to show up first.
2. **A two-sided marketplace with no liquidity is worthless on day one.** So the first thing we ship must be **single-player valuable** — useful to one side even when the other side is empty (the `init-jot` worry that "artists might be the easiest to onboard… but getting solid bookers… might be more difficult").

That gives the spine: **earn supply with standalone tools (Phase 0) → turn on the transaction in one narrow beachhead (Phase 1) → scale to multi-party orgs/festivals and integrations (Phase 2).** We grow *up the tier ladder* and *out the feature surface*, never trying to boil the ocean.

```
 PHASE 0  ── single-player artist/team tools ──────────────────────────────────┐
   value to SUPPLY before any booker exists.                                    │
   Verified EPK + availability calendar + roster CRM.                           │
   No money moves. No marketplace yet. This IS the supply-seeding mechanism.    │
        │  (artists/teams onboarded + verified; calendars populated)            │
        ▼                                                                       │
 PHASE 1  ── verified booking + escrow, ONE beachhead ─────────────────────────┤
   turn on the transaction for ONE scene/genre/city/tier.                       │
   BookingRequest → Offer/Counter → Agreement+e-sign → Deposit/EscrowBalance    │
   → Confirmed artifact → Performed → auto-release → Dispute path.              │
   Concierge-seeded demand. Manual T&S/adjudication is fine at this volume.     │
        │  (first real confirmed, escrowed, settled bookings)                   │
        ▼                                                                       │
 PHASE 2  ── orgs / festivals / integrations / scale ──────────────────────────┘
   multi-party programming, deeper org RBAC, Slack/email integrations,
   group/bundled bookings, geo-aware conflict warnings, KYB-at-scale,
   funds-segregation hardening, second beachhead, automation of T&S.
```

### 1.1 Phase 0 — single-player artist/team tools (seed supply)

**Goal:** be useful to an artist or their team **before any booker exists**, so we can onboard and verify supply with no liquidity. This is the cold-start answer ([`11`](./11-gtm-liquidity-trust-safety-ops.md)) expressed as scope.

**What ships (all single-player, no money, no counterparty):**

- **Identity & authority verification — the supply half.** The §1.1 DSP-claim primary path and §1.2 attestation/counter-signature paths from [`03`](./03-trust-verification.md): claim an `ArtistProfile` via Spotify for Artists / Apple Music for Artists / YouTube OAC / Meta, mint the provenance badge, and let a verified `owner` invite the team (`Membership` roles per [`07`](./07-roster-org-rbac.md)). **This is the single most strategically important Phase-0 deliverable** — it's the moat, it's the supply gate, and it's the thing we most need to de-risk early (see the DSP-API spike, §1.4).
- **The verified EPK** — the `ArtistProfile` as a profile/EPK with media, fee range, prior shows, and the verification provenance badges ([`08`](./08-profiles-pitches-discovery.md)). Useful as a shareable press kit even with zero bookings.
- **The availability calendar** — `AvailabilityWindow` painting and blackouts, the manual source from [`06`](./06-availability-confirmation.md) §1.4. A working calendar tool standalone.
- **The roster workspace (lite)** — `Org` + `Membership` + on-behalf-of so a manager can hold several artists and act for each ([`07`](./07-roster-org-rbac.md)). Replaces a spreadsheet on day one.
- **Identity KYC** for users who will later transact, via Stripe Identity / Connect onboarding ([`03`](./03-trust-verification.md) §1.5, §2.1) — seeded here so Phase 1 doesn't bottleneck on it.

**Explicitly NOT in Phase 0:** no `BookingRequest`, no `Offer`/`Agreement`, no money, no `Hold` stacking races, no disputes, no booker side beyond a stub. The deal state machine ([`05`](./05-negotiation-deal-lifecycle.md)) is *designed* but not *shipped*.

**Exit criteria (Phase 0 → Phase 1):**

- [ ] A real artist/team can self-serve **claim + verify** via at least one DSP source and get a live provenance badge ([`03`](./03-trust-verification.md) §1.1) — *or* the documentary fallback works end-to-end if the DSP-API spike (§1.4) comes back negative.
- [ ] The verified EPK + calendar are good enough that a seeded cohort of teams in the chosen beachhead actually use them (a `11` liquidity metric, not just "it renders").
- [ ] `Org`/`Membership`/on-behalf-of model is live and a manager can operate ≥2 artists.
- [ ] KYC onboarding via Stripe is wired and a user can complete it.

### 1.2 Phase 1 — verified booking + escrow in ONE beachhead (turn on the transaction)

**Goal:** the first **real, confirmed, escrowed, settled booking** — in exactly one narrow beachhead (one scene/genre/city/tier; the choice is **OQ-1**, see §4). Demand is **concierge-seeded** ([`11`](./11-gtm-liquidity-trust-safety-ops.md)); we do not try to attract bookers at scale yet.

**What ships (the transaction core, end to end, for the single-player-seeded supply):**

- **The booker side, gated.** `BookerProfile`, Connect onboarding/KYC, and the **money-gated request** wall: a booker reaches `PAYMENT_BACKED` before they can send a real `BookingRequest` ([`03`](./03-trust-verification.md) §2.3, §2.6). KYB for org-backed buyers at the **launch depth decided in OQ-3**.
- **The deal state machine** ([`05`](./05-negotiation-deal-lifecycle.md)) end to end: `Draft → Request sent (Pitch + optional deposit-backed Hold) → Offer/Counter loop (set price + private floor) → Accepted → Agreement generated & e-signed → Deposit captured → Confirmed → Performed → Settled → Reviewed`, with `Expire / Cancel / Dispute` branches.
- **The `Hold` soft-lock + double-booking guarantee** ([`06`](./06-availability-confirmation.md)): stacked prioritized holds, deposit-backed strength, the explicit-confirm gate (Hard Rule 1 / **I-10**), the DB-level no-double-booking constraint (**I-9**).
- **Escrow on the industry rhythm** ([`04`](./04-payments-escrow-disputes.md)): Stripe Connect separate charges/transfers + delayed payouts; `Deposit` at **`DepositCaptured`** (pre-`Confirmed`), **balance escrowed before the show (I-16)**, **auto-release after the settlement window unless an in-window evidenced `Dispute` lands (I-17)**, take rate carved at release.
- **E-sign** for the `Agreement` + riders — **vendor decided in OQ-2** (Dropbox Sign default).
- **The dispute path** ([`04`](./04-payments-escrow-disputes.md) §6): fixed evidence window, enumerated outcomes (`resolved_release`/`resolved_refund`/`resolved_split`), **manual adjudication** (fine at beachhead volume per [`04`](./04-payments-escrow-disputes.md) §4 and [`11`](./11-gtm-liquidity-trust-safety-ops.md)).
- **The `Confirmed` artifact** ([`06`](./06-availability-confirmation.md) §4): the in-app moment + ICS + notifications; the **public/promo card** can be Phase-1-late or Phase-2 (it's a growth loop, not a transaction primitive).
- **Reputation v1** ([`03`](./03-trust-verification.md) §2.4): completion rate, dispute rate, two-sided reviews tied to a real `Agreement` (**I-20**).

**Explicitly NOT in Phase 1:** multi-artist *bundled* bookings, deep festival programming workspaces, Slack/email integrations beyond basic email notifications, geo-aware travel-conflict detection, cross-border/FX, automated T&S, funds segregation. All deferred to Phase 2 and flagged in §4.

**The hard pre-launch gate — this blocks Phase 1 turning on real money:**

> **⚖️ LEGAL FLAG — money-transmission counsel sign-off ([`04`](./04-payments-escrow-disputes.md) §0/§9, **OQ-4**).** Before a single real charge clears, a fintech/payments lawyer must confirm (a) the Stripe Connect flow-of-funds covers our model, (b) showman is a "platform/marketplace," not a "money transmitter," under the relevant tests, and (c) the take-rate carve (deduct-at-release) is structured cleanly. This is the **single most important external review item in the entire foundation.** Phase 1 ships its non-money surfaces (negotiation, holds, e-sign, the artifact) regardless, but **the escrow rail does not go live until this clears.**

**Exit criteria (Phase 1 → Phase 2):**

- [ ] Money-transmission counsel sign-off obtained (the gate above).
- [ ] ≥1 booking completed the **full** path `Confirmed → Performed → Settled` with real escrowed money and clean reconciliation against Stripe ([`04`](./04-payments-escrow-disputes.md) §8).
- [ ] At least one `Dispute` resolved end to end through the manual adjudication flow (proves the policy + ops loop, not just the happy path).
- [ ] Reconciliation job runs clean (ledger ↔ Stripe never silently drifts, [`04`](./04-payments-escrow-disputes.md) §8).
- [ ] Beachhead liquidity metric met (a `11` target — enough repeat usage that the marketplace isn't purely concierge-propped).

### 1.3 Phase 2 — orgs / festivals / integrations / scale

**Goal:** move *up the tier ladder* (toward represented/festival deals, [`01`](./01-vision-strategy.md) §2) and *out the feature surface*, and make the operations scale past solo/manual.

**What ships:**

- **Deep org & festival programming.** Full `Org` RBAC depth ([`07`](./07-roster-org-rbac.md)), multi-artist coordination, the festival **coordination workspace** (book many acts, track every deal's state in one place, dedup "same team" requests via I-12 / on-behalf-of).
- **Group / bundled bookings** — the carried open question (`02` §6 / [`07`](./07-roster-org-rbac.md) / [`06`](./06-availability-confirmation.md) §9): all-or-nothing confirmation of several artists from one `Org`. v1 was independent holds; Phase 2 evaluates bundled.
- **Integrations** — the `init-jot` "run at scale" ask: Slack/email `notification_sink` fan-out for festivals/labels, `calendar_sync` two-way maturity ([`06`](./06-availability-confirmation.md) §1.4).
- **Geo-aware conflict detection** — travel-time/cross-city soft warnings beyond v1's exact-span guarantee ([`06`](./06-availability-confirmation.md) §1.2, §9).
- **T&S automation** — turn the manual queues ([`03`](./03-trust-verification.md) §3.5) into tooled, partially-automated workflows as volume grows; revisit **Trustap-for-adjudication-only** *only if* dispute volume outruns staffing ([`04`](./04-payments-escrow-disputes.md) §4 revisit trigger, **OQ-6**).
- **Compliance hardening** — Connect **funds segregation** as the non-custody-story upgrade ([`04`](./04-payments-escrow-disputes.md) §3.1, **OQ-9**); KYB-at-scale; sanctions/PEP cadence; ID/biometric retention policy finalized ([`03`](./03-trust-verification.md) §7, **OQ-7**).
- **Cross-border / FX** — Connect cross-border payouts + FX once the second beachhead crosses a border ([`04`](./04-payments-escrow-disputes.md) §9, **OQ-10**).
- **Second beachhead** — replicate the Phase-1 motion into an adjacent scene/genre/city; the public/promo growth loop ([`06`](./06-availability-confirmation.md) §4.4) is now doing real top-of-funnel work.

**Explicitly NOT even in Phase 2** (the [`01`](./01-vision-strategy.md) §6 non-goals, restated as anti-scope so they never sneak in): ticketing, becoming a DSP, a social feed, adjudicating legal liability, holding funds on our own license, or representing artists/taking a representation cut. These are *permanent* non-goals, not "later" — flagged here so roadmap pressure never relitigates them.

### 1.4 De-risking spikes (do these early; they gate phase scope)

The blueprint's verification section names two throwaway spikes; a third falls out of the trust doc. None ship production code; each retires a specific risk before we commit a phase to a design.

| Spike | Retires the risk that… | Method | Gates | Owner doc |
| --- | --- | --- | --- | --- |
| **Stripe escrow test-mode spike** | the deposit→hold→delayed-payout→release flow does *not* actually behave like escrow on standard Connect. | Stripe **test mode**: separate charges/transfers + manual payout; prove `holding → fully_funded → release_pending → released` and a refund path. | Phase 1 payments design ([`04`](./04-payments-escrow-disputes.md)). | `04` |
| **Deal state-machine prototype** | the negotiation/escrow/dispute transitions have an unhandled edge (race, dead state, illegal transition). | The `prototype` skill — a **runnable terminal model** of the [`05`](./05-negotiation-deal-lifecycle.md) machine + [`04`](./04-payments-escrow-disputes.md) escrow sub-machine + [`06`](./06-availability-confirmation.md) hold lifecycle. No production code. | Phase 1 core. | `05` |
| **DSP-API reality spike** ⚠️ | the §1.1 primary verification path is unbuildable because Spotify/Apple/YouTube/Meta don't expose a usable third-party OAuth/claim API ([`03`](./03-trust-verification.md) §7, **OQ-11**). | Hands-on: attempt a real claim flow against each source's developer API; document what's available vs. partnership-gated vs. scrape-only. | **Phase 0** — the supply gate depends on it. | `03` |

> **The DSP-API spike is the highest-leverage de-risk in the whole plan and must run first.** If the primary verification path is weaker than [`03`](./03-trust-verification.md) §1.1 assumes, the supply-side trust story — and therefore the entire wedge — shifts toward attestation + documentary review, which changes Phase 0 scope, T&S staffing, and the badge taxonomy's center of gravity. Find out before building Phase 0, not during.

---

## 2. Milestone sequence

A linear, dependency-ordered sequence. Each milestone is a checkpoint, not a calendar date (this is a solo founder; sequence matters, dates don't). Milestones map onto the phases above.

```
 M0  Foundation docs reviewed & internally consistent  ──┐  (this doc set; the
       (02 spine ⇄ 05 machine ⇄ 04 escrow ⇄ 06 holds      │   consistency pass in
        reconcile; no ubiquitous-language drift)          │   the blueprint's
                                                          ─┘   "Verification" section)
        ▼
 ════════════════════════ PHASE 0 ════════════════════════
 M1  DSP-API reality spike complete  ⚠️ FIRST
       → confirms/reshapes the §1.1 primary verification path (OQ-11)
        ▼
 M2  Identity + authority verification (supply half)
       claim via DSP source → provenance badge → owner invites team
       (03 §1.1–§1.2; 07 Membership roles); KYC via Stripe (03 §2.1)
        ▼
 M3  Verified EPK + availability calendar + roster-lite
       (08 profile; 06 §1 calendar; 07 Org/Membership/OBO)
        ▼
 M4  Phase 0 EXIT: seeded beachhead cohort actively using single-player tools
       (11 liquidity metric) ───────────────────────────────────────────────────►
        ▼
 ════════════════════════ PHASE 1 ════════════════════════
 M5  Stripe escrow test-mode spike + deal-state-machine prototype green
       (the two de-risk spikes; 04 + 05)
        ▼
 M6  ⚖️ Money-transmission counsel sign-off  (OQ-4)  ── HARD GATE for real money
        ▼
 M7  Booker side + money-gate wall
       BookerProfile, Connect onboarding, PAYMENT_BACKED gate (03 §2.3/§2.6),
       KYB at launch depth (OQ-3)
        ▼
 M8  Deal state machine end-to-end (05) + Hold soft-lock & no-double-booking (06)
       + e-sign integration (OQ-2 vendor)
        ▼
 M9  Escrow rail live: Deposit/EscrowBalance, balance-before-show (I-16),
       auto-release (I-17), take-rate carve, webhooks+reconciliation (04 §8)
        ▼
 M10 Confirmed artifact (06 §4: in-app + ICS + notifications) + Reputation v1 (03 §2.4)
        ▼
 M11 Dispute path live + manual adjudication loop (04 §6); first dispute resolved
        ▼
 M12 Phase 1 EXIT: first full Confirmed→Performed→Settled with real escrow;
       clean reconciliation; beachhead liquidity target met ──────────────────────►
        ▼
 ════════════════════════ PHASE 2 ════════════════════════
 M13 Festival/org programming workspace + deep RBAC (07) + dedup/coordination
 M14 Integrations: Slack/email notification sinks; calendar_sync maturity (06)
 M15 Group/bundled bookings (07/06 §9 open question resolved)
 M16 Geo-aware conflict warnings (06 §1.2) ; public/promo growth card hardened (06 §4.4)
 M17 Compliance hardening: funds segregation (OQ-9), ID/biometric retention (OQ-7),
       KYB-at-scale, sanctions cadence
 M18 T&S automation; Trustap-for-adjudication revisit IF volume demands (OQ-6)
 M19 Cross-border/FX (OQ-10) + second beachhead
```

**The three non-negotiable ordering constraints** (everything else can flex):

1. **M1 (DSP-API spike) before any Phase-0 verification build.** The supply gate's shape depends on its outcome.
2. **M6 (money-transmission sign-off) before M9 (escrow rail live).** No real custody flow until counsel clears it. Non-money Phase-1 surfaces (M7–M8 negotiation/holds/e-sign) may proceed in parallel with the legal review, but **M9 cannot.**
3. **M2 (supply verification) before M7 (booker side).** Seed and verify supply before turning on demand — the whole liquidity thesis. A verified-supply, empty-demand marketplace is recoverable (concierge the demand); an unverified-supply marketplace poisons itself ([`03`](./03-trust-verification.md) §2).

---

## 3. Risk register

Severity × likelihood, each with the **named defense already designed into the doc set** and the **residual** (what's left after the defense — the honest part). The point of a risk register is not to list fears; it's to confirm every serious risk already has an owner and a mechanism, and to surface the ones that *don't* yet.

**Severity:** Critical (can end the company / lose large customer money / regulatory shutdown) · High (serious harm, recoverable) · Medium (painful, contained) · Low (annoyance).
**Likelihood:** at beachhead scale, qualitative.

### 3.1 Verification & impersonation risks (the trust layer)

| ID | Risk | Sev | Like | Named defense (owner) | Residual |
| --- | --- | --- | --- | --- | --- |
| **R-V1** | **Impersonator-as-artist** collects a real payout under a famous name (the catastrophic case the whole product rests on). | Critical | Med | DSP-claim primary path; **identity ≠ authority (I-5)**; payout follows the *principal's* connected account (I-19); authority-dispute queue. ([`03`](./03-trust-verification.md) §1, T1) | Documentary-fallback artists are weaker-verified; mitigated by manual review + payout-to-principal. |
| **R-V2** | **DSP-API path is unbuildable** → the strongest verification path collapses to documentary review, weakening the whole supply-trust story. | High | **Med-High** | The **DSP-API reality spike (M1)** runs *first* to find out; attestation + documentary fallback exist as designed alternatives. ([`03`](./03-trust-verification.md) §7 / **OQ-11**) | If true, T&S load and onboarding friction rise materially; badge taxonomy re-centers. *This is the roadmap's biggest single unknown.* |
| **R-V3** | **Sockpuppet vouch ring** manufactures authority via fake owner → fake team invites. | High | Low | Counter-signature **rooted in a strongly-verified node**; only `owner`/`agent` may invite; `viewer` can't mint authority; collapsing the root REVOKEs the leaves. ([`03`](./03-trust-verification.md) §1.2a, T3) | Vouch-chain depth limit still open (**OQ-12**). |
| **R-V4** | **Rogue ex-manager** (real human, authority revoked) keeps acting mid-deal. | High | Low-Med | **I-4** removes authority immediately on `SUSPEND`/`REVOKE`; badge **decay** on upstream OAuth loss; live deals surface re-authorization. ([`03`](./03-trust-verification.md) §1.6/§4, T2) | Re-verification cadence is still a tuning open question (**OQ-5**) — too slow a re-check widens the stale window. |
| **R-V5** | **Stale-badge exploit** — trading on verification no longer true. | Med | Med | Badges are **present-tense claims**; periodic re-check + high-value-transaction re-check trigger. ([`03`](./03-trust-verification.md) §4, T10) | Cadence tuning (**OQ-5**). |
| **R-V6** | **Competing authority claims** — two parties both claim one artist. | High | Low | Single-active-claim lock (mirrors S4A); authority-dispute queue adjudicates. ([`03`](./03-trust-verification.md) §3.5, T11) | Manual adjudication is solo-staffed at beachhead; scales as a Phase-2 concern. |
| **R-V7** | **ID/biometric data breach** of sensitive verification documents. | Critical | Low | **Don't custody what we can offload** — Stripe Identity/Persona hold raw docs; showman stores result + provenance, not the raw image. ⚖️ ([`03`](./03-trust-verification.md) §1.3, T12; [`09`](./09-system-architecture.md)) | Retention/consent policy (BIPA-style) still open (**OQ-7**). |

### 3.2 Escrow & dispute edge-case risks (the money policy)

| ID | Risk | Sev | Like | Named defense (owner) | Residual |
| --- | --- | --- | --- | --- | --- |
| **R-E1** | **Booker ghosts after deposit** (Failure A). | High | Med | **Balance escrowed before performance (I-16)**; deal can't reach a funded `Performed` on an IOU; funding failure cancels against the booker. ([`04`](./04-payments-escrow-disputes.md) §1, INV-1) | Booker who can't fund the balance simply loses the date — handled, but it's a deal that doesn't happen. |
| **R-E2** | **Artist trapped by a false dispute** (Failure B). | High | Med | **Auto-release unless an in-window, evidenced `Dispute` lands (I-17)**; silence pays the artist; dispute requires reason-code + evidence; dispute *rate* gates serial false-disputers. ([`04`](./04-payments-escrow-disputes.md) §1/§6, INV-2; [`03`](./03-trust-verification.md) §2.4, T6) | Settlement-window length (**OQ-8**) trades artist-speed vs. booker-recourse; wrong value hurts one side. |
| **R-E3** | **Post-release card chargeback** — booker loses/skips our `Dispute`, then charges back at their bank after funds are released to the artist; liability can land on the platform balance. **The one risk that can actually lose showman money.** | High | Med | Release only after the show + window clears; retain signed `Contract` + `Confirmation` artifact + delivery evidence as chargeback evidence; KYC/KYB raises fraud cost; consider Stripe chargeback-protection products. ([`04`](./04-payments-escrow-disputes.md) §9) | **Underwrite the residual; do not assume zero.** A chargeback bypasses our policy entirely (card-network rules). Reserve/insurance posture is a finance open item. |
| **R-E4** | **Reconciliation drift** — our `EscrowBalance` ledger silently diverges from Stripe (double-release, missed capture, lost webhook). | Critical | Low-Med | Stripe = cash truth, our ledger = policy truth; **idempotency keys everywhere**; idempotent webhook handlers; **reconciliation job** diffs ledger ↔ Stripe and flags divergence; release timer re-checks state at fire time. ([`04`](./04-payments-escrow-disputes.md) §8; [`09`](./09-system-architecture.md)) | Webhook-source-of-truth correctness is unforgiving; the escrow test-mode spike (M5) and a hard reconciliation gate (M12) exist to catch it before scale. |
| **R-E5** | **Auto-release races a last-second dispute** — timer fires the same instant a valid dispute opens. | High | Low | Release is a **background job that re-checks ledger state at fire time** (still `release_pending`? no open dispute?) inside a transaction; a dispute landing a minute before wins. ([`04`](./04-payments-escrow-disputes.md) §7/§8, INV-2) | Clock-skew/edge timing; mitigated by re-check-at-fire, not by trusting the scheduler. |
| **R-E6** | **Partial-performance / no-show ambiguity** — adjudicator has no clean rule. | Med | Med | Enumerated outcomes (`resolved_split`/`resolved_refund`); named edge cases (no-show → refund; partial → split; pre-show booker cancel → cancellation policy, not dispute). ([`04`](./04-payments-escrow-disputes.md) §6.3) | Adjudication consistency depends on solo judgment at beachhead; codify rules as volume grows. |
| **R-E7** | **Dispute volume outruns manual adjudication** before ops can be staffed. | Med | Low-Med | Manual is *fine at beachhead volume* by design; **revisit trigger** to consider Trustap-for-adjudication-only (Stripe stays custodian). ([`04`](./04-payments-escrow-disputes.md) §4 / **OQ-6**) | A genuine scale cliff; the trigger must be watched, not assumed far off. |
| **R-E8** | **Hold/escrow timing bugs** — a deposit authorization left dangling, or a `pending_confirmation` freeze that never releases, strands money or a date. | Med | Low-Med | Event-driven expiry (not lazy); auth **voided** on expire/release (I-11); backstop `confirmation_deadline` so a stalled signature can't lock a date forever. ([`06`](./06-availability-confirmation.md) §2.4) | Background-job reliability; same correctness surface as R-E4/R-E5. |

### 3.3 Two-sided fraud & abuse risks (the marketplace integrity)

| ID | Risk | Sev | Like | Named defense (owner) | Residual |
| --- | --- | --- | --- | --- | --- |
| **R-F1** | **Tire-kicker / spam booker** floods artists with junk requests. | Med | High | **Money as the spam filter** — every real `BookingRequest` needs a charge-capable method + deposit hold; spamming costs real held money; rate limits scale with trust. ([`03`](./03-trust-verification.md) §2.3/§3.2, T4) | Graduated-gate tuning; too-firm a gate also deters *good* new bookers — the demand-friction balance. |
| **R-F2** | **Insolvent / fake booker** looks legit but can't pay the balance. | High | Med | KYB on org-backed buyers + **balance-before-show (I-16)** — no balance, no show eligibility; payment-reliability reputation flags repeats. ([`03`](./03-trust-verification.md) §2.2/§2.4, T5) | KYB *depth at launch* is an open lever (**OQ-3**) — lighter launch KYB raises this risk. |
| **R-F3** | **Off-platform circumvention** — parties meet here, transact off-platform to dodge the take rate (also strips escrow protection). The structural marketplace-leakage threat. | High | Med-High | **Protection-as-lock-in**: leaving forfeits I-16/I-17 escrow + dispute recourse; circumvention-pattern detection; **reputation/badges are non-portable**. ([`03`](./03-trust-verification.md) §3.4, T9; economics in [`11`](./11-gtm-liquidity-trust-safety-ops.md)) | Inherent to every high-value marketplace; can't be eliminated, only made economically unattractive. A standing strategic risk. |
| **R-F4** | **Cold-outreach spam** (the `init-jot` worry about artist→booker contact). | Med | Med | **No open inbox** — contact only inside a typed, money-gated, verified-only `BookingRequest`; artist→booker outreach is bounded/rate-limited/typed, never a free DM. ([`03`](./03-trust-verification.md) §3.1, T7; not-a-social-network non-goal in [`01`](./01-vision-strategy.md)) | Rate-limit tuning; report/block as backstop. |
| **R-F5** | **Account farming / bots** evade limits or scrape. | Med | Med | KYC at identity layer (one human → one `User`); new-account throttles + card-testing caps. ([`03`](./03-trust-verification.md) §3.2, T8) | Sophisticated rings; device/risk signals + T&S takedown as backstop. |
| **R-F6** | **Serial false-disputer** games the dispute window repeatedly. | High | Low-Med | Dispute requires evidence; **dispute rate is a tracked reputation signal that tightens their gate**; T&S adjudication. ([`03`](./03-trust-verification.md) §2.4, T6; [`04`](./04-payments-escrow-disputes.md) §6) | Reputation needs volume to be meaningful; early-platform thin-history gap. |

### 3.4 Regulatory & legal risks ⚖️

| ID | Risk | Sev | Like | Named defense (owner) | Residual |
| --- | --- | --- | --- | --- | --- |
| **R-R1** | **Money-transmission / unlicensed-custody exposure** — showman is deemed to "control" funds and needs MTLs/FinCEN registration it doesn't have. **The company-ending regulatory risk.** | Critical | Low-Med | Custody routed entirely through **Stripe under Stripe's licenses** (separate charges/transfers + delayed payouts); showman *orchestrates*, never *custodies*; **hard pre-launch counsel sign-off (M6)** before real money. ⚖️ ([`04`](./04-payments-escrow-disputes.md) §0/§9 / **OQ-4**) | "Control" can be read broadly; design *reduces* but doesn't provably *eliminate* exposure — hence the mandatory legal gate. Funds segregation (**OQ-9**) further strengthens the story. |
| **R-R2** | **Practicing law / contract-enforceability** — generating contracts + adjudicating disputes is mistaken for legal representation/adjudication. | High | Low | **Not a law firm** non-goal: we *generate* contracts and resolve **escrow/fund outcomes under platform policy**, explicitly *not* legal liability; decisions cite policy, not law. ([`01`](./01-vision-strategy.md) §6; [`04`](./04-payments-escrow-disputes.md) §6.1) | Contract-template *source* and enforceability need counsel (**OQ-2 / OQ-13**); the policy-not-law line must hold in dispute UX copy. |
| **R-R3** | **ID-document / biometric handling** (BIPA-style consent, retention, deletion). | High | Low-Med | Offload raw docs to Stripe/Persona; store result + provenance only. ⚖️ ([`03`](./03-trust-verification.md) §1.3, §7) | Exact retention/consent policy still open (**OQ-7**); needs counsel before documentary path scales. |
| **R-R4** | **KYB / beneficial-ownership / sanctions obligations** at the wrong depth. | High | Low-Med | Stripe Connect KYB follows ownership to natural persons; **KYB must clear before money is held/released**; depth is a launch lever reviewed by counsel. ⚖️ ([`03`](./03-trust-verification.md) §2.2 / **OQ-3**) | Too-light a launch KYB raises R-F2 + sanctions exposure; counsel sets the threshold. |
| **R-R5** | **Tax reporting (1099-K / equivalent)** on payouts handled wrongly. | Med | Low | Connect handles 1099-K issuance for connected accounts (Stripe = payer-of-record on the rail); TIN/W-9 collection folded into onboarding; showman's take is separately its own income. ([`04`](./04-payments-escrow-disputes.md) §9) | Connect tax-onboarding must be wired before first payout (a Phase-1 finance task). |
| **R-R6** | **Legal-entity / jurisdiction choice** affects the money-transmission analysis, 1099 mechanics, and contract templates. | High | — | Flagged as a foundational decision feeding R-R1/R-R2/R-R5. (**OQ-13**) | Undecided; gates incorporation + the counsel review's framing. |

### 3.5 Execution & strategy risks (the honest non-technical ones)

| ID | Risk | Sev | Like | Named defense (owner) | Residual |
| --- | --- | --- | --- | --- | --- |
| **R-X1** | **Cold-start failure** — never reach two-sided liquidity. | Critical | Med-High | **Single-player Phase 0** (value before liquidity) + supply-first + **concierge-seeded demand** + narrow beachhead + the public/promo growth loop. ([`11`](./11-gtm-liquidity-trust-safety-ops.md); [`06`](./06-availability-confirmation.md) §4.4) | The classic marketplace risk; phasing is designed around it but doesn't guarantee it. Beachhead choice (**OQ-1**) is decisive. |
| **R-X2** | **Gatekeeper rejection** — agents/managers treat showman as a disintermediation threat and withhold supply. | Critical | Med | **"Aid, not replace"** hard principle: managers/agents are first-class users, their ~10% is preserved and automated, the artist still confirms. ([`01`](./01-vision-strategy.md) §5; [`07`](./07-roster-org-rbac.md)) | A *litmus test* exists for every feature, but adoption is a market fact, not a design guarantee. |
| **R-X3** | **Solo-founder bandwidth** — manual T&S, adjudication, KYB exceptions, and concierge all land on one person at once. | High | Med-High | Manual-is-fine-at-low-volume by design; phased scope keeps Phase 1 narrow; automation deferred to Phase 2 with explicit revisit triggers. ([`04`](./04-payments-escrow-disputes.md) §4; [`11`](./11-gtm-liquidity-trust-safety-ops.md)) | Real constraint; the §2 sequence is built to not pile concurrent ops on the founder, but a liquidity spike could. |
| **R-X4** | **Scope creep into a non-goal** (ticketing, social feed, DSP, agency). | Med | Med | Explicit **permanent non-goals** restated as anti-scope in §1.3; the [`01`](./01-vision-strategy.md) §6 litmus test. | Discipline risk; mitigated by writing the non-goals into the roadmap itself. |
| **R-X5** | **Vendor concentration on Stripe** — Stripe is custody *and* KYC *and* tax *and* potentially e-sign-adjacent; a Stripe policy/outage/account action is existential. | High | Low | Deliberate trade for not being a money transmitter; ledger is *our* source of truth for policy so we're not blind during a Stripe incident; e-sign + ID can be a second vendor (Persona) to avoid total single-vendor lock. ([`04`](./04-payments-escrow-disputes.md) §3; [`03`](./03-trust-verification.md) §2.1 / **OQ-2/OQ-14**) | Concentration is real and accepted; the alternative (self-custody) is worse. Watch Stripe ToS/account-standing as an ops duty. |

---

## 4. Open-questions register (consolidated)

Every "carried to `12`" item from across the doc set, gathered here. Each has an **ID**, an **owner doc** (where it'll actually be decided), a **recommended default** (so an absence of decision doesn't block — the default holds until overturned), and a **decide-by** phase gate. ⚖️ marks items needing counsel.

> **Rule of this register:** an open question is *not* a blocker. Each carries a **recommended default that is in force until explicitly overturned.** This is decision *debt*, tracked and dated — not decision *paralysis*.

### 4.1 The blueprint's five headline open questions

| ID | Question | Owner doc | Recommended default (in force until overturned) | Decide by |
| --- | --- | --- | --- | --- |
| **OQ-1** | **Beachhead** — which scene / genre / city / tier to seed first? | [`11`](./11-gtm-liquidity-trust-safety-ops.md) | **Mid-tier represented artists** in one narrow scene/genre/city ([`01`](./01-vision-strategy.md) §2 names the tier; the *specific* scene is the open part). | **Before Phase 0 (M1)** — it scopes who we onboard. |
| **OQ-2** | **E-sign vendor** — Dropbox Sign vs DocuSign vs build-minimal? | [`05`](./05-negotiation-deal-lifecycle.md) (+ [`04`](./04-payments-escrow-disputes.md)) | **Dropbox Sign** — the blueprint's named default; buy, don't build; revisit only if API/cost/template needs force it. | **Phase 1 (before M8)** — gates `Agreement` execution. |
| **OQ-3** | **KYB depth for venues/festivals at launch** — full beneficial-owner day one vs. staged business-existence check that hardens before first payout? ⚖️ | [`03`](./03-trust-verification.md) | **Staged**: light business-existence to *browse*; **full KYB must clear before money is held/released**. Counsel sets the exact threshold. | **Phase 1 (before M7)**; counsel-reviewed. |
| **OQ-4** | **Escrow for v1** — pure Stripe Connect primitives vs. Trustap-style escrow+dispute service? ⚖️ | [`04`](./04-payments-escrow-disputes.md) | **Pure Stripe Connect primitives** (Option A — decided in [`04`](./04-payments-escrow-disputes.md) §4: it's the moat, protects margin, single reconciliation surface). | **Decided** (default stands); legal sign-off is the live gate (OQ-4 ⇄ M6). |
| **OQ-5-LEGAL** | **Legal entity / jurisdiction + contract-template source.** ⚖️ | this doc (§3 R-R6) → counsel | *Undecided.* Pick the entity/jurisdiction that cleanest-fits the money-transmission analysis; source contract templates from counsel/industry-standard riders, **not** self-drafted. | **Before M6** — it frames the counsel review and incorporation. *(Tracked as OQ-13 below for the template half.)* |

> OQ-4's escrow build-vs-buy is *already decided* in [`04`](./04-payments-escrow-disputes.md) (pure Stripe). It stays in the register because the **revisit trigger** (OQ-6) keeps it live, and because the **counsel sign-off** that makes it safe (M6) is still pending. The *money-transmission legal* half is **OQ-4-LEGAL** ≡ the M6 gate.

### 4.2 Open questions carried from `03` (Trust & Verification)

| ID | Question | Owner doc | Recommended default | Decide by |
| --- | --- | --- | --- | --- |
| **OQ-3** (above) | KYB depth at launch. ⚖️ | [`03`](./03-trust-verification.md) | staged; full KYB before money moves | Phase 1 / M7 |
| **OQ-7** | **ID-document & biometric retention/consent** — retention window, BIPA-style consent, deletion policy, how much stays at the vendor vs. with us. ⚖️ | [`09`](./09-system-architecture.md) + counsel | Store **result + provenance only**, raw docs at Stripe/Persona; minimal retention; explicit consent flow. | Before documentary path **scales** (Phase 1 → 2). |
| **OQ-11** | **DSP API access reality** — which of S4A / Apple / YouTube / Meta expose a usable third-party OAuth/claim API vs. partnership-gated vs. scrape-only. *The §1.1 primary path depends on this.* | [`09`](./09-system-architecture.md) | **Research (2026-06): no public third-party claim API exists.** Spotify for Artists has *no public API* (provider APIs require *direct distribution*); Apple Music for Artists & YouTube OAC are manual / distributor-mediated; Spotify is actively *tightening* developer access (Feb 2026). Realistic paths are **distributor/provider partnership**, **social/domain possession proofs**, and **manual documentary review** — **not** self-serve DSP OAuth. M1 now scopes *which partnership/distributor routes* exist (the OAuth question is answered: it doesn't); attestation + documentary are the baseline fallback. | **M1, before Phase 0 build** — highest-leverage. |
| **OQ-12** | **Vouch-chain depth limit** — can a counter-signed `agent` themselves vouch, or only `owner`s? Bounds the §1.2a trust graph. | [`07`](./07-roster-org-rbac.md) | **Only `owner` mints authority** by default; `agent`-vouching is opt-in and capped (anti-R-V3). | Phase 1 (with the RBAC matrix). |
| **OQ-5** | **Re-verification cadence** — schedule for `verification_source` re-checks + KYC/KYB refresh; friction vs. staleness. | [`11`](./11-gtm-liquidity-trust-safety-ops.md) (ops) | Periodic re-check + **mandatory re-check on any high-value transaction**; tune from data. | Phase 1 ops; tune in Phase 2. |
| **OQ-14** | **Persona vs. Stripe Identity** for the documentary path — single Stripe vendor (tight Connect integration) vs. Persona (richer orchestration, reduces R-X5 concentration). | [`09`](./09-system-architecture.md) | **Stripe Identity** for v1 (one vendor, Connect-native); revisit Persona if orchestration needs or vendor-concentration risk grow. | Phase 1 (before M2 documentary fallback). |

### 4.3 Open questions carried from `04` (Payments, Escrow, Disputes)

| ID | Question | Owner doc | Recommended default | Decide by |
| --- | --- | --- | --- | --- |
| **OQ-4-LEGAL** ⚖️ | **Money-transmission counsel sign-off** — confirm the Connect flow-of-funds, the platform-not-transmitter classification, and the take-rate carve. *The single most important external review item.* | counsel → [`04`](./04-payments-escrow-disputes.md) | *Must be obtained.* Default = **do not flow real money until cleared.** | **HARD GATE at M6**, before M9. |
| **OQ-8** | **Settlement-window length** — 72h default; final value, and whether it varies by deal size / risk tier. | [`11`](./11-gtm-liquidity-trust-safety-ops.md) (ops) | **72h**, flat for v1; make it per-`Listing`/risk-tier tunable later. | Phase 1 default; tune in Phase 2. |
| **OQ-9** | **Connect funds segregation** — adopt the ring-fenced-holding-account feature as a hardening upgrade? | [`04`](./04-payments-escrow-disputes.md) | **Design the ledger so segregation is a config swap, not a rewrite**; don't block v1 on it; adopt once volume justifies the lawyer time. | Phase 2 hardening (M17). |
| **OQ-6** | **Trustap (or similar) for *adjudication only*** — re-open if manual dispute volume outpaces solo ops before we can staff it (Stripe stays custodian). | [`04`](./04-payments-escrow-disputes.md) §4 | **Don't** — pure Stripe + manual adjudication; **revisit only on the volume trigger** (R-E7). | Phase 2, trigger-gated (M18). |
| **OQ-10** | **Cross-border / FX** — Connect cross-border payouts + FX. | [`04`](./04-payments-escrow-disputes.md) | **Out of scope for the beachhead** (one scene/city); don't bake single-currency assumptions into the ledger. | Phase 2 (M19), when a beachhead crosses a border. |
| **OQ-15** | **Take-rate split & whether it's surfaced to the booker** — policy is ~8–12% all-in ([`01`](./01-vision-strategy.md)); the side-split is a GTM lever. | [`11`](./11-gtm-liquidity-trust-safety-ops.md) | Split across both sides; **deduct at release** ([`04`](./04-payments-escrow-disputes.md) §5 fixes the *when/how*); final split set in GTM. | Phase 1 (before M9 pricing goes live). |

### 4.4 Open questions carried from `06` (Availability & Confirmation)

| ID | Question | Owner doc | Recommended default | Decide by |
| --- | --- | --- | --- | --- |
| **OQ-16** | **Inbound-sync vs. live-hold conflict** — external `calendar_sync` block lands on a date that already has a showman `Hold`; who wins? | [`07`](./07-roster-org-rbac.md) + [`10`](./10-design-direction-ux.md) | **showman holds are not auto-overridden**; conflict raises a **team alert** (releasing a deposit-backed hold has money consequences); human resolves. | Phase 1 (calendar) / Phase 2 (sync maturity). |
| **OQ-17** | **Cross-city geo/travel conflict detection** — beyond v1's exact-span guarantee. | [`06`](./06-availability-confirmation.md) | **Exact-span only for v1**; travel-time-aware soft warnings are **Phase 2**. | Phase 2 (M16). |
| **OQ-18** | **Hold expiry defaults & challenge windows** — 72h soft / 14d deposit-backed / 48h challenge are starting values. | [`11`](./11-gtm-liquidity-trust-safety-ops.md) | Use the §2.4 defaults; **tune against real funnel data**. | Phase 1 defaults; tune Phase 2. |
| **OQ-19** | **Public-card consent model** — both sides opt-in vs. headline-party-must-not-object, against festival lineup-embargo conventions. | [`08`](./08-profiles-pitches-discovery.md) + [`11`](./11-gtm-liquidity-trust-safety-ops.md) | **Mutual consent to publish** by default (safest against embargoes); refine as a product call. | When the promo card ships (Phase 1-late / Phase 2). |
| **OQ-20** | **Group / multi-artist (bundled) holds & confirmation** — independent vs. all-or-nothing for several artists from one `Org`. | [`07`](./07-roster-org-rbac.md) | **Independent holds, co-routed via I-12** for v1; bundled all-or-nothing is a **Phase-2 candidate**. | Phase 2 (M15). |
| **OQ-21** | **Reschedule semantics** — atomic swap of old/new windows; effect on a competing hold on the new date. | [`05`](./05-negotiation-deal-lifecycle.md) + [`04`](./04-payments-escrow-disputes.md) | Specify alongside the cancellation/reschedule policy; default to an **atomic swap** that re-runs the no-double-booking check on the new window. | Phase 2 (with cancellation policy depth). |

### 4.5 Open questions raised here in `12`

| ID | Question | Owner doc | Recommended default | Decide by |
| --- | --- | --- | --- | --- |
| **OQ-13** ⚖️ | **Contract-template source** — counsel-drafted vs. industry-standard riders vs. (rejected) self-drafted. Pairs with OQ-5-LEGAL (entity/jurisdiction). | counsel → [`05`](./05-negotiation-deal-lifecycle.md) | **Source from counsel / industry-standard riders, never self-drafted** (the not-a-law-firm non-goal, [`01`](./01-vision-strategy.md) §6). | Before M8 (e-sign integrates the templates). |
| **OQ-22** | **Chargeback reserve / underwriting posture** — how to reserve against post-release chargebacks (R-E3), the one risk that loses real money. | [`04`](./04-payments-escrow-disputes.md) §8b + finance | **Decided posture (§8b):** release-with-reserve (connected-account reserve on every `Payout`, not full release); enable Stripe Chargeback Protection and price the 0.4% into the take rate; delay release / require stronger funding for first-time or high-risk bookers; keep in-platform `Dispute`s strictly about escrowed funds + platform policy. Layered defense in order: artist-first debit → reserve → transfer reversal → Chargeback Protection → representment win → take-rate float reserve. Company capital is the last-resort backstop, never the first payer. Failure mode to avoid: releasing with no reserve and no Protection. ⚖️ Precise liability structure is the M6/OQ-4-LEGAL counsel gate — bring §8b to that review. | Before M9 (escrow live). |
| **OQ-23** | **Stripe vendor-concentration mitigation** (R-X5) — how much second-vendor diversification (e.g., Persona for ID) is worth the integration cost. | [`09`](./09-system-architecture.md) | Accept concentration for custody (the deliberate trade); diversify **only** ID/e-sign where cheap; keep *our* ledger authoritative so a Stripe incident isn't blinding. | Phase 2. |
| **OQ-24** | **Consistency-review cadence** — how often the doc set is re-checked for ubiquitous-language drift / state-machine reconciliation as it evolves. | this doc / [`00`](./00-README.md) | Re-run the M0 consistency pass at each phase boundary (Phase 0→1, 1→2) and on any change to `02`/`04`/`05`/`06`. | Each phase gate. |

### 4.6 Open-questions priority summary (what to actually decide first)

The register is long; here is the strict "decide-before-you-build" subset, in order:

1. **OQ-1 Beachhead** — scopes everything in Phase 0. (Before M1.)
2. **OQ-11 DSP-API reality** — spike it first; it reshapes the supply gate. (M1.)
3. **OQ-4-LEGAL / OQ-5-LEGAL / OQ-13 (money-transmission, entity/jurisdiction, contract templates)** ⚖️ — the legal cluster that gates real money. (Before M6/M9.)
4. **OQ-3 KYB depth** ⚖️ — gates the booker-side wall. (Before M7.)
5. **OQ-2 E-sign vendor** — gates `Agreement` execution. (Before M8.)
6. **OQ-15 take-rate split** + **OQ-8 window length** — gate the money UX going live. (Before M9.)

Everything else is Phase-2-tunable and runs on its recommended default until then.

---

## 5. The one-page closeout

- **Phasing is a liquidity strategy as an engineering plan:** **Phase 0** ships *single-player* verified EPK + calendar + roster (seed supply, no money) → **Phase 1** turns on the *whole transaction* (verified booking, holds, escrow, dispute, the `Confirmed` artifact) in *one narrow beachhead* with concierge-seeded demand and manual ops → **Phase 2** scales to orgs/festivals/integrations and hardens compliance.
- **Three ordering constraints are non-negotiable:** DSP-API spike (M1) before Phase-0 verification; **money-transmission counsel sign-off (M6) before the escrow rail goes live (M9)**; supply verification (M2) before the booker side (M7).
- **The risk register confirms the moat already carries its own defenses:** impersonation → identity≠authority + payout-to-principal; the two canonical money failures → balance-before-show (I-16) + auto-release-unless-disputed (I-17); spam → money-as-the-filter; circumvention → protection-as-lock-in. The honest residuals are the **post-release chargeback** (R-E3, the one that loses real money), **DSP-API uncertainty** (R-V2, the biggest unknown), **money-transmission "control"** (R-R1, the company-ender, gated by M6), and **cold-start/gatekeeper** adoption (R-X1/R-X2, market facts no design guarantees).
- **The open-questions register is decision *debt*, not paralysis:** every item carries a recommended default in force until overturned. Decide the §4.6 cluster before building; everything else runs on its default and tunes in Phase 2.
- **The permanent non-goals are written into the roadmap so they're never relitigated under scale pressure:** not ticketing, not a DSP, not a social feed, not the legal authority, not a money transmitter, not an agency.

---

### Cross-references

- Strategy, tiers, the wedge, non-goals, take-rate policy, "aid not replace" → [`01-vision-strategy.md`](./01-vision-strategy.md)
- Entities, ubiquitous language, invariants (I-4…I-21) — the spine every term here obeys → [`02-domain-model.md`](./02-domain-model.md)
- Verification model, badge decay, threat scenarios (T1–T12), KYB-depth & DSP-API & retention open questions → [`03-trust-verification.md`](./03-trust-verification.md)
- Escrow-without-a-license, the two canonical failures, dispute model, money-transmission & chargeback & funds-segregation flags, the Stripe-vs-Trustap decision → [`04-payments-escrow-disputes.md`](./04-payments-escrow-disputes.md)
- The authoritative deal state machine; cancellation/reschedule path; e-sign gating → [`05-negotiation-deal-lifecycle.md`](./05-negotiation-deal-lifecycle.md)
- Calendar substrate, `Hold` soft-lock, the `Confirmed` artifact, geo/sync/bundled-hold open questions → [`06-availability-confirmation.md`](./06-availability-confirmation.md)
- Org RBAC, on-behalf-of, vouch-depth & group-booking open questions → [`07-roster-org-rbac.md`](./07-roster-org-rbac.md)
- Profiles, pitches, discovery, public-card consent → [`08-profiles-pitches-discovery.md`](./08-profiles-pitches-discovery.md)
- Bounded contexts, idempotent webhooks, background jobs, PII handling, DSP-API integration, Persona-vs-Stripe → [`09-system-architecture.md`](./09-system-architecture.md)
- Design language & the confirmation moment; conflict-alert UX → [`10-design-direction-ux.md`](./10-design-direction-ux.md)
- Cold-start, beachhead choice, concierge seeding, T&S ops/SLAs/appeals, window & expiry & take-split tuning → [`11-gtm-liquidity-trust-safety-ops.md`](./11-gtm-liquidity-trust-safety-ops.md)

---

*End of 12-roadmap-risks-open-questions.md — the closing map. Phase 0 seeds supply with single-player tools; Phase 1 turns on the transaction in one beachhead behind the money-transmission legal gate; Phase 2 scales to orgs/festivals/integrations. Every serious risk already has a named defense; the honest residuals are the post-release chargeback, the DSP-API unknown, the money-transmission "control" question, and cold-start adoption. Every open question carries a default in force until overturned — decision debt, tracked and dated, never a blocker.*
