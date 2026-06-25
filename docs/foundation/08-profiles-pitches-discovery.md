# 08 — Profiles, Pitches & Discovery

> Part of the **showman** foundation doc set (`docs/foundation/`). This doc owns the **read/presentation surface** of the marketplace: how a supply side packages itself (the `ArtistProfile` EPK), how a demand side identifies itself (the `BookerProfile`), what a booker says *inside* a request (the `Pitch`), and how either side **finds** the other (discovery, search, ranking).
>
> It defines *shape and behavior of profiles, pitches, and discovery*. It does **not** redefine entities — their canonical definitions live in [`02-domain-model.md`](./02-domain-model.md). It consumes verification provenance from [`03-trust-verification.md`](./03-trust-verification.md), reputation from the `ReputationScore` defined in `02`, the `Listing` `fee`/`private_floor`/`availability_policy` from `02`, and feeds the negotiation entry-point in [`05-negotiation-deal-lifecycle.md`](./05-negotiation-deal-lifecycle.md). Visual treatment of these surfaces is [`10-design-direction-ux.md`](./10-design-direction-ux.md); where they live as code is [`09-system-architecture.md`](./09-system-architecture.md).
>
> **Invariants this doc must honor (from `02`):** **I-6** (the floor is invisible), **I-8** (a `Listing` belongs to exactly one `ArtistProfile`), **I-20** (no deal, no review). It also leans hard on the trust output of `03` and the **actor-vs-principal** keystone — *profiles describe **principals**, never `User`s.*

---

## 0. What this doc is for (and the one rule that governs it)

Three of `init-jot`'s requirements live here:

> *"there should be some type of profile or pitch features where a booker or artist has somewhat of a profile to be seen to help in decisions… the booker could have their profile so that when an artist receives a request they can gain an initial grasp of who the booker is"*
>
> *"there should also be a pitch feature to explain in the request what the specific event or 'thing' that they are requesting to book the artist for"*
>
> …and the implicit one: with a verified, money-gated marketplace, **how does either side discover the other in the first place?**

The governing rule for everything in this doc:

> **A profile is the public face of a *principal*, assembled from facts the platform can vouch for.** It is not a self-asserted bio with a checkmark. The same trust spine that powers verification (`03`) powers the profile and powers discovery ranking — provenance, reputation, and completed-deal history are *the same substrate*, surfaced in three places. A profile that claims things showman cannot stand behind is a liability, not a feature; the design below deliberately separates **vouched-for facts** (provenance-backed) from **self-asserted claims** (clearly labeled) on every surface.

This is the lever that makes showman feel different from GigSalad (self-asserted profiles + reviews) and Sonicbids (pay-to-pitch EPKs no one trusts): **the profile is downstream of verification, not a substitute for it.**

---

## 1. The three surfaces and how they connect

```
        DISCOVERY (search / browse / ranking)
        ──────────────────────────────────────
        booker searches  ──►  ranked ArtistProfile results  ──┐
        artist searches  ──►  ranked BookerProfile results  ──┤   ranking signals:
                                                              │   verification provenance (03)
                                                              │   + ReputationScore (02)
                                                              │   + Listing fit (fee/availability)
                                                              ▼
        PROFILE (the EPK / the booker dossier)            "sizing up" surface
        ──────────────────────────────────────
        ArtistProfile  ◄── booker evaluates supply
        BookerProfile  ◄── artist evaluates demand (when a request lands)
                                                              │
                                                              ▼  booker commits intent
        PITCH (attached to a BookingRequest)              "what's the thing?"
        ──────────────────────────────────────
        Pitch  ──► travels inside BookingRequest ──► opens the deal thread (05)
```

- **Discovery** is how you *find* a counterparty. Ranking is a trust-and-fit problem, not an engagement problem (there is no feed — a non-goal in `01`).
- **A profile** is how you *evaluate* a counterparty before/while transacting. Two flavors: the artist's **EPK** (rich, supply-side marketing) and the booker's **dossier** (terse, demand-side credibility).
- **A pitch** is how a booker *makes the case for one specific event*. It rides inside a `BookingRequest` (per `02`, a `Pitch` is embedded, not a top-level entity) and is the first thing the artist's team reads when a request lands.

The connective tissue across all three is the trust spine. The next sections define each surface's data model and behavior, then the ranking that ties them together.

---

## 2. `ArtistProfile` — the EPK

The artist profile is an **EPK** (electronic press kit) reframed as a *bookable, verifiable* object. An incumbent EPK is a PDF or a Sonicbids page: self-asserted, static, untrusted, and detached from the actual booking. showman's EPK is the opposite on all four axes — **live, provenance-backed, and the literal launch point of a `BookingRequest`.**

### 2.1 What the EPK is composed of

The `ArtistProfile` entity (defined in `02`) holds the identity-level fields. The EPK is the *presentation* of that profile plus its attached media, its `Listing`s, a slice of its `AvailabilityWindow` calendar, and its trust summary. It is assembled from several sources — and the assembly rule is what matters:

