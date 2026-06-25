# 01 — Vision & Strategy

> Part of the **showman** foundation doc set (`docs/foundation/`). This is the "why" and "for whom."
> The "what" (entities, terms) lives in [`02-domain-model.md`](./02-domain-model.md); every other doc references that ubiquitous language. This doc deliberately does **not** re-derive the trust model ([`03-trust-verification.md`](./03-trust-verification.md)), the money flow ([`04-payments-escrow-disputes.md`](./04-payments-escrow-disputes.md)), or the deal state machine ([`05-negotiation-deal-lifecycle.md`](./05-negotiation-deal-lifecycle.md)) — it sets the strategic frame they implement.

---

## 1. The problem

Booking a represented artist — a touring act, a festival-tier name, the kind of artist who has a manager and an agent and a fee that runs five to seven figures — is still run on **email, phone calls, PDFs, and personal relationships**. The mechanics are well understood inside the industry and have barely changed:

- A booker (promoter, venue talent buyer, festival programmer, brand) wants an artist for a date.
- They reach the artist's **agent** (or manager), who quotes a **booking fee**.
- They haggle. A **deal memo** gets drafted.
- A **contract** plus a **technical rider** and **hospitality rider** are exchanged and signed.
- Money moves on the industry-standard rhythm: roughly **~50% deposit to secure the date**, the **balance before or at the show**, **settlement after**. The agent takes **~10%**.

This works, but it leaks at exactly the points where software is good and humans are bad:

1. **Trust is established out-of-band, every single time.** Is this really the artist's team? Is this booker solvent and serious, or a tire-kicker / fraud / someone who will pay the deposit and ghost on the balance? Today the answer comes from "I know a guy," reputation-by-rumor, and the agent's rolodex. There is no portable, verifiable trust layer.
2. **The deposit/balance/settlement rhythm is enforced by goodwill and lawyers, not by infrastructure.** The two canonical failures — *booker pays the deposit, then never pays the balance after the artist performs*, and *booker falsely disputes the show to claw money back and screws the artist* — are structural, and both are solvable with escrow + a defined release policy.
3. **Negotiation is unstructured.** Offer/counter-offer lives in email threads with no shared state, no audit trail, no floor logic, no expiry.
4. **Coordination across a roster is manual.** A manager with multiple artists, or a festival booking ten acts off the same agency, juggles parallel email threads with no shared workspace and constant risk of duplicate or crossed requests to the same team.
5. **The "confirmed" moment — the most valuable, most promotable instant in the whole flow — is a Gmail reply that says "confirmed."** There is no canonical artifact that says *"Prince is confirmed for [event]"* that both sides, and the public, can trust.

**showman** attacks the leaks, not the relationships. It is a **verified, direct, transactional marketplace** that puts the existing industry rhythm — deposit, balance, settlement, ~10% representation, riders, contracts — onto rails: identity + authority verification, escrowed milestone payments, a structured offer/counter-offer state machine, and a first-class confirmation artifact.

The thesis in one line:

> **The represented-artist tier already transacts in this exact shape — over email. We're not inventing the workflow; we're giving it infrastructure, trust, and an escrow rail.**

---

## 2. Target tiers

The market is not one audience. We segment artists by representation and deal size, because that determines who the real user is, how trust gets established, and whether we can charge a meaningful take rate.

| Tier | Who | Deal size (typical) | Who actually transacts | Trust mechanism | Our priority |
| --- | --- | --- | --- | --- | --- |
| **Emerging** | Unrepresented / self-managed; local + small touring | $200 – $2,500 | The artist directly | Light — DSP claim, social proof | **Later.** Onboarding fuel + single-player tools; not the wedge. |
| **Mid** | Has a manager and/or a booking agent; regional/national touring; club + small-theater + mid-festival slots | $2,500 – $50,000 | **Manager or agent on the artist's behalf** | DSP/channel claim + verified-team attestation; KYB on the booker | **The beachhead.** Big enough deals to justify escrow + take rate; underserved by both incumbent camps. |
| **Represented / Festival** | Agency-represented headliners; festival programming; brand activations | $50,000 – $1,000,000+ | **Agency / festival programming team**, multi-party | Strong KYB, attestation chains, possibly concierge-assisted | **The aspiration + credibility halo.** Lands later; proves the ceiling; drives the brand. Heavy white-glove. |

**Strategic read of the tiers:**

