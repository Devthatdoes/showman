# 00 — README (the index for `docs/foundation/`)

> The map of the **showman** foundation doc set. Start here, then read in the recommended order below. This is a **FOUNDATION / PLANNING** doc set — prose, diagrams, state machines, and pseudo-code only; no application code ships from here (that begins Phase 1, see [`12-roadmap-risks-open-questions.md`](./12-roadmap-risks-open-questions.md)).

---

## What showman is

**showman** is a verified, direct, transactional booking marketplace for the **represented-artist tier** — the touring acts, festival names, and managed artists whose deals run five-to-seven figures and today happen entirely over email, phone, and PDFs. The represented tier already transacts in a fixed shape (~50% deposit secures the date → balance before the show → settlement after; the agent takes ~10%; contracts plus technical and hospitality riders are standard), but that workflow leaks at exactly the points software is good at: trust is re-established out-of-band every time, the deposit/balance rhythm is enforced by goodwill instead of infrastructure, negotiation lives in unstructured email threads, roster coordination is manual, and the "confirmed" moment is a Gmail reply. showman puts that existing rhythm onto rails — provenance-based identity *and* authority verification, escrowed milestone payments on the industry rhythm, a structured offer/counter-offer state machine, and a first-class shareable confirmation artifact — while **aiding agents and managers, not replacing them** (their ~10% is preserved and automated; the artist still explicitly confirms). The build-vs-buy stance is hybrid: **buy the regulated/commodity rails** (Stripe Connect for custody via delayed payouts, Stripe Identity/Persona for KYC+ID, a vendor e-sign for contracts) and **build the trust logic** (the deal state machine, the escrow-release policy, the artist authority/verification model, and the dispute flow). Stripe absorbs the regulated "dirty work"; showman owns the orchestration and trust logic — which is where the durable value lives. The positioning wedge is the empty quadrant between back-office CRMs (Gigwell, Prism.fm — digitize an agency, no open market) and low-end gig marketplaces (GigSalad, The Bash, Sonicbids — weddings/corporate/cover acts, no authority verification): **verified + direct + transactional for the represented tier.**

---

## The 12 documents

| # | Title | Summary | Link |
| --- | --- | --- | --- |
| 01 | Vision & Strategy | The "why" and "for whom": the problem, the target tiers (beachhead = mid-tier represented artists), the verified-direct-transactional wedge, the "aid, not replace" principle, non-goals, and the take-rate business model. | [`01-vision-strategy.md`](./01-vision-strategy.md) |
| 02 | Domain Model & Glossary (the spine) | **The spine.** The actor-vs-principal keystone, the full entity catalog (bounded contexts), the ER diagram, the canonical glossary (ubiquitous language), and the core invariants (I-1…I-21) every other doc must honor. | [`02-domain-model.md`](./02-domain-model.md) |
| 03 | Trust & Verification ⭐ | The priority deep-dive: trust as three problems (artist authenticity/authority, booker legitimacy/anti-spam, platform integrity); identity ≠ authority; provenance badges; verification state machines; money-as-the-spam-filter; the abuse/threat catalog. | [`03-trust-verification.md`](./03-trust-verification.md) |
| 04 | Payments, Escrow & Disputes | Escrow without an escrow license (Stripe custody, showman owns release policy); the deposit→balance→settlement flow; how the two canonical failures are defeated; the tightened-Airbnb dispute model; webhooks, idempotency, reconciliation; regulatory flags. | [`04-payments-escrow-disputes.md`](./04-payments-escrow-disputes.md) |
| 05 | Negotiation & Deal Lifecycle (the state machine) | The product backbone: the explicit deal state machine every `BookingRequest` travels (Draft → … → Confirmed → Performed → Settled → Reviewed, with branches); the formal transition table; set-price/private-floor negotiation logic; the protected confirmation transition. | [`05-negotiation-deal-lifecycle.md`](./05-negotiation-deal-lifecycle.md) |
| 06 | Availability & Confirmation | The calendar substrate (`AvailabilityWindow`), the `Hold` soft-lock that makes the booking race safe, no-auto-accept and no-double-booking enforcement, and the first-class `Confirmed` artifact ("Prince is confirmed for [event]") across four surfaces. | [`06-availability-confirmation.md`](./06-availability-confirmation.md) |
| 07 | Roster, Org & RBAC (the authority layer) | The authority layer: `Org` as team principal, the `Membership` on-behalf-of grant, the four-role permission matrix, the single `authorize()` rule, ownership transfers, team addressing/dedup, and resolution of the spine's open authority questions. | [`07-roster-org-rbac.md`](./07-roster-org-rbac.md) |
| 08 | Profiles, Pitches & Discovery | The read/presentation surface: the verified EPK (`ArtistProfile`), the booker dossier (`BookerProfile`), the structured `Pitch`, and discovery/search/ranking — all governed by the vouched-for-vs-self-asserted two-zone rule and the never-leak-the-floor constraint. | [`08-profiles-pitches-discovery.md`](./08-profiles-pitches-discovery.md) |
| 09 | System Architecture | The runtime shape: a modular monolith (Next.js + TypeScript + Postgres) of nine bounded contexts with extract-ready seams; the `Event`/audit log; webhook ingestion; background jobs; and the end-to-end security posture that makes the spine's invariants physically enforceable. | [`09-system-architecture.md`](./09-system-architecture.md) |
| 10 | Design Direction & UX | The design-language brief and wireframes for the high-stakes flows — discovery, EPK, dossier, request+pitch, the negotiation thread, escrow status, and the confirmation moment — under two principles: trust you can see, calm under high stakes. | [`10-design-direction-ux.md`](./10-design-direction-ux.md) |
| 11 | Go-to-Market, Liquidity & Trust & Safety Ops | The launch motion: the cold-start problem, single-player-before-multiplayer, the narrow beachhead and selection criteria, concierge seeding, verification as the quality gate, liquidity metrics, take-rate finalization, and trust & safety ops (queues, SLAs, appeals). | [`11-gtm-liquidity-trust-safety-ops.md`](./11-gtm-liquidity-trust-safety-ops.md) |
| 12 | Roadmap, Risks & Open Questions | The closing map: the three-phase plan (Phase 0 single-player → Phase 1 booking+escrow in one beachhead → Phase 2 orgs/festivals/scale), the milestone sequence and de-risking spikes, the risk register, and the consolidated open-questions register. | [`12-roadmap-risks-open-questions.md`](./12-roadmap-risks-open-questions.md) |