| Section | Source of truth | Vouched-for or self-asserted? |
| --- | --- | --- |
| Identity header (stage name, home market, genre) | `ArtistProfile` fields (`02`) | Self-asserted *except* the verification badges |
| **Verification provenance badges** | `Integration` (verification_source) + `03` | **Vouched-for** — the differentiator |
| Media (photos, audio, video, press) | `ProfileMedia` (this doc, §2.3) | Self-asserted, but provenance-tagged where possible |
| **Listings** (`fee` / set type / riders) | `Listing` (`02`) | Self-asserted terms; `private_floor` **never shown** (I-6) |
| Availability preview | `AvailabilityWindow` (`02`, `06`) | Platform-derived from the calendar |
| **Prior shows / track record** | `BookingCredit` (this doc, §2.4) | **Mixed** — platform-confirmed vs. self-asserted, labeled |
| **Reputation summary** | `ReputationScore` (`02`) | **Vouched-for** — derived from completed `Agreement`s only |

> **The two-zone rule (load-bearing):** every EPK renders in two visually distinct zones — a **vouched-for zone** (badges, on-platform completed bookings, reputation, calendar) that showman stands behind, and a **self-asserted zone** (bio prose, off-platform credits, media the artist uploaded) that is clearly "the artist says…". A booker sizing up an artist must never have to guess which is which. This is the trust contract of the whole surface. UX treatment in `10`.

### 2.2 `ArtistProfile` EPK — data-model fields