- **The wedge is "mid."** Emerging artists don't have enough deal value to support escrow + take rate economics and are over-served by low-end marketplaces. Festival-tier deals are real but rare, slow, multi-party, and relationship-locked — a bad cold-start target. **Mid-tier represented artists are the sweet spot**: deals large enough that trust and escrow genuinely matter, fragmented enough that no incumbent owns them, and run by managers/agents who feel the email-thread pain acutely.
- **We grow up the tier ladder, not down.** Start mid, earn the represented/festival tier with proof and concierge, and let emerging artists in as a top-of-funnel + single-player product (see [`11-gtm-liquidity-trust-safety-ops.md`](./11-gtm-liquidity-trust-safety-ops.md)). Going the other direction — starting cheap and trying to move *up* into represented deals — is the trap GigSalad/The Bash are stuck in; the brand never escapes "cover bands and weddings."
- **The "who actually transacts" column is the most important one in this table.** Above the emerging tier, **the person clicking the button is almost never the artist.** It is a manager or agent acting *on behalf of* the artist. The entire domain model is built around that actor-vs-principal distinction (see [`02-domain-model.md`](./02-domain-model.md) and [`07-roster-org-rbac.md`](./07-roster-org-rbac.md)), and the whole strategy below depends on respecting it.

---

## 3. Value proposition, per side

This is a multi-sided market with **three** distinct constituencies, not two. Modeling managers/labels as a first-class side — not a feature bolted onto "artist" — is a core strategic bet.

### 3.1 Artists

- **A direct, verified channel to real bookings** without surrendering the work to a black-box agency relationship — and without the noise of low-end gig marketplaces.
- **Get paid, reliably.** Escrowed deposit secures the date; the **balance is escrowed *before* the performance**, so the "paid deposit then ghosted" failure is structurally impossible.
- **Protection from bad-faith disputes.** Funds **auto-release** after a short post-show settlement window unless an evidence-backed dispute is filed in-window — the artist isn't held hostage by a frivolous claim (mechanics in [`04-payments-escrow-disputes.md`](./04-payments-escrow-disputes.md)).
- **A verified identity that is portable and provenance-based** — "Verified via Spotify for Artists," not an opaque blue tick (see [`03-trust-verification.md`](./03-trust-verification.md)).
- **A polished, shareable "confirmed" artifact** — promotional gold, and a viral loop (see [`06-availability-confirmation.md`](./06-availability-confirmation.md)).
- **Single-player value before the marketplace is liquid:** a verified EPK + availability calendar that's useful on day one even if no booking ever comes through it.

### 3.2 Bookers / curators / festivals

- **A verified, searchable catalog of bookable artists with real fee signals** — fee range, availability, prior shows, verification provenance — instead of cold-emailing agencies and waiting.
- **Confidence the team is real.** They are transacting with a verified artist/authorized team, not an impersonator — which is exactly the fraud the represented tier fears most.
- **Structured negotiation with a clear audit trail** — offer/counter-offer with state, expiry, and a generated contract + riders, instead of a 40-message email chain.
- **Escrow protects them too.** Their deposit is held, not handed over; a no-show or non-performance has a defined resolution path rather than a lawsuit.
- **A coordination workspace for multi-artist programming** (festivals): book several acts, track every deal's state in one place, avoid duplicate requests to the same team.

### 3.3 Managers / labels / agencies

This side is the one incumbents in our category treat as an afterthought, and it's where we win.

- **A roster workspace.** Manage many artists, act on each one's behalf, and see every live deal across the roster in one view (see [`07-roster-org-rbac.md`](./07-roster-org-rbac.md)).
- **The on-behalf-of model is native, not a hack.** Every action is attributed to an **actor** (the human clicking) operating for a **principal** (the artist) — so authority is explicit, auditable, and role-scoped (owner / agent / finance / viewer).
- **Their ~10% is preserved and made effortless.** showman **aids** the agent/manager; it doesn't disintermediate them — the representation cut is a first-class, automatable part of the money flow, not something we route around (see [§5](#5-the-aid-not-replace-principle) and [`04-payments-escrow-disputes.md`](./04-payments-escrow-disputes.md)).
- **Dedup and group bookings fall out for free.** "Same booker wants three of my artists" and "don't send the same team five separate threads" are handled by the org + on-behalf-of model, not special-cased.

---

## 4. Positioning: the verified-direct-transactional wedge

The market splits cleanly into two camps, and **the entire gap between them is ours.**

### 4.1 The two incumbent camps

**Camp A — Back-office CRMs for the existing agent workflow (Gigwell, Prism.fm).**
These **digitize the agency**, not the market. They are internal tools for an agency to run its own deals, calendars, contracts, and settlements. They are *not* open, two-sided, transactional marketplaces — there is no verified discovery layer, no escrow between strangers, no neutral trust authority. They make an *existing* relationship more efficient; they do nothing for the *establishment* of a new, trusted relationship between parties who don't already know each other.