---

## Recommended reading order

Read the **spine first**, then the deep-dives, then the cross-cutting and forward-looking docs.

1. **Spine (read these two first, in order):**
   - [`01-vision-strategy.md`](./01-vision-strategy.md) — the strategic frame: what we're building, for whom, and why it's defensible.
   - [`02-domain-model.md`](./02-domain-model.md) — **the single source of truth** for entities, the ubiquitous language, and the invariants. Everything else references it. Internalize the **actor-vs-principal** keystone before reading on.

2. **The core subsystem deep-dives (03–08):** each owns the *behavior* of entities the spine defines.
   - [`03-trust-verification.md`](./03-trust-verification.md) ⭐ (the priority deep-dive — identity ≠ authority, provenance, anti-spam)
   - [`04-payments-escrow-disputes.md`](./04-payments-escrow-disputes.md) (money: escrow, release policy, disputes)
   - [`05-negotiation-deal-lifecycle.md`](./05-negotiation-deal-lifecycle.md) (the deal state machine — the product backbone)
   - [`06-availability-confirmation.md`](./06-availability-confirmation.md) (calendar, holds, the confirmation artifact)
   - [`07-roster-org-rbac.md`](./07-roster-org-rbac.md) (orgs, roster, the authority/permission model)
   - [`08-profiles-pitches-discovery.md`](./08-profiles-pitches-discovery.md) (profiles, pitches, discovery/ranking)

3. **Cross-cutting and forward-looking (09–12):**
   - [`09-system-architecture.md`](./09-system-architecture.md) (where it all runs; security posture)
   - [`10-design-direction-ux.md`](./10-design-direction-ux.md) (design language; renders the siblings' decisions)
   - [`11-gtm-liquidity-trust-safety-ops.md`](./11-gtm-liquidity-trust-safety-ops.md) (launch motion, liquidity, T&S ops)
   - [`12-roadmap-risks-open-questions.md`](./12-roadmap-risks-open-questions.md) (phasing, risk register, open-questions register — read last; it consolidates what the others deferred)

---

## Glossary & ubiquitous language

The canonical glossary and entity definitions — the **ubiquitous language** that every doc (and eventually all code) must use verbatim, with no synonyms and no drift — live in **[`02-domain-model.md`](./02-domain-model.md)** (see its [Glossary](./02-domain-model.md#3-glossary), the [entity catalog](./02-domain-model.md#1-entity-catalog-ubiquitous-language), and the [core invariants](./02-domain-model.md#4-core-invariants)). The spine carries a hard **consistency obligation**: if any doc needs a new entity, term, or relationship, it must amend `02-domain-model.md` first, then reference it — never define a competing term locally. When in doubt about what a term means, `02` wins.

---

*Index for the showman foundation doc set. Spine first (01 → 02), then the deep-dives (03–08), then the cross-cutting and roadmap docs (09–12). Ubiquitous language is owned by [`02-domain-model.md`](./02-domain-model.md) — amend it first, then reference.*