This expands the `ArtistProfile` definition in `02` with the **presentation/EPK fields**. (Per `02`'s consistency obligation, these augment the spine entity; nothing here competes with or renames a `02` term.)

```
ArtistProfile (EPK presentation fields — augments 02's identity fields)
─────────────────────────────────────────────────────────────────────
  # Identity header
  stage_name              string              # the public act name ("Prince")
  legal_name              string?  PRIVATE    # never public; used in contracts (05) only
  handle                  string  UNIQUE      # /a/prince — stable public URL slug
  home_market             string              # "Minneapolis, MN" — base city/region
  genre_tags              string[]            # controlled vocabulary (see §6 facets)
  act_type                enum                # band | dj | solo | duo | ensemble | other
  short_descriptor        string  ≤80         # one-liner shown in search cards
  bio                     markdown  SELF       # long-form; self-asserted zone

  # Trust (vouched-for zone) — sourced, not stored as free text
  verification_badges     VerificationBadge[] # derived from Integration + 03 (read-only here)
  reputation_summary      ReputationSummary   # denormalized slice of ReputationScore (§5)
  member_since            date                # account age — a soft trust signal
  response_profile        ResponseProfile     # median response time, accept rate (from Events)

  # Money & bookable terms
  listings                Listing[]           # 02 entity; fee/private_floor/availability_policy
  fee_display             FeeDisplay          # derived public view of listing fees (§2.5)
  currency                ISO-4217
  open_to                 enum[]              # club | theater | festival | private | brand | corporate

  # Availability (preview only; full calendar semantics in 06)
  availability_preview    AvailabilityPreview # next-open summary + routing hint, NOT the raw calendar
  booking_lead_time_days  int                 # min days out (mirrors Listing.availability_policy)
  touring_radius          TouringRadius?      # home-base + willing-travel hint for routing/discovery

  # Media & track record
  media                   ProfileMedia[]      # §2.3
  credits                 BookingCredit[]     # §2.4 — prior shows
  press                   PressItem[]         # quotes/links, self-asserted zone

  # Presentation/state
  visibility              enum                # draft | unlisted | public  (see §2.6)
  completeness            ProfileCompleteness # derived score driving onboarding nudges (§2.7)
  managing_org_display    OrgPublicRef?       # "Managed by [Org]" if the team opts to show it
  updated_at              timestamp
```

Notes that matter:

- **`handle`** is the stable public identifier and the root of the shareable URL (`/a/<handle>`). It is *not* the `stage_name` (which can collide and change). This is also what the **Confirmed artifact** (`06`) links back to.
- **`legal_name` is `PRIVATE`.** The EPK never shows it. It exists only to flow into the `Contract` (`05`). Keeping it off the profile is both a privacy and a safety property (stalking/doxxing of real names behind stage names is a real artist concern).
- **`verification_badges` and `reputation_summary` are read-only here** — they are *projections* of `03` and `02` state. This doc never lets a profile *write* trust; it only *displays* it. (Closes the GigSalad-style hole where the profile is the trust.)
- **`fee_display` is derived, never raw `Listing` internals**, so the `private_floor` cannot leak through the profile (I-6). See §2.5.
- **`availability_preview` is a summary, not the calendar.** A booker should learn "next open window is in March, routing through the Midwest" without scraping the full `AvailabilityWindow` set (which is sensitive and lives behind `06`'s semantics + hold logic).

### 2.3 `ProfileMedia` — the EPK media model

Media is what makes an EPK feel like a *press kit* rather than a form. It is its own attached entity (not a blob of URLs on the profile) so each item can carry provenance, ordering, and moderation state.

```
ProfileMedia
────────────
  id                  uuid
  artist_profile_ref  ArtistProfile
  kind                enum        # photo | audio | video | logo | epk_pdf | doc
  source              enum        # uploaded | embedded_dsp | embedded_video | linked
  url / storage_ref   string      # platform-stored (uploaded) or external (embedded)
  provenance          MediaProvenance?  # e.g. linked from the *verified* Spotify/YouTube channel (03)
  caption             string?
  credit              string?     # photographer/videographer credit (rights hygiene)
  display_order       int
  is_hero             bool        # the single lead image/video for cards & header
  moderation_state    enum        # pending | approved | flagged | removed
  created_at          timestamp
```

Behavior:

- **Embedded DSP/video media inherits provenance.** If an artist embeds tracks from the *same* Spotify channel they verified through (`03`), the media item carries `provenance = verified_channel` and renders in the vouched-for zone ("from the verified artist channel"). Arbitrary uploaded media stays in the self-asserted zone.
- **Media is moderated, lightly.** `moderation_state` exists because a public, indexable surface needs a kill switch for abuse/rights complaints. Default flow is auto-approve + report/takedown (lazy moderation), not pre-review — pre-review doesn't scale and the marketplace is verified-gated anyway. Ops playbook in [`11-gtm-liquidity-trust-safety-ops.md`](./11-gtm-liquidity-trust-safety-ops.md).
- **`is_hero` drives the search card and profile header**; exactly one per profile (fallback to first approved photo).
- **Rights hygiene via `credit`** is a deliberate nudge: touring artists care about photographer credit, and modeling it cheaply heads off rights disputes.

### 2.4 `BookingCredit` — prior shows / track record

This is the part of the EPK that most directly answers "is this act real and at the level they claim?" — and it's where vouched-for vs. self-asserted matters most.

```
BookingCredit
─────────────
  id                  uuid
  artist_profile_ref  ArtistProfile
  source              enum        # platform_confirmed | self_asserted | imported
  agreement_ref       Agreement?  # SET iff source = platform_confirmed (02)
  event_name          string      # "Pitchfork Music Festival 2025"
  venue_name          string?
  market              string?     # city/region
  date                date
  role                enum?       # headline | direct_support | support | festival_slot | dj_set
  capacity_band       enum?       # <500 | 500–2k | 2k–10k | 10k+  (size signal, not exact)
  visibility          enum        # public | private
  created_at          timestamp
```

The split:

- **`platform_confirmed`** credits are auto-generated when an `Agreement` reaches `Settled` (`05`). They link to the `Agreement` (`agreement_ref`), carry showman's vouch, and render in the **vouched-for** zone with a "Booked on showman" mark. **These can never be faked** — they correspond to a real, escrowed, completed transaction. This is a flywheel: every completed booking *strengthens* the EPK, which improves discovery rank, which drives more bookings.
- **`self_asserted`** / **`imported`** credits are the artist's claimed history (prior tours, festivals booked off-platform). They render in the **self-asserted** zone, visually quieter, labeled "self-reported." They are useful (especially for cold-start when no platform history exists) but never carry showman's vouch.

> **Cold-start consequence:** a brand-new verified artist has zero `platform_confirmed` credits. That's fine — the EPK leans on **verification provenance** (`03`) and self-asserted history at first, and *earns* vouched-for credits as it transacts. Discovery ranking (§6) weights provenance heavily precisely so that a freshly-verified, zero-credit artist isn't buried.

### 2.5 `FeeDisplay` — showing money without leaking the floor (I-6)

The EPK shows what an act costs, because a booker filtering on budget is the single most important discovery filter. But the **`private_floor` must never be derivable** (I-6). The display model enforces this:

```
FeeDisplay (DERIVED from the profile's Listings — read-only projection)
──────────────────────────────────────────────────────────────────────
  mode            enum     # exact | range | from | by_request
  amount_low      money?   # public fee or range-low — NEVER private_floor
  amount_high     money?
  currency        ISO-4217
  per_listing     { listing_handle, label, fee_display }[]   # e.g. "DJ set: from $8k"
  notes           string?  # "fees vary by market / routing"
```

Rules:

- **`FeeDisplay` is computed from `Listing.fee` only.** `Listing.private_floor` is **never** an input to any field, never returned by the profile API, and never inferable from the public range (I-6). A booker browsing sees "from $8,000," not "floor $6,500."
- **`by_request`** mode exists for the represented/festival tier where teams refuse to publish numbers. The profile still transacts — the booker sends a request and the fee surfaces in the deal thread (`05`). Discovery can still *bucket* `by_request` listings into a coarse band (set by the team) without revealing a number, so budget filters still work.
- The **discovery budget filter** (§6) matches against the **public band**, never the floor. A below-floor offer is handled silently by the negotiation engine (`05`), not by exposing anything at discovery time.

### 2.6 Visibility & the single-player wedge

`visibility` (`draft | unlisted | public`) is strategically important, not just a flag:

- **`draft`** — being built; not discoverable; not requestable.
- **`unlisted`** — fully functional and **requestable via direct link**, but not surfaced in discovery/search. This is the represented-tier mode: agencies who want the booking rail and the escrow but *not* a public storefront. The artist transacts on showman without being "listed on showman."
- **`public`** — discoverable + requestable.

This ladders directly into the GTM **single-player-mode** wedge (`11`): an artist/team can build a verified EPK + availability calendar and use the shareable URL (`/a/<handle>`) as their press kit **before any booker is on the platform** — the EPK is useful standalone. `unlisted` makes showman valuable to a team that will *never* want a public marketplace listing, which is most of the represented tier.

### 2.7 `ProfileCompleteness` — a derived nudge, not a gate

```
ProfileCompleteness (derived)
─────────────────────────────
  score           0..100
  has_verification bool      # at least one provenance badge (03)
  has_hero_media   bool
  has_listing      bool      # at least one Listing with a public fee
  has_availability bool      # calendar populated enough to be bookable
  missing[]       enum[]     # drives onboarding checklist UI
```

Completeness **drives onboarding nudges and a soft rank input** (§6), but is **not** a hard gate on transacting (except the genuine prerequisites: a public profile must be verified per `03` and have ≥1 requestable `Listing`). A near-empty but verified profile can still receive requests; it just ranks lower and gets nudged.

---

## 3. `BookerProfile` — the demand-side dossier

When a request lands, the artist's team asks one question: **"who is this, and are they real?"** The `BookerProfile` answers it. Its design philosophy is the **inverse** of the EPK: where the EPK is rich, marketed, and supply-side-promotional, the booker dossier is **terse, credibility-first, and demand-side-evidentiary.** A booker is not selling themselves to be discovered (mostly); they are establishing that they are a solvent, legitimate, non-spam counterparty worth a confirm.

> Why this asymmetry: in this market, **supply markets itself; demand proves itself.** Artists compete to be found; bookers must clear a trust bar. The `init-jot` line — *"when an artist receives a request they can gain an initial grasp of who the booker is"* — is a **trust-sizing** need, not a marketing surface.

### 3.1 `BookerProfile` — data-model fields

Augments the `BookerProfile` entity from `02` with presentation fields:

```
BookerProfile (dossier presentation fields — augments 02)
─────────────────────────────────────────────────────────
  # Identity
  display_name           string              # "Levitate Presents" / "Jane Doe, Talent Buyer"
  handle                 string  UNIQUE       # /b/<handle>
  type                   enum                # individual | org-backed (02)
  org_ref                Org?                # SET iff org-backed (festival/venue/promoter)
  role_title             string?             # "Talent Buyer", "Festival Programmer"
  home_market            string?
  short_descriptor       string  ≤80

  # Trust (vouched-for zone) — the core of the dossier
  verification_status    VerificationStatus  # KYC (individual) / KYB (org) from 03
  verification_badges    VerificationBadge[] # "KYB-verified festival", "Verified buyer" (03)
  payment_capability     PaymentCapability   # charge-capable payment method on file? (04) — boolean view
  reputation_summary     ReputationSummary   # completion rate, dispute rate, etc. (§5)
  member_since           date

  # Track record / context (what the artist sizes up)
  org_context            OrgContext?         # venue capacity, festival lineup history, years active
  booking_history_summary BookingHistorySummary  # # completed bookings on-platform, repeat rate
  notable_credits        BookerCredit[]      # past events/lineups (mixed vouched/self-asserted)
  links                  ExternalLink[]      # official site / past event pages (self-asserted)

  # Presentation/state
  visibility             enum                # private | discoverable  (default private; see §3.3)
  updated_at             timestamp
```

What the artist's team actually reads first (top of the dossier card), in priority order:

1. **Verification badge** — KYB-verified festival / venue / promoter, or KYC-verified individual (`03`). The single most important fact.
2. **Payment capability** — *can this booker actually fund a deposit?* (`payment_capability`, a boolean projection of `04` — never card details). A request that can't be funded is barely a request.
3. **Reputation** — completion rate, dispute rate, on-time-payment rate from `ReputationScore` (§5).
4. **Org context** — for org-backed bookers, the festival/venue's real-world footprint (capacity, lineage). A "Verified festival, 15 years, 20k cap" dossier is self-evidently serious.

### 3.2 The money-gated dossier is the anti-spam product

This is where the strategy in `01` and the mechanism in `03`/`04` become a *surface*. The dossier exists partly because **the cost of sending a real request already filtered the spam** — sending a `BookingRequest` requires a charge-capable payment method and (for serious requests) an escrowed deposit hold (`03`/`04`). So by the time a dossier reaches an artist:

- the booker is **KYC/KYB-verified** (`03`),
- they have a **fundable payment method** (`04`),
- and a real request typically carries a **deposit hold** that is *visible on the dossier-in-context*.

The dossier surfaces all three as trust facts. The artist's team isn't sizing up an anonymous email; they're sizing up a verified, payment-capable, deposit-backed counterparty. **The dossier doesn't *create* trust; it *displays the trust the gate already enforced*.** This is the anti-tire-kicker promise from `01` made legible.

### 3.3 Bookers are private by default

Default `visibility = private`. A `BookerProfile` is **not** a marketing surface and **not** discoverable unless the booker opts in (`discoverable`). Reasons:

- The artist→booker discovery use-case (§4.2) is **narrow and money-gated** by design — `init-jot` worried explicitly about spam from artists cold-pitching bookers, and the platform answer is *verified-only, rate-limited, and not a browseable booker directory.*
- Many bookers (especially individual talent buyers) have no desire to appear in a directory; their dossier exists only to be shown **in the context of a request they sent**.
- Festivals/venues that *want* inbound pitches can flip to `discoverable` and appear in artist-side discovery — but that's opt-in, and it's the exception.

So: a `BookerProfile` is **always shown to an artist who received that booker's request** (the primary purpose), and **only sometimes shown in discovery** (opt-in).

---

## 4. Discovery & search

Discovery is the cold-start engine and the daily entry point. It is *not* a social feed (a non-goal in `01`) — there is no following, no algorithmic timeline, no engagement loop. It is **utility search over a verified catalog**, with trust and fit as ranking signals.

### 4.1 Booker → Artist discovery (the primary direction)

This is the main marketplace motion: a verified booker finds artists to request.

**Entry modes:**

| Mode | What it is | Primary user |
| --- | --- | --- |
| **Search** | Keyword + structured facet filtering (genre, fee band, market, availability, act type) | Active buyer with a brief |
| **Browse** | Curated/faceted lists ("Verified mid-tier DJs touring the Midwest this fall") | Buyer exploring |
| **Direct link** | `/a/<handle>` — works for `public` *and* `unlisted` profiles | Buyer who already knows the act |
| **Routing-aware** | "who's touring near me on this date" — joins fee/genre filters with `AvailabilityWindow` + `touring_radius` | Promoter filling a date |

The **routing-aware** mode is a genuine wedge feature: incumbents (CRMs) and low-end marketplaces don't join *availability + routing + verified fee* into a single discovery query. A promoter with a hole on a Tuesday in March can find verified, in-budget acts already routing nearby. This is only possible because availability (`06`) and fee/listing (`02`) and verification (`03`) live in one catalog.

### 4.2 Artist → Booker discovery (the narrow, gated direction)

`init-jot` floated this and immediately flagged the risk:

> *"There may even be a feature that allows an artist to reach out to a potential booker's profile? Although this may cause spam and overloads of cold messages."*

The platform's resolution, consistent with the verified/money-gated thesis and the "not a social network" non-goal:

- **Only `discoverable` bookers appear** (§3.3) — there is no browseable directory of all bookers.
- **Outreach is verified-only and rate-limited.** Only a verified `ArtistProfile` may initiate, and initiations are rate-capped per artist per window (anti-spam mechanics owned by `03`; this doc just gates the *entry point*).
- **Outreach is structured, not a DM.** An artist→booker initiation is a **structured availability/interest signal** against a discoverable booker's stated needs — *not* a free-text cold message. It carries the artist's EPK link and an availability window, and the booker can convert it into a `BookingRequest` (flipping the normal direction) or ignore it. No inbox to flood.
- **No engagement loop.** This is a directed, occasional, gated action — never a feed.

This keeps the *useful* version of the `init-jot` idea (a touring artist signaling "I'm routing through your city, I'm available, here's my verified EPK" to festivals that opted in) while structurally preventing the spam the jot feared.

### 4.3 What is searchable, and what is never searchable

| Searchable / filterable | Never searchable / never an output |
| --- | --- |
| `genre_tags`, `act_type`, `home_market`, `touring_radius` | `Listing.private_floor` (I-6) |
| Public `fee_display` band (incl. `by_request` coarse bucket) | `legal_name` (private) |
| `AvailabilityWindow` openness (preview-level) | Raw `AvailabilityWindow` internals / hold details (`06`) |
| `verification_badges` presence/source (`03`) | A booker's payment-method details (`04`) |
| `ReputationScore`-derived facets (completion rate band) | Any non-`discoverable` `BookerProfile` (§3.3) |
| `open_to` event types, capacity bands | `User` actors behind a principal (actor-vs-principal, `02`) |

> **I-6 restated at the discovery layer:** no search query, filter, sort, facet count, or "X results in your budget" message may reveal or let a booker *binary-search* the `private_floor`. Budget filtering operates only on the public band. This is a hard constraint on the search index schema — the floor is **not in the index.**

---

## 5. Reputation as a surfaced signal

`ReputationScore` is defined in `02` (per-principal, derived from `Review`s + `Agreement` outcomes + `Dispute` history). This doc owns **how it's summarized for profiles and how it weights discovery.** It is *not* recomputed here — it's projected.

### 5.1 `ReputationSummary` — the projection shown on profiles

```
ReputationSummary (DERIVED projection of ReputationScore — read-only)
─────────────────────────────────────────────────────────────────────
  completion_rate       pct     # settled / (settled + cancelled-by-this-side)
  dispute_rate          pct     # disputes-against / completed
  on_time_payment_rate  pct     # bookers: balance funded before performance (04)  [booker-only]
  response_time_median  duration # from Events (request → first substantive response)
  two_sided_rating      0..5    # avg Review rating (02)
  completed_count       int     # # of Settled Agreements (the volume signal)
  sample_size_note      enum    # established | limited_history | new   (honesty about n)
```

Design rules:

- **`sample_size_note` is mandatory.** A 5.0 from one deal is not a 5.0 from forty. New principals are labeled `new`, not shown a misleadingly perfect score. (Avoids the GigSalad/Bash problem of meaningless five-star walls.)
- **Reviews require a completed `Agreement` (I-20).** No deal, no review — so reputation cannot be farmed. Every number traces to a real escrowed transaction.
- **Both sides have reputation.** Bookers carry `on_time_payment_rate` and `dispute_rate`; this is the demand-side accountability that low-end marketplaces lack. A booker who falsely disputes (`04`) wears it.
- **Reputation is a *vouched-for* facet** — it's in the trusted zone of both profiles because it's derived purely from transaction outcomes the platform observed.

### 5.2 Two-sided `Review`

Reviews are the `02` entity; behavior owned here:

- **Gated by a completed `Agreement` (I-20)** — requestable only after `Settled`.
- **Two-sided & blind-release.** Both sides submit within a window; reviews release simultaneously (neither side sees the other's before submitting), to reduce retaliation/strategic review-trading. Late/missing reviews from one side don't block the other's release after the window.
- **Attributed to principals, not actors** (`02`) — a manager's review of a booker accrues to the `ArtistProfile`/`Org` principal, not the manager's `User`.
- **Disputes interact with reviews:** an open `Dispute` (`04`) suspends review release for that `Agreement` until resolved.

---

## 6. Discovery ranking — verification + reputation as signals

Ranking is the heart of the discovery surface and the place trust becomes *leverage*. The thesis: **in a verified marketplace, ranking should reward provenance and proven performance, not pay-to-rank or recency-of-activity.** No paid placement (it would poison the trust signal and echo the Sonicbids pay-to-pitch anti-pattern called out in `01`).

### 6.1 The ranking signals (booker → artist results)

Ranked by a transparent, explainable blend — *not* an opaque engagement model:

| Signal | Source | Why it ranks | Weight class |
| --- | --- | --- | --- |
| **Fit / relevance** | query ↔ `genre_tags`, `act_type`, `fee_display` band, market | the booker's actual need | **primary (hard filters + relevance)** |
| **Availability fit** | `AvailabilityWindow` preview vs. requested date/routing (`06`) | a great act on a blocked date is useless | **primary** |
| **Verification provenance** | `verification_badges` strength/source (`03`) | trust is the product; verified ranks above unverified, always | **high** |
| **Reputation** | `ReputationSummary` (completion rate, low dispute rate, response time) | proven performers should win | **high** |
| **Track record** | `platform_confirmed` `BookingCredit` count (§2.4) | real completed deals = real act | **medium** |
| **Responsiveness** | `response_profile` (median first-response, accept rate) | a fast, engaged team converts | **medium** |
| **Completeness** | `ProfileCompleteness` (§2.7) | complete EPKs convert; a soft tiebreaker | **low** |

### 6.2 Ranking rules that protect the marketplace's integrity

- **Hard filters first, then rank.** Budget band, availability, and "is this requestable" are *filters* (a non-match is excluded), not soft signals. You never see an out-of-budget, unavailable act ranked up by reputation.
- **Verification is a floor, not just a boost.** Unverified profiles can't be `public` at all (per `03` + §2.6), so by construction the ranked set is verified. Provenance *strength* then differentiates within it ("Verified via Spotify for Artists" + KYC > documentary-fallback-only).
- **Cold-start fairness.** Because verification provenance is weighted **high** and is *available on day one* (it doesn't require transaction history), a freshly verified artist with zero `platform_confirmed` credits still ranks respectably. Track record then compounds. This deliberately prevents a rich-get-richer death spiral where only artists with history are ever seen — the cold-start killer for a two-sided market (`11`).
- **No pay-to-rank, ever.** Placement is never purchasable. The take rate (`01`) is the only money showman makes from a booking; ranking stays a pure trust/fit function. This is a positioning commitment, not just a technical one.
- **Explainability.** Each result can show *why* it ranked ("Verified · 12 shows booked on showman · responds in ~6h"). Explainable ranking is itself a trust feature and a hedge against the "black-box agency" feeling `01` positions against.
- **Anti-gaming.** Because the strongest signals (provenance via `03`, `platform_confirmed` credits, reputation via I-20) all trace to verified identity or real escrowed transactions, the ranking is **expensive to game** — you cannot fabricate a completed, escrowed, two-sided-reviewed booking. Self-asserted fields (bio, off-platform credits) are deliberately *low or zero weight* in ranking.

### 6.3 Facets / controlled vocabularies

Discovery needs stable, controlled vocabularies (free-text tags fragment search). v1 facets:

```
genre_tags        controlled list (electronic/house/techno, hip-hop, indie-rock, …)  + synonyms
act_type          band | dj | solo | duo | ensemble | other
market            city/region (geocoded; powers routing + radius)
fee_band          coarse buckets that DON'T leak the floor (e.g. <$5k, $5–15k, $15–50k, $50k+)
event_fit         club | theater | festival | private | brand | corporate   (from open_to)
availability      open-window presence in a date range (preview-level)
verification      badge presence + source tier (from 03)
reputation_band   completion-rate / established vs. new (from §5)
```

These facets are shared between search filters (§4.3) and ranking signals (§6.1) — one vocabulary, two uses.

---

## 7. The `Pitch` — data model & template

A `Pitch` is the booker's case for **one specific event**, embedded inside a `BookingRequest` (per `02`, it is *not* a top-level entity — it lives on the request). It is the second `init-jot` requirement this doc owns:

> *"a pitch feature to explain in the request what the specific event or 'thing' that they are requesting to book the artist for."*

The pitch is the **first thing the artist's team reads when a request lands**, sitting right beside the `BookerProfile` dossier (§3). Together they answer *"who is asking, and for what?"* in one screen — the decision surface for accept/decline/counter (which hands off to `05`).

### 7.1 Why a structured template (not a free-text box)

A free-text "tell us about your event" box is what email already is, and it's the problem. A structured pitch:

- gives the artist's team a **scannable, complete** brief (no "wait, what's the capacity? what's the date? am I headlining?"),
- makes pitches **comparable** across requests (a team triaging ten inbound requests can scan them uniformly),
- **pre-populates the deal terms** (date, fee context, set length) so the negotiation thread (`05`) and eventual `Agreement`/`Contract` (`05`) start from structured data, not a copy-paste,
- and lets discovery/ranking and dedup (Invariant **I-12**, team routing) reason over typed fields.

So the pitch is **structured fields + a bounded free-text "context" section** — the structure carries the facts, the prose carries the persuasion.

### 7.2 `Pitch` — data-model fields (embedded on `BookingRequest`)

```
Pitch (embedded value-object on BookingRequest — 02)
─────────────────────────────────────────────────────
  # The event ("the thing")
  event_name            string              # "Levitate Music Festival 2026"
  event_type            enum                # club | theater | festival | private | brand | corporate | other
  event_date            date  (+ alt_dates  date[]?)   # primary + acceptable alternates
  doors_time            time?
  set_time              time?

  # Place & scale
  venue_name            string
  market                string              # city/region (powers routing + dedup)
  venue_capacity        int?
  capacity_band         enum?               # <500 | 500–2k | 2k–10k | 10k+
  indoor_outdoor        enum?               # indoor | outdoor | mixed
  age_policy            enum?               # all-ages | 18+ | 21+

  # The ask (what they want from THIS artist)
  billing               enum                # headline | co-headline | direct_support | support | festival_slot
  set_length_minutes    int?
  set_type_requested    Listing?            # which Listing this targets (DJ set / full band)  (02)
  other_acts            string?             # lineup context ("w/ … ")

  # Money context (NOT an Offer — that's 05)
  offered_fee           money?              # opening number, if the booker leads with one
  fee_is_firm           bool?               # "this is our budget" vs. "negotiable"
  deposit_intent        enum?               # informational: expected deposit posture (04)

  # Logistics & fit
  backline_provided     bool?               # gear context (DJ booth / backline)
  travel_hospitality    string?             # who covers travel/lodging (rider context — 05)
  promo_plan            string?             # marketing/announce plan ("on-sale 3 weeks out")
  why_this_artist       markdown  ≤ N       # bounded free-text: the persuasion / fit case

  # Attachments
  attachments           PitchAttachment[]   # deck, venue photos, past-event recap, budget letter
```

Design notes:

- **`set_type_requested` links to a specific `Listing`** so the pitch targets a concrete bookable product (DJ set vs. full band) — and the `Listing`'s `private_floor` silently governs the negotiation (`05`) without ever appearing in the pitch (I-6).
- **`offered_fee` here is *context*, not an `Offer`.** It seeds the deal but the binding money exchange is the `Offer` chain in `05`. Keeping it informational on the pitch avoids confusing "the booker mentioned a number" with "a formal offer exists."
- **`market` + `event_date` feed dedup/routing (I-12).** Because the request resolves to the artist's managing `Org` (`02`), the team can see *all* inbound pitches for overlapping dates/markets in one place — directly serving "avoid multiple requests to the same team."
- **`why_this_artist` is the only substantial prose**, and it's bounded. The structure does the heavy lifting; the prose closes.
- **Attachments are first-class** (`PitchAttachment`: deck, venue photos, prior-edition recap, proof-of-budget letter) because real festival/promoter pitches carry supporting material — this is what makes a serious pitch *feel* serious to the artist's team.

### 7.3 `PitchTemplate` — the authoring/rendering surface

The data model above is rendered to bookers through a **`PitchTemplate`**: a typed, sectioned form that adapts to `event_type`. It is the booker-facing authoring experience and the artist-facing read experience — same underlying `Pitch`, two views.

```
PitchTemplate (presentation/authoring spec for the Pitch form)
──────────────────────────────────────────────────────────────
  variant        enum     # festival | club_show | private/brand | corporate
  sections       Section[]  # ordered, with required/optional field sets per variant
  required_for_send  field[] # minimum viable pitch (see §7.4)
  guidance       inline help per field (reduces vague pitches at the source)
```

Template variants tune which fields are required/surfaced. A **festival** pitch foregrounds `billing`, `capacity_band`, `other_acts`, and a deck attachment; a **club_show** pitch foregrounds `venue_capacity`, `set_length_minutes`, `backline_provided`, `promo_plan`; a **private/brand** pitch foregrounds budget firmness and hospitality. One `Pitch` model, several guided front-doors.

### 7.4 Minimum-viable pitch (what's required to send)

A `BookingRequest` cannot be sent with an empty pitch — that would reintroduce the spammy "hey are you available?" email. The **minimum viable pitch** (required to send) is:

```
REQUIRED:  event_name · event_type · event_date · venue_name · market
           · billing · set_type_requested (which Listing)
RECOMMENDED (warned-if-missing): venue_capacity/capacity_band · offered_fee · why_this_artist
```

Combined with the money gate (a charge-capable method + deposit hold from `03`/`04`), the required-pitch rule means **every inbound request is both funded and substantive.** That pairing — money gate + structured-pitch gate — is the anti-spam core made concrete on the request surface, and it's why the artist's "who is this and for what?" decision (dossier + pitch) is always answerable.

---

## 8. The decision surface — where profiles + pitch converge

When a `BookingRequest` lands, the artist's team sees a single **decision surface** that composes the three things this doc defines:

```
┌─────────────────────────────────────────────────────────────┐
│  REQUEST: "Levitate Music Festival 2026 — headline, July 18" │
├──────────────────────────────┬──────────────────────────────┤
│  PITCH (§7)                   │  BOOKER DOSSIER (§3)          │
│  • the event / the ask        │  • KYB-verified festival ✔    │
│  • date · venue · capacity    │  • payment-capable ✔ (04)     │
│  • billing · set · fee context│  • 23 booked on showman       │
│  • why-this-artist + deck     │  • 0 disputes · pays on time  │
├──────────────────────────────┴──────────────────────────────┤
│  CONTEXT: deposit hold present (04) · resolves to [Org] team  │
│           (I-12 dedup) · targets [Listing] (floor hidden, I-6)│
├───────────────────────────────────────────────────────────────┤
│  ACTIONS → accept / counter / decline  ──►  deal thread (05)  │
└───────────────────────────────────────────────────────────────┘
```

This is the screen `init-jot` asked for ("when an artist receives a request they can gain an initial grasp of who the booker is") realized as a composition of vouched-for trust (badges, reputation, payment capability), a structured pitch, and the floor/dedup machinery running invisibly underneath. From here the flow hands off to [`05-negotiation-deal-lifecycle.md`](./05-negotiation-deal-lifecycle.md). Visual design of this surface is owned by [`10-design-direction-ux.md`](./10-design-direction-ux.md).

---

## 9. How this doc connects to its siblings (cross-reference map)

| Sibling doc | What this doc consumes from it | What this doc provides to it |
| --- | --- | --- |
| [`02-domain-model.md`](./02-domain-model.md) | `ArtistProfile`, `BookerProfile`, `Listing` (`fee`/`private_floor`), `Pitch` (embedded), `ReputationScore`, `Review`, actor-vs-principal | EPK/dossier presentation fields, `Pitch` template, ranking model (augments the spine, never competes) |
| [`03-trust-verification.md`](./03-trust-verification.md) | verification provenance → `verification_badges`; KYC/KYB status; outreach rate-limits | provenance is a *displayed*, read-only facet on profiles + a **high-weight** ranking signal |
| [`04-payments-escrow-disputes.md`](./04-payments-escrow-disputes.md) | `payment_capability` (boolean view), deposit-hold presence, on-time-payment rate | surfaces money-gate trust on the dossier; never shows card/payment internals |
| [`05-negotiation-deal-lifecycle.md`](./05-negotiation-deal-lifecycle.md) | the deal state machine the decision surface hands off to; `Offer` chain; floor logic | a structured `Pitch` that pre-seeds deal terms; the launch point of a `BookingRequest` |
| [`06-availability-confirmation.md`](./06-availability-confirmation.md) | `AvailabilityWindow` openness for `availability_preview` + routing-aware search; Confirmed artifact links to `/a/<handle>` | availability as a **primary** discovery filter/ranking signal |
| [`07-roster-org-rbac.md`](./07-roster-org-rbac.md) | who may edit a profile / send a pitch (role gating); `managing_org_display` | profiles describe principals (incl. `Org`-managed rosters); pitches route to the team (I-12) |
| [`09-system-architecture.md`](./09-system-architecture.md) | the `catalog` bounded context; the search index; media storage; moderation queue | the read/search/index surface; the rule that the floor is **not in the index** (I-6) |
| [`10-design-direction-ux.md`](./10-design-direction-ux.md) | visual treatment of EPK, dossier, pitch form, decision surface | the vouched-for/self-asserted two-zone rule as a design contract |
| [`11-gtm-liquidity-trust-safety-ops.md`](./11-gtm-liquidity-trust-safety-ops.md) | single-player-mode wedge; moderation/takedown ops; cold-start | `unlisted`/standalone EPK as single-player value; cold-start-fair ranking |

---

## 10. Open questions (carried, not blocking)

- **`Pitch` versioning.** `02` keeps `Pitch` embedded for v1; if bookers need to *revise* a pitch mid-thread (changed date/venue), does the pitch become a versioned value-object on the request? Leaning: capture edits as `Event`s on the `BookingRequest` (audit), not a separate entity, until templating/versioning demand appears. Revisit with `05`.
- **Search infrastructure.** Postgres full-text + trigram for v1 vs. a dedicated search engine (Meilisearch/OpenSearch/Typesense) for routing-aware + facet + relevance ranking at scale. Defer the heavy index to `09`/`12`; v1 likely Postgres-native. **Hard constraint regardless: `private_floor` is never indexed (I-6).**
- **Fee-band granularity.** How coarse must `fee_band` buckets be so that filtering can't binary-search the `private_floor` (I-6)? Needs a concrete bucketing scheme co-designed with `05`'s floor logic.
- **Booker discoverability default.** Confirmed `private`-by-default (§3.3); but festivals wanting inbound may want a richer opt-in discoverable profile. Scope the discoverable-booker surface with `11` (does artist→booker outreach earn its keep in v1, or is it Phase-2?).
- **Reputation cold-start display.** Exactly how to present `sample_size_note = new` so a new principal isn't penalized *or* misrepresented — a design + trust question shared with `05`/`10`.
- **Off-platform credit verification.** Is there a lightweight path to *vouch* for some self-asserted `BookingCredit`s (e.g., a festival confirming a past lineup) without full re-verification? Possible tie-in to `03`'s attestation paths; flagged for `12`.

---

*End of 08-profiles-pitches-discovery.md — owns the read/search/pitch surface; consumes the trust spine, never re-defines it. Amend `02` first for any new entity or term.*