**Camp B — Low-end event-gig marketplaces (GigSalad, The Bash, Sonicbids).**
These are open marketplaces, but for the **weddings / corporate / cover-act** tier — the bottom of the market.
- **GigSalad** — ~**2.5–5%** talent-side fee; broad event-services marketplace (DJs, party bands, magicians).
- **The Bash** — client pays **~12–17%** + a vendor membership (~**$800/yr**); wedding/party booking site.
- **Sonicbids** — **pay-to-pitch** (artists pay to apply to gigs/festivals), widely and poorly regarded; misaligned incentives.

None of these serve the **represented/touring/festival tier**, none verify *authority* (that this team really represents this artist), and several have incentives pointed the wrong way (pay-to-pitch).

### 4.2 The gap and the wedge

```
                         VERIFIED + DIRECT + TRANSACTIONAL
                                  (the represented tier)
                                          ▲
                                          │            ●  showman
                                          │              (verified discovery +
   open / two-sided  ◄──────────┐         │               escrow + structured deal
                                 │         │               + on-behalf-of orgs)
   GigSalad ● The Bash ●         │         │
   Sonicbids ●                   │         │
   (low-end: weddings,           │         │
    corporate, cover acts)       │         │
                                 │         │
   ──────────────────────────────┼─────────┼──────────────────────►
   closed / single-org           │         │     high-trust, high-value deals
                                 │         │
                       Gigwell ● │         │
                       Prism.fm ●│         │
                       (CRMs: digitize the │
                        existing agency)   │
```

**showman's wedge = the only quadrant that is simultaneously:**

1. **Verified** — identity *and* authority, provenance-based, separating "this human is who they claim" from "this human is allowed to act for this artist." (Detailed in [`03-trust-verification.md`](./03-trust-verification.md).)
2. **Direct** — bookers and authorized artist teams transact with each other, in the open, not through a closed agency CRM.
3. **Transactional** — real money moves through escrow on the industry rhythm, with a structured deal state machine and a defined dispute path — not just lead-gen, not just pitching.

…aimed at the **represented tier** that both incumbent camps leave behind.

**Why this is defensible (the moat):** the commodity rails are bought — Stripe Connect for custody, Stripe Identity/Persona for KYC, a vendor e-sign for contracts (see the build-vs-buy decision, carried from the blueprint and detailed in [`09-system-architecture.md`](./09-system-architecture.md)). What we **build** is the hard, sticky part: the **deal state machine**, the **escrow-release policy**, the **artist authority/verification model**, and the **dispute flow**. Net effect: **Stripe absorbs the regulated "dirty work"; showman owns orchestration and trust logic** — which is exactly where the durable value is.

---

## 5. The "aid, not replace" principle

This is a **hard product principle**, not a marketing line, and it shapes the data model.

The represented tier runs on agents and managers. Their relationships, judgment, and ~10% are real value, and they are also the **gatekeepers** to the supply we need. A platform that tries to **disintermediate** them — "cut out the middleman, book artists directly!" — will be (correctly) treated as a threat by exactly the people who control onboarding, and it will fail.

So showman is built for agents and managers to **operate inside it on behalf of their artists**:

- **They are first-class users**, with their own org, roster, roles, and workspace ([`07-roster-org-rbac.md`](./07-roster-org-rbac.md)).
- **Their cut is preserved and automated.** The representation fee is modeled in the money flow, not engineered around ([`04-payments-escrow-disputes.md`](./04-payments-escrow-disputes.md)).
- **They get leverage, not unemployment:** verified discovery brings them inbound, the deal state machine kills email overhead, escrow removes their collections risk, and the roster view replaces a spreadsheet.
- **The artist still confirms.** Authority is explicit and auditable; the artist (or the specifically authorized team member) confirms or denies each booking — no silent auto-accept (see [`06-availability-confirmation.md`](./06-availability-confirmation.md)).

> **Litmus test for any future feature:** does it make the agent/manager *more* powerful inside the platform, or does it try to route around them? If the latter, it's off-strategy.

This principle is *also* our cold-start answer: win the managers and agents, and they bring their rosters with them (see [`11-gtm-liquidity-trust-safety-ops.md`](./11-gtm-liquidity-trust-safety-ops.md)).

---

## 6. Non-goals (scope guardrails)

What we are deliberately **not** building. These exist to prevent scope creep and to keep the trust/transaction core sharp. Each maps to an adjacent product we explicitly **integrate with or hand off to** rather than become.

| Non-goal | What we are NOT | Why it's out | What we *do* instead |
| --- | --- | --- | --- |
| **Not ticketing** | We don't sell tickets to the show or manage the box office. | Different regulatory surface, different buyer (fans), different unit economics. Owning it would dilute the trust/transaction core. | Stop at the **artist↔booker** booking. The booker handles ticketing on their own stack. Possible future *integration*, never our P&L center. |
| **Not a DSP / streaming service** | We don't host, stream, or distribute music. | Spotify/Apple/etc. already exist and are *authoritative sources we verify against*, not competitors. | Use DSPs (Spotify for Artists, Apple Music for Artists) as **identity/authority sources** (see [`03-trust-verification.md`](./03-trust-verification.md)). Profiles are EPK-style, not players. |
| **Not a social network** | No feed, no follows, no likes, no DMs-as-product, no engagement loop. | Engagement-maximizing mechanics invite spam and cold outreach — the exact risk flagged at the start. Our outreach is **money-gated and verified-only**, not social. | Profiles are **decision aids** (who's asking, who's bookable), not social graphs. Outreach is bounded by deposit-backed requests and verified-only artist→booker contact (see [`08-profiles-pitches-discovery.md`](./08-profiles-pitches-discovery.md)). |
| **Not a law firm / not the legal authority** | **We generate contracts; we are not the legal authority on them.** No legal advice, no representation, no adjudication of legal merits. | Practicing law is regulated and a liability sink. Our dispute flow resolves **platform/escrow outcomes**, not legal liability. | **Generate** contracts + riders via templates and a vendor e-sign; **escrow** disputes resolve fund release under platform policy. Items needing real counsel (money transmission, enforceability, PII/ID handling) are flagged as **legal flags, not legal advice** in [`04`](./04-payments-escrow-disputes.md) / [`12-roadmap-risks-open-questions.md`](./12-roadmap-risks-open-questions.md). |
| **Not a money transmitter / escrow agent** | We don't take custody of funds on our own license. | Money-transmission licensing is a multi-state, multi-year regulatory burden. | **Stripe Connect** is the regulated money-transmitter; we orchestrate via separate charges/transfers + delayed payouts. The escrow-release *policy* is ours; the *custody* is Stripe's (see [`04`](./04-payments-escrow-disputes.md)). |
| **Not artist management / not an agency** | We don't represent artists or take a representation cut. | That would violate "aid, not replace" and put us in conflict with our own supply-side gatekeepers. | We are **neutral infrastructure**. Managers/agents keep their ~10%; we charge a **marketplace take rate** ([§7](#7-business-model)). |

---

## 7. Business model

### 7.1 The benchmark

Research anchors the take-rate range we're competing against:

| Platform | Model | Effective take |
| --- | --- | --- |
| GigSalad | Talent-side fee | **~2.5–5%** |
| The Bash | Client-side fee + membership | **~12–17%** + ~$800/yr |
| Sonicbids | Pay-to-pitch | (misaligned; artists pay to apply) |
| Industry agent | Representation commission | **~10%** (out of band; **not** our line item) |

That's a **~2.5–17%** band. Note the agent's ~10% is a *separate* party's cut that we **preserve**, not a fee we collect — see [§5](#5-the-aid-not-replace-principle).

### 7.2 Our take rate

**Headline: a take rate on confirmed bookings, benchmarked into the middle of the researched band — target ~8–12% all-in, split across the two sides, on the gross booking value of *confirmed* deals.** This is a *strategy-level* target; exact pricing, side-split, and tiering get finalized in GTM ([`11`](./11-gtm-liquidity-trust-safety-ops.md)) and revisited against unit economics in the roadmap ([`12`](./12-roadmap-risks-open-questions.md)).

Design rationale:

- **We earn the higher end of the band, not the GigSalad floor.** We do far more than lead-gen: verified authority, escrowed custody on the industry rhythm, structured negotiation, generated contracts, and a defined dispute path. That justifies pricing *above* the 2.5–5% commodity floor.
- **We stay *below* the all-in cost of the represented-tier status quo.** An agent at ~10% plus the friction, collections risk, and legal overhead of running deals over email is the real alternative. We must be obviously cheaper *in total* than that friction — while leaving the agent's ~10% intact — or the gatekeepers won't move.
- **Charge only on confirmed deals.** No pay-to-pitch (the Sonicbids anti-pattern), no upfront supply-side fees. Revenue is aligned with the moment we actually create value: a **confirmed, escrowed booking**.
- **Split the take across both sides** so neither feels solely taxed; the exact split is a GTM lever, but the principle is shared-value, shared-cost.

### 7.3 How pricing reinforces trust (this is the clever part)

Pricing is not just monetization — it's a **trust and anti-spam mechanism**.

- **Money-gated requests.** Sending a real booking request requires a **charge-capable payment method on file** and an **escrowed deposit hold**. This single mechanism is the most effective spam filter we have: tire-kickers, impersonators, and non-serious bookers won't put real money behind a request. It directly answers the founder's stated fear of "unserious people or spam" and "cold message overload."
- **Escrow *is* the product.** The take rate buys both sides the guarantee that the deposit/balance/settlement rhythm is enforced by infrastructure, not goodwill. That's worth paying for precisely *because* it removes the two canonical failures (ghosted balance / false dispute).
- **Verification gates participation, not just discovery.** Because the supply side is verified and the demand side is money-backed + KYB'd, the marketplace stays *serious* — which is itself the thing the represented tier will pay a premium to be part of.

### 7.4 Secondary / future revenue (explicitly not v1)

Noted only to bound scope — **none of these are the launch model**, and several brush against non-goals:

- Premium org/roster tooling for agencies (SaaS layer on the workspace).
- Featured/verified placement in discovery — **only** if it never degrades into pay-to-pitch.
- Value-add services (insurance, advance/factoring on confirmed deals) via partners — far future, partner-fronted.

The launch business model is one sentence: **a take rate on confirmed, escrowed bookings, with money-gated requests doing double duty as the spam filter.**

---

## 8. Strategy in one page (summary)

- **Problem:** the represented-artist tier transacts in a fixed shape (deposit → balance → settlement, ~10% agent, contracts + riders) entirely over email, with trust established out-of-band every time and the two canonical failures — ghosted balance, false dispute — unsolved.
- **Wedge:** a **verified + direct + transactional** marketplace for the **represented tier** — the empty quadrant between **CRMs** (Gigwell/Prism digitize the agency, no open market) and **low-end marketplaces** (GigSalad/The Bash/Sonicbids serve weddings/cover acts, no authority verification).
- **Beachhead:** **mid-tier represented artists** — deals big enough that escrow + take rate matter, fragmented enough that no incumbent owns them, run by managers/agents who feel the email pain.
- **Core principle:** **aid agents/managers, do not replace them** — they operate *inside* the platform on behalf of artists; their ~10% is preserved; the artist still confirms.
- **Moat:** buy the regulated rails (Stripe Connect, Stripe Identity/Persona, vendor e-sign); **build** the deal state machine, escrow-release policy, authority/verification model, and dispute flow.
- **Non-goals:** not ticketing, not a DSP, not a social network, **not the legal authority (we generate contracts, we don't adjudicate law)**, not a money transmitter, not an agency.
- **Money:** a take rate on **confirmed** bookings, **~8–12% all-in** target (inside the 2.5–17% benchmark, above the commodity floor, below the all-in cost of the email status quo); **money-gated, deposit-backed requests** double as the anti-spam filter.

---

### Cross-references

- Ubiquitous language & entities → [`02-domain-model.md`](./02-domain-model.md)
- Identity vs authority, provenance-based verification, anti-spam → [`03-trust-verification.md`](./03-trust-verification.md)
- Escrow custody, deposit/balance/settlement flow, dispute model, agent cut → [`04-payments-escrow-disputes.md`](./04-payments-escrow-disputes.md)
- Offer/counter-offer + deal state machine → [`05-negotiation-deal-lifecycle.md`](./05-negotiation-deal-lifecycle.md)
- Availability, explicit confirm/deny, the "confirmed" artifact → [`06-availability-confirmation.md`](./06-availability-confirmation.md)
- Orgs, roster, RBAC, on-behalf-of → [`07-roster-org-rbac.md`](./07-roster-org-rbac.md)
- Profiles, pitches, discovery, verified-only outreach → [`08-profiles-pitches-discovery.md`](./08-profiles-pitches-discovery.md)
- Build-vs-buy, bounded contexts, security posture → [`09-system-architecture.md`](./09-system-architecture.md)
- Design language & the confirmation moment → [`10-design-direction-ux.md`](./10-design-direction-ux.md)
- Cold-start, liquidity, beachhead, take-rate finalization → [`11-gtm-liquidity-trust-safety-ops.md`](./11-gtm-liquidity-trust-safety-ops.md)
- Phasing, risk register, open questions → [`12-roadmap-risks-open-questions.md`](./12-roadmap-risks-open-questions.md)
