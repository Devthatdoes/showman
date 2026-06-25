# 10 — Design Direction & UX

> Part of the **showman** foundation doc set (`docs/foundation/`). This is the **design-language brief** and the **screen-level UX spec** for the highest-stakes flows. It answers `init-jot`'s recurring demand that the product be *"well designed and not just scrapped together to be barely functional… visually pleasing and 'cool' to use,"* and that the confirmation moment in particular be *"well designed and cool."*
>
> This doc owns **tone, typography, color, motion, layout, accessibility, and the wireframes** for: discovery, the artist EPK, the booker dossier, the request + pitch, the **negotiation thread**, **escrow status**, and the **confirmation artifact**. It does **not** redefine entities, flows, or rules — those are load-bearing decisions owned by siblings, and this doc *renders* them:
> - Ubiquitous language + actor-vs-principal keystone → [`02-domain-model.md`](./02-domain-model.md). Every label in every screen below names a **principal**, never a `User`. We use the exact terms (`ArtistProfile`, `BookerProfile`, `Listing`, `fee`, `Offer`, `Agreement`, `EscrowBalance`, `Hold`, `Pitch`, `Confirmation`) verbatim.
> - The deal **state machine** that the negotiation thread and escrow status visualize → [`05-negotiation-deal-lifecycle.md`](./05-negotiation-deal-lifecycle.md). The thread is a *view of the state machine*, not its own logic.
> - The **`Confirmed` artifact** (four surfaces, ICS, public/promo card) → [`06-availability-confirmation.md`](./06-availability-confirmation.md). This doc designs the moment; `06` owns what the object *is*.
> - **Profiles, the pitch template, the decision surface, the two-zone rule** → [`08-profiles-pitches-discovery.md`](./08-profiles-pitches-discovery.md). The vouched-for/self-asserted split is a *design contract* here, not a suggestion.
> - **Money mechanics** behind every escrow-status pixel → [`04-payments-escrow-disputes.md`](./04-payments-escrow-disputes.md). The UI shows *state*; `04` owns *movement*.
> - **Verification provenance badges** → [`03-trust-verification.md`](./03-trust-verification.md). Badges show the *source* of trust, never an opaque tick.
>
> **Invariants this doc must visibly honor:** **I-6** (the floor is invisible — no screen, tooltip, error, animation, or empty-state may leak `private_floor`), **I-10** (the confirm is an explicit human act — the UI must never imply auto-confirmation), and by extension I-9, I-16, I-17, I-21 wherever they surface to a user.

---

## 0. The design thesis: *trust you can see, calm under high stakes*

Most software in this space looks like one of two failure modes, and showman is defined against both:

1. **The low-end marketplace look** (GigSalad, The Bash, Sonicbids): busy, salesy, five-star-walls, stock-photo gradients, "Book Now!" buttons. It signals *cheap and unserious* to exactly the represented tier we want. A festival talent buyer wiring $80k will not trust a UI that looks like a wedding-vendor directory.
2. **The back-office CRM look** (Gigwell, Prism.fm): dense grey grids, tiny type, a thousand columns, built for an operator who lives in it eight hours a day. It is *capable* but *cold*, and it has no emotional peak — the confirmation moment is a row turning green.

showman is neither. The represented tier transacts in five-to-seven-figure deals over relationships and reputation; the product must feel like the **digital equivalent of a well-run agency**: discreet, precise, quietly expensive, and *trustworthy at a glance*. Two principles govern every decision in this doc:

> **Principle 1 — Trust is the visual language.** The thing showman sells (verified + escrowed + direct) must be *legible in the pixels*. Provenance badges (`03`), the vouched-for/self-asserted two-zone split (`08`), escrowed-amount state (`04`), and the confirmation artifact (`06`) are not decoration — they are the product, surfaced. When in doubt, show *why* something can be trusted (provenance, escrow state, audit), not just *that* it can.
>
> **Principle 2 — Calm under high stakes.** The screens carrying the most money and the most anxiety — the negotiation thread, escrow status, the confirm button, a dispute — must be the *calmest*, most legible, least cluttered surfaces in the app. Stakes go up; visual noise goes down. The opposite of a casino. Confidence comes from clarity, generous space, unambiguous state, and motion that *confirms* rather than *entertains*.

Everything below is these two principles made concrete.

---

## 1. Tone & voice

The copy is part of the design. The voice is **the good agent's voice**: plain, precise, never hype, never cute when money or commitment is on the line.

| Context | Voice | Example (do) | Anti-example (don't) |
| --- | --- | --- | --- |
| Empty states / onboarding | Warm, direct, a little dry wit allowed | "No requests yet. Your EPK is your storefront — make the hero look good." | "Oops! It's lonely here 🎤" |
| Money / escrow | Flat, factual, reassuring by precision | "$40,000 held in escrow by Stripe. Releases to you 3 days after the show unless a dispute is opened." | "Your money is safe and sound! 🔒" |
| Negotiation | Neutral, never coaching one side over the other | "Aria countered: $32,000." | "Great news! They want to negotiate!" |
| Confirmation | Genuine, celebratory, restrained — earned, not manufactured | "Confirmed. Aria Vale is playing Levitate 2026." | "🎉🎉 BOOKING LOCKED IN!!! 🎉🎉" |
| Errors / dead-ends | Honest, actionable, never blames the user | "This date was just booked by another deal. Here are the artist's next open windows." | "Something went wrong." |
| Decline / below-floor (floor-blind, I-6) | Generic, reason-free, never reveals a number | "This is below what the team will consider. Would you like to revise?" | "You're $4,500 short of their minimum." |

**Hard voice rules:**

- **Never name the actor in a deal-facing string.** Per `02`, surfaces say *"Aria Vale countered"* (the `ArtistProfile` principal), not *"Jane the manager countered."* The actor lives in the audit trail and in a discreet "acting as" affordance for the team's own members — never in the counterparty's view.
- **Never write a string that could leak `private_floor`** (I-6). No "almost there," no progress bar toward a hidden number, no "$X more," no differential timing copy. The floor does not exist as far as any booker-facing pixel is concerned.
- **Never imply automation confirmed a booking** (I-10). No "auto-confirmed," no "your date was automatically booked." Confirmation copy always attributes the act to the artist side's explicit choice.
- **Emoji budget: ~zero in deal/money surfaces.** Allowed sparingly in onboarding/marketing. The confirmation moment earns *restraint*, not party poppers.

---

## 2. Typography

Type does most of the work of "quietly expensive." The system is a two-typeface pairing plus a tabular numeric face for money.

| Role | Typeface (direction) | Why |
| --- | --- | --- |
| **Display / headlines** (confirmation headline, profile name, section heads) | A high-contrast modern serif or a confident grotesque with personality — e.g. a *Canela / GT Sectra*-class serif **or** a *Söhne / Neue Haas Grotesk*-class sans. **Pick one identity and commit.** | This is the "cool" — the editorial, press-kit feel that says *artist*, not *SaaS dashboard*. The confirmation headline ("Aria Vale is confirmed for Levitate 2026") must read like a poster, not a toast. |
| **Body / UI** | A clean, highly legible neutral grotesque (Inter, Söhne, or system-equivalent) | Readability under stakes. Body text is never the place to express personality at the cost of legibility. |
| **Numerals / money** | The body face with **tabular (monospaced) figures**, or a dedicated mono for ledger contexts | Money must align in columns and never reflow as digits change. Escrow ledgers, offer amounts, and the negotiation thread all use tabular figures so `$32,000` and `$40,000` line up. |
| **Code/IDs/audit** | A restrained monospace | Agreement IDs, audit-event refs, ICS UIDs — anything copyable/technical. |

**Type rules:**

- **Scale is generous, not dense.** The represented tier is not living in this UI eight hours a day; favor a larger base size (16–17px body) and roomy line-height (1.5–1.6 body). This is the opposite of the CRM grid.
- **One display face, used sparingly.** Reserve the display/serif for moments that deserve weight: the confirmation headline, the profile name, a few section titles. Overusing it cheapens it.
- **Money is always tabular.** Non-negotiable in the negotiation thread and escrow status — misaligned digits read as sloppy, and sloppy reads as untrustworthy when there's $40k on screen.
- **Provenance/verification labels are small-caps or a distinct micro-type** so "VERIFIED VIA SPOTIFY FOR ARTISTS" reads as a system attestation, not user prose.

---

## 3. Color

The palette is **restrained, dark-capable, and ruthlessly semantic.** Color is reserved for *meaning* (state, trust, money), not for decoration. This is what separates "quietly expensive" from "busy marketplace."

### 3.1 Neutrals (the ground)

A near-monochrome base — warm off-blacks and soft paper-whites, a full grey ramp — carries 90% of every screen. The product is mostly *quiet*. A confident neutral foundation is what makes the few accent colors land.

- **Light mode**: warm paper-white background, near-black warm ink text, a 6–8 step grey ramp for hierarchy.
- **Dark mode is first-class, not an afterthought** (touring/festival users live at night, on phones, backstage). True-dark backgrounds, lifted surfaces, carefully managed contrast. The confirmation card especially should be *gorgeous* in dark mode — that's where it gets screenshotted.

### 3.2 Semantic accents (used only with meaning)

| Token | Meaning | Where it appears |
| --- | --- | --- |
| **Brand / primary** | showman itself, primary actions | The single primary button per screen (Send request, Send offer, Confirm) |
| **Verified / trust** (a calm, credible hue — deep teal or a refined green-blue) | Provenance & verification | All verification badges (`03`), the vouched-for zone affordances (`08`), KYB/KYC markers |
| **Escrow / held** (a distinct, *not-alarming* gold/amber) | Money is held, not yet moved | EscrowBalance "held" state, deposit-backed `Hold` strength |
| **Released / settled** (the trust green, resolved) | Money moved to the artist | `Settled`, `Payout` released |
| **Caution** (amber-orange, distinct from escrow gold) | Expiring soon, action needed | Hold expiry countdowns, signature window closing, balance due |
| **Danger** (restrained red) | Decline, cancel, dispute, error | Dispute state, destructive actions — used *sparingly*, never for ordinary decline |
| **Confirmed** (the celebratory peak — a warm, premium accent: deep gold or a signature brand hue) | The confirmation moment | *Only* the `Confirmed` artifact. This color appears nowhere else, so when it shows up it *means* something. |

**Color rules:**

- **The confirmed color is sacred.** It is reserved exclusively for the confirmation artifact and its echoes. Scarcity is what makes the moment feel like an event. (Principle 2: the highest-stakes screen is the calmest *and* the most distinctive.)
- **Escrow gold ≠ caution amber.** "Money is safely held" must never read as "warning." Held-escrow uses a stable, reassuring gold; time-pressure uses a separate amber-orange. Tested for distinguishability including for color-vision deficiency (§9).
- **Never carry state by color alone** (§9 accessibility): every state has an icon + a text label in addition to color. "Held in escrow" says *held in escrow*, with a lock-ledger icon, in escrow gold — three redundant signals.
- **No paid-placement, no upsell color.** There is no "promoted" gold-star treatment in discovery (per `08` §6.2, no pay-to-rank). The palette has no "buy your way up" affordance because the product doesn't.

---

## 4. Motion

Motion follows Principle 2: **motion confirms, it does not entertain.** It exists to make state changes legible and to make the confirmation moment land — never to delight for its own sake on a money screen.

| Motion class | Where | Character | Duration |
| --- | --- | --- | --- |
| **State transitions** | A deal moving Negotiating → Accepted; escrow Held → Released | A purposeful, eased move/cross-fade that *shows the change happened* | 200–350ms |
| **Money movement** | Deposit captured, balance funded, payout released | A deliberate "settling" animation — a value counting/locking into the escrow ledger | 400–600ms |
| **Incoming offer / message** | New `Offer` lands in the thread | A gentle, non-jarring arrival; subtle emphasis, no bounce | ~250ms |
| **The confirmation reveal** | The `Confirmed` artifact minting | The **one** moment we spend a real motion budget: a composed, sequenced reveal of the headline + both verified parties + the date locking in. Cinematic but tasteful — closer to a title card than a celebration screen. | 800–1200ms, sequenced |
| **Micro-feedback** | Button press, toggle, copy-to-clipboard | Tight, immediate, < 150ms | < 150ms |

**Motion rules:**

- **`prefers-reduced-motion` is honored everywhere** (§9). Every animation has a reduced/instant variant. The confirmation moment in reduced-motion is a clean, immediate, still composition — equally beautiful, no movement. *No information is ever conveyed by motion alone.*
- **Nothing animates on the negotiation thread except arrivals and the accept transition.** A money-negotiation surface that bounces and pulses reads as manipulative. Stillness is the feature.
- **The confirm button does not "celebrate" on hover.** The celebration is *earned* by the click, post-commit, once `deal.confirmed` fires (`05`/`06`). Pre-commit, the button is calm and serious — it's a big decision.

---

## 5. Layout system & responsive strategy

### 5.1 Grid & density

- **A 12-column grid, generous gutters, capped content width** for reading surfaces (profiles, pitch, confirmation). Money/ledger surfaces get **tabular density** but never CRM-cramped.
- **Two-pane "decision surface" pattern** is the workhorse for the represented tier on desktop: context/list on the left, the active object on the right (request list ↔ pitch+dossier; deal list ↔ negotiation thread). This mirrors how an agent actually triages.
- **One primary action per screen.** The visual hierarchy always answers "what is the one thing to do here?" — Send request, Send offer, Confirm. Secondary actions are quiet.

### 5.2 Responsive behavior (mobile-first reality, desktop-first power)

The audience is bimodal: **artists/managers live on phones** (backstage, touring, between sets); **agencies/festival buyers triage on desktop** (multiple deals, multiple rosters). Both must be first-class.

| Surface | Desktop | Mobile |
| --- | --- | --- |
| **Discovery** | Faceted left rail + result grid | Filters in a bottom sheet; single-column result cards; routing-aware search front-and-center |
| **EPK / profile** | Two-zone columns (vouched-for / self-asserted), hero media, listings rail | Stacked, hero-first; vouched-for zone pinned above self-asserted (trust before prose) |
| **Decision surface (pitch + dossier)** | Side-by-side pitch ∥ dossier (per `08` §8) | Tabbed/stacked: dossier summary first (trust-sizing), pitch below; sticky accept/counter/decline bar |
| **Negotiation thread** | Two-pane: deal list ∥ thread + offer composer | Full-screen thread; offer composer as a bottom sheet; persistent "current state" header |
| **Escrow status** | Inline panel beside the deal | Full-width card stack; the ledger is the focus |
| **Confirmation** | Full-bleed cinematic card | Full-screen card, share-sheet native — *this is where mobile screenshots happen* |

**Responsive rules:**

- **Trust outranks prose on small screens.** On a phone EPK, the vouched-for zone (badges, on-platform credits, reputation) sits *above* the self-asserted bio. A booker sizing up on mobile sees what showman vouches for first (`08` two-zone rule).
- **The negotiation "current state" is always visible** — a sticky header that says where the deal is in the `05` state machine, so a manager glancing at a phone never has to scroll to learn "are we still negotiating or is this accepted?"
- **The confirmation card is engineered for the share sheet.** Mobile is where it gets screenshotted into a group chat or posted (the `06` §4.4 growth loop), so the mobile composition is the *canonical* one, not a degraded desktop port.

---

## 6. Screen-by-screen walkthrough

Each screen below states **what it renders** (which entities/states from the siblings), **the key UX decisions**, and where it hands off. The three highest-stakes flows (negotiation thread, escrow status, confirmation) get full ASCII wireframes in §7–§9... (rendered inline below).

### 6.1 Discovery (booker → artist, the primary direction)

Renders `08` §4: utility search over a verified catalog. **Not a feed.**

- **Search + facets**: genre, fee band (public band only — `private_floor` is *not in the index*, I-6), market, act type, availability, verification source, reputation band. The **routing-aware** mode ("who's available + touring near me on this date") is the hero entry point and the wedge — it gets prime placement, not buried in advanced filters.
- **Result card** = hero media + `stage_name` + verification badge(s) + public `fee_display` band + `short_descriptor` + an **explainability line** ("Verified · 12 booked on showman · responds in ~6h" — `08` §6.2). The explainability line *is* the anti-black-box trust feature; it's not optional.
- **No paid placement, no "promoted" treatment.** Rank is a pure trust/fit function (`08` §6.2); the card design has no slot for an ad. This is a visible positioning commitment.
- **Empty/cold-start**: a freshly-verified artist with zero `platform_confirmed` credits still presents credibly — provenance badge leads, `sample_size_note: new` is shown honestly (no fake 5.0 wall), per `08` §5.1.

### 6.2 Artist EPK / profile

Renders `08` §2: the EPK as a live, provenance-backed, bookable object. **The two-zone rule is the load-bearing design contract.**

- **Two visually distinct zones**, never ambiguous:
  - **Vouched-for zone** (carries showman's credibility hue, `03` badges): verification provenance, `platform_confirmed` `BookingCredit`s ("Booked on showman"), `ReputationSummary`, availability preview. Visually "weightier," trusted.
  - **Self-asserted zone** (quieter, clearly labeled "the artist says…"): bio prose, off-platform/self-reported credits, uploaded media. Useful, never carrying the platform's vouch.
- **Hero media** (`is_hero`) drives the header — this is the press-kit feel, the "cool."
- **Listings rail**: each `Listing` shows public `fee` / `from` / `by_request` via `FeeDisplay` (derived — `private_floor` never an input, I-6). The **"Request to book"** CTA on a `Listing` is the launch point of a `BookingRequest` (hands to §6.4 → `05`).
- **`unlisted` profiles** render identically via `/a/<handle>` — the single-player-mode press kit that works before any booker exists (`08` §2.6, `11`).
- **Floor safety**: there is *no* UI element, tooltip, or "make an offer" affordance that hints a minimum exists. A booker sees the asking `fee`; the floor is invisible (I-6).

### 6.3 Booker dossier

Renders `08` §3: the **inverse** of the EPK — terse, credibility-first, demand-side-evidentiary. Shown to an artist team **in the context of a request** (private by default, `08` §3.3).

- **Reads top-down in trust priority**: verification badge (KYB festival / KYC individual) → **payment capability** (boolean view of `04` — "payment-capable ✓", never card details) → reputation (completion rate, dispute rate, on-time-payment rate) → org context (capacity, years active).
- The dossier **displays the trust the money-gate already enforced** (`08` §3.2) — it doesn't manufacture trust, it shows it. Design makes the three gate-facts (verified, payment-capable, deposit-backed) impossible to miss.

### 6.4 Request + pitch (the decision surface)

Renders `08` §7–§8: the booker authors a structured `Pitch` via `PitchTemplate`; the artist team reads pitch ∥ dossier as one **decision surface** with accept / counter / decline → hands to `05`.

- **Authoring (booker side)**: a typed, sectioned form that adapts to `event_type` (festival / club / private / corporate). Structure carries the facts; the bounded `why_this_artist` prose carries the persuasion. **Minimum-viable-pitch** (`08` §7.4) is enforced before send — required fields are visually gated, so an empty "are you available?" can't be sent.
- **Reading (artist side)** = the §8 composition: **Pitch** (the event/ask) beside the **Dossier** (who's asking), with a context strip ("deposit hold present · resolves to [Org] team · targets [Listing]"). The **floor and the `Org` dedup/routing run invisibly underneath** — the team sees the request, not the machinery (I-6, I-12).
- **Actions**: `accept` / `counter` / `decline` — the entry into the negotiation thread (§7 below). `decline` is a quiet secondary action (restrained, never red-alarm); below-floor offers were already filtered floor-blind before the team ever saw them (`05` §5).

---

## 7. WIREFRAME — Negotiation thread (high-stakes)

**Renders:** the `05` state machine as a *view*. The thread is the single source of truth for "where is this deal?" — both teams and every member (via `Membership`) read the same `status`. One `Offer` is `open` at a time (I-14); the chain is a linked list, never a tree. Every entry traces to an `Event` (`05` §9). Money is at most *held* here (deposit-backed `Hold`), never captured — capture is downstream (`DepositCaptured`).

**Key UX decisions:**
- A **persistent state rail** at the top maps the deal onto the `05` machine so "are we haggling or have we agreed?" is answerable at a glance (the `Accepted` hinge is the visual fulcrum).
- The thread is **calm**: offers are structured cards (amount in tabular figures + terms delta), not chat bubbles. Free-text notes are allowed but secondary to the structured `Offer`.
- **The floor is invisible** (I-6): the artist-side composer may show the team's *own* floor as a private guide (their data), but **nothing** about the floor renders on the booker side, and below-floor booker offers were auto-handled before surfacing.
- **Acceptance ≠ confirmation** is visually enforced: accepting an offer advances to `Accepted` and opens contracting — it does **not** show the confirmation artifact (that's gated behind sign + fund + explicit confirm, I-10).
- Every entry shows the **principal** name (and, on your *own* team's side, a discreet "acting as [member]" actor note for internal accountability — never shown to the counterparty).

```
DESKTOP — two-pane: deal list (left) ∥ thread + composer (right)
┌────────────────────┬──────────────────────────────────────────────────────────────┐
│  DEALS             │  Aria Vale  ⇄  Levitate Music Festival 2026                    │
│  ───────           │  Listing: "DJ set"   ·   Target: Sat Jul 18, 2026 · Boston    │
│ ▸ Levitate '26  ●  │ ┌──────────────────────────────────────────────────────────┐ │
│   $32k · counter   │ │ STATE RAIL  (05 state machine)                            │ │
│                    │ │  Draft─RequestSent─[NEGOTIATING]─Accepted─Contract─Funded │ │
│   Boiler Rm Tour   │ │                      ▲ you are here                       │ │
│   accepted ✓       │ │  ▸ 1 open offer · hold: deposit-backed · expires in 11d   │ │
│                    │ └──────────────────────────────────────────────────────────┘ │
│   Coachella '26    │                                                                │
│   contract out     │   ── thread (newest at bottom) ─────────────────────────────  │
│                    │                                                                │
│   Outside Lands    │   ┌─ Levitate Festival · REQUEST + PITCH ──────────────────┐  │
│   settled · review │   │ Headline · Sat Jul 18 · The Stage, Boston · 5k cap     │  │
│                    │   │ Pitch: "Closing main stage… on-sale 3 wks out" [deck↗] │  │
│  [+ new request]   │   │ Dossier: KYB festival ✓ · payment-capable ✓ · 23 shows │  │
│                    │   └────────────────────────────────────────────────────────┘  │
│                    │                                                                │
│                    │            ┌─ OFFER · from Levitate ───────────────┐          │
│                    │            │  $28,000        deposit 50%            │          │
│                    │            │  set 90 min · backline provided        │          │
│                    │            │  status: superseded                    │          │
│                    │            └────────────────────────────────────────┘          │
│                    │                                                                │
│   ┌─ OFFER · from Aria Vale ───────────────┐                                       │
│   │  $34,000        deposit 50%            │  (your team · acting as: J. Okafor)   │
│   │  set 90 min · +hospitality rider        │  status: superseded                   │
│   └────────────────────────────────────────┘                                       │
│                    │                                                                │
│                    │            ┌─ OFFER · from Levitate ───────────────┐ ← OPEN    │
│                    │            │  $32,000        deposit 50%            │          │
│                    │            │  set 90 min · backline provided        │          │
│                    │            │  status: OPEN · expires in 3d 04h      │          │
│                    │            └────────────────────────────────────────┘          │
│                    │                                                                │
│                    │  ┌─ COMPOSE (your turn) ──────────────────────────────────┐    │
│                    │  │ ( • Accept $32,000 )   ( ↩ Counter )   ( ✕ Decline )   │    │
│                    │  │ ── counter ──                                          │    │
│                    │  │ Amount [ $34,000  ]  (tabular)   Deposit [ 50% ▾ ]     │    │
│                    │  │ Set len [ 90 min ]   Terms note [ … ]                   │    │
│                    │  │ Private guide (your team only): floor not shown to them │    │
│                    │  │                          [ Send counter offer ► ]      │    │
│                    │  └────────────────────────────────────────────────────────┘    │
└────────────────────┴──────────────────────────────────────────────────────────────┘

MOBILE — full-screen thread; sticky state header; composer as bottom sheet
┌───────────────────────────────┐
│ ‹ Aria Vale ⇄ Levitate '26    │  ← sticky: principal names, never actors
│ NEGOTIATING · open offer $32k │  ← sticky state (05) always visible
│ hold: deposit-backed · 3d 04h │
├───────────────────────────────┤
│  [REQUEST + PITCH card]        │
│  KYB festival ✓ · pay-able ✓   │
│                                │
│        [from Levitate]         │
│        $28,000 · superseded    │
│  [from Aria Vale]              │
│  $34,000 · superseded          │
│        [from Levitate] ← OPEN  │
│        $32,000 · exp 3d 04h    │
├───────────────────────────────┤
│ ( Accept $32k ) ( Counter )    │  ← sticky action bar
│            ( Decline )         │
└───────────────────────────────┘
       ▲ tap Counter → bottom sheet with amount/deposit/terms
```

> **What the wireframe is enforcing:** the state rail makes `05`'s machine *visible*; the OPEN tag enforces one-open-offer (I-14); offers render newest-last as a linked chain (each `replaces` the prior); the booker side has **no floor affordance** anywhere (I-6); and `Accept` advances to `Accepted`/contracting, never to the confirmation artifact (I-10, acceptance ≠ confirmation).

---

## 8. WIREFRAME — Escrow status (high-stakes)

**Renders:** the `EscrowBalance` and its release policy from `04`, as *state*, not movement. The one line to keep on screen: **showman never custodies funds — Stripe holds the money** (I-15). The UI's entire job is to make the two `init-jot` fears *visibly* impossible: (A) booker can't ghost on the balance because **balance is escrowed before the show** (I-16); (B) artist can't be trapped because **funds auto-release after the window unless a dispute lands** (I-17).

**Key UX decisions:**
- **Two audiences, two emphases, one ledger.** The artist side sees *"$X held for you → releases [date]"* (reassurance the money is real and coming). The booker side sees *"you've funded $X of $Y; balance due [date]"* (clarity on obligation). Same `EscrowBalance`, role-aware framing.
- **Escrow gold ≠ caution amber** (§3.2): "held" is reassuring gold; "due soon" pressure is amber; "released" is the resolved trust-green.
- **The release countdown is the trust feature.** "Auto-releases to the artist in 2d 18h unless a dispute is opened" turns I-17 from a policy into a visible, ticking promise — the single most reassuring element for the artist side.
- **Every step carries a state + icon + label**, never color alone (§9). The ledger reads top-to-bottom as the `04` flow: deposit → balance → held → release window → released.
- **"Open a dispute" is present but quiet** — restrained, never a prominent red button. It's a windowed, evidence-based action (`04`), not a one-tap clawback; the design discourages frivolous use without hiding the legitimate path.

```
ARTIST-SIDE VIEW  ("is my money real, and when do I get it?")
┌──────────────────────────────────────────────────────────────────────────┐
│  ESCROW · Aria Vale ⇄ Levitate 2026 · Sat Jul 18                          │
│  Held by Stripe · showman never holds your funds.                         │
│ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │  ●━━━━━━━━━━━━━━●━━━━━━━━━━━━━━●━━━━━━━━━━━━━━○━━━━━━━━━━━━━━○         │ │
│ │  Deposit        Balance        IN ESCROW      Show         Released    │ │
│ │  captured ✓     funded ✓       $40,000 🔒     Jul 18       to you      │ │
│ │  $20,000        $20,000        (gold/held)                 (—)         │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│                                                                            │
│   LEDGER                              tabular figures, aligned             │
│   Deposit (50%)        captured       Jun 02     +$20,000   in escrow      │
│   Balance (50%)        funded         Jul 11     +$20,000   in escrow      │
│   ───────────────────────────────────────────────────────────────────     │
│   Total held in escrow                                       $40,000  🔒   │
│   Platform fee (deducted at release)                          −$X,XXX      │
│                                                                            │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  ⏱  Auto-releases to you in  2d 18h  (3 days after the show)        │  │
│  │      …unless a dispute is opened in that window.   ← I-17 made real │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│   [ View contract ]        [ Open a dispute ]  ← quiet, evidence-based     │
└──────────────────────────────────────────────────────────────────────────┘

BOOKER-SIDE VIEW  ("what do I owe, and by when?")
┌──────────────────────────────────────────────────────────────────────────┐
│  ESCROW · Levitate 2026 ⇄ Aria Vale · Sat Jul 18                          │
│ ┌──────────────────────────────────────────────────────────────────────┐ │
│ │  ●━━━━━━━━━━━━━●━━━━━━━━━━━━━○                                          │ │
│ │  Deposit       Balance       Show / settle                            │ │
│ │  paid ✓        DUE Jul 11     auto-settles after                       │ │
│ │  $20,000       $20,000 ⚠      (held in escrow until release)           │ │
│ │  (held)        (amber/due)                                             │ │
│ └──────────────────────────────────────────────────────────────────────┘ │
│   ⚠ Balance of $20,000 is due Jul 11 (7 days before the show).            │
│     The show can't proceed on platform until the full amount is escrowed. │
│                                       ← I-16 made real: no ghost-on-balance│
│                       [ Fund balance — $20,000 ►  ]   ← single primary CTA │
└──────────────────────────────────────────────────────────────────────────┘

DISPUTED STATE  (either side, EscrowBalance frozen — I-18)
┌──────────────────────────────────────────────────────────────────────────┐
│  ⚠ DISPUTE OPEN · funds frozen          $40,000 held · neither released    │
│     nor refunded until resolved. Evidence window: 5 days. [ Submit evidence ]│
│     Adjudicated by showman staff (04). Status: under_review.               │
└──────────────────────────────────────────────────────────────────────────┘
```

> **What the wireframe is enforcing:** "held by Stripe" makes I-15 legible; the booker's "balance DUE before show / can't proceed until escrowed" makes I-16 legible; the artist's release countdown makes I-17 legible; the frozen-dispute banner makes I-18 legible; held-gold vs due-amber vs released-green keeps "safe" and "warning" unconfusable (§3.2); and dispute is reachable but deliberately quiet (`04`).

---

## 9. WIREFRAME — The Confirmation artifact (the peak)

**Renders:** the `Confirmed` artifact from `06` §4 — *"Aria Vale is confirmed for Levitate 2026."* This is `init-jot`'s emotional and promotional payoff and the one place we spend a real design + motion budget. It is minted **only** when the `06` §3.1 explicit-confirm gate fires (signed + funded + an authorized artist-side actor clicks Confirm — I-10). It **names the principal, not the actor** (`02`, `06` §4.1). It renders across `06`'s four surfaces; this wireframe is the canonical **in-app card** (surface 1) and the **public/promo card** (surface 4).

**Key UX decisions:**
- **It looks like a poster, not a toast.** Display/serif headline, both verified parties, the date — composed, screenshot-worthy, gorgeous in dark mode (§3.1). This is the press-kit "cool" `init-jot` asked for.
- **The verification provenance badges are the differentiator** (`06` §4.4): this isn't an unverifiable flyer, it's a *platform-attested* confirmation between two verified parties. The badges are prominent, sourced ("Verified via Spotify for Artists", "KYB-verified festival"), per `03` — never an opaque tick.
- **The confirmed accent color appears here and nowhere else** (§3.2) — scarcity makes the moment an event.
- **Motion**: the one cinematic reveal (§4) — headline + parties + date locking in, ~1s sequenced; reduced-motion gets an equally composed *still* (§9 a11y), never a degraded one.
- **Public is opt-in and mutual** (`06` §4.4): the card is private until a `role`-authorized team member flips it, and going public requires both sides' consent. The share affordance is prominent *only after* it's public.
- **The headline string is the principal**: *"Aria Vale is confirmed for…"* — never *"Jane confirmed…"*. The actor is in the audit `Event`, accessible to the team, invisible on the artifact.

```
IN-APP CONFIRMATION CARD  (surface 1 · the moment · full-bleed, dark-mode hero)
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│                            ✦  CONFIRMED  ✦       ← confirmed accent only   │
│                                                                            │
│              ░░░░░░░░░░  hero / artist imagery  ░░░░░░░░░░                   │
│                                                                            │
│            ╔══════════════════════════════════════════════╗               │
│            ║   Aria Vale                                   ║  ← display     │
│            ║   is confirmed for                            ║     serif,     │
│            ║   Levitate Music Festival 2026                ║     poster-like│
│            ╚══════════════════════════════════════════════╝               │
│                                                                            │
│     ┌─ ARTIST ───────────────────┐      ┌─ BOOKER ─────────────────────┐  │
│     │  Aria Vale                 │      │  Levitate Music Festival     │  │
│     │  ✓ Verified via Spotify    │ ⇄    │  ✓ KYB-verified festival     │  │
│     │    for Artists  (03)       │      │    · 15 yrs · 20k cap (03)   │  │
│     └────────────────────────────┘      └──────────────────────────────┘  │
│                                                                            │
│        📅  Saturday, July 18, 2026 · 9:30 PM                               │
│        📍  The Stage, Boston, MA                                           │
│        🎧  Headline · 90-minute DJ set                                     │
│                                                                            │
│        Deposit & balance held in escrow · auto-settles after the show     │
│                                                                            │
│   [ Add to calendar (.ics) ]   [ View deal ]   [ Make public ▾ ]          │
│                                            └─ opt-in · both sides consent  │
│                                                                            │
│   confirmed Jun 02, 2026 · attested by showman · audit ref #a1f...  (06)   │
└──────────────────────────────────────────────────────────────────────────┘

PUBLIC / PROMO CARD  (surface 4 · the growth loop · OG-image-optimized)
┌──────────────────────────────────────────────────────────────────────────┐
│  ░░░░  hero  ░░░░          Aria Vale                                       │
│                            is confirmed for                                │
│                            Levitate Music Festival 2026                    │
│                            Sat · Jul 18 2026 · Boston                      │
│       ✓ Verified artist        ✓ KYB-verified festival                    │
│                                                            ⟶ showman ✦     │
│   "Verify on showman · Book on showman"   (every share = trusted impression)│
└──────────────────────────────────────────────────────────────────────────┘
        ▲ private by default; this state only after mutual opt-in (06 §4.4)
        ▲ NOT a social feed — no follows/comments; share to your own channels

REDUCED-MOTION VARIANT: identical composition, rendered instantly as a still.
No information is conveyed by motion; the still is a first-class layout (§9, §4).
```

> **What the wireframe is enforcing:** the headline names the **principal** (`02`, `06` §4.1); provenance badges are sourced and prominent (`03`, `06`); the confirmed accent is unique to this surface (§3.2); the artifact is reached only via the explicit-confirm gate, so nothing here implies automation (I-10); public is mutual-opt-in and not a feed (`06` §4.4); and the ICS / "Add to calendar" reflects `06` §4.3 (ICS only ever for `Confirmed`, never holds).

---

## 10. Accessibility (WCAG 2.2 AA as the floor, not the ceiling)

Accessibility is a **trust property** here, not a checkbox: a festival or agency evaluating the platform for serious money judges polish *and* rigor, and inaccessible money UI is a liability. Targets:

- **Contrast**: WCAG 2.2 AA minimum (4.5:1 body text, 3:1 large text and UI components) in *both* light and dark modes. The confirmation card and escrow ledger are validated at AA in dark mode specifically (where they're most used/screenshotted).
- **Never state-by-color-alone** (restated from §3): every state — held, due, released, confirmed, disputed, open offer, expiring — carries an **icon + text label** in addition to its hue. The escrow gold/amber distinction in particular is validated for **color-vision deficiency** (deuteranopia/protanopia), and each still reads correctly in greyscale.
- **Motion**: `prefers-reduced-motion` honored on every animation, including the confirmation reveal (§4, §9 wireframe). **No information is ever conveyed by motion alone.**
- **Keyboard**: full keyboard operability for the entire deal flow — composing/sending an `Offer`, accepting, confirming, funding, opening a dispute. The **Confirm** action (the most important click, `06` §3.1) is fully keyboard-reachable with a clear focus state and an explicit confirmation step (no accidental commit).
- **Screen readers / semantics**: the negotiation thread is a semantic, navigable log (each `Offer` an addressable entry with direction, amount, status announced); the escrow ledger is a real table with headers; the state rail exposes the current `05` state as text. Money is announced with currency, not just digits.
- **Tabular figures + redundant labels for money**: a screen reader hears "$32,000, your offer, open, expires in 3 days," not an ambiguous number.
- **Target sizes**: WCAG 2.2 minimum touch targets (24×24 CSS px, larger for primary actions) — critical for the mobile-heavy artist/manager audience operating backstage on a phone.
- **Forms**: the pitch authoring form and offer composer have programmatic labels, inline validation tied to fields, and error messages that never reveal the floor (I-6) or blame the user (§1).

---

## 11. Trust-as-UI: the recurring patterns

A short catalog of the cross-cutting visual patterns that make Principle 1 ("trust is the visual language") concrete and consistent across every screen above:

| Pattern | What it is | Where | Sibling |
| --- | --- | --- | --- |
| **Provenance badge** | A sourced, tiered verification mark ("Verified via Spotify for Artists", "KYB-verified festival") — never an opaque tick | EPK, dossier, decision surface, confirmation card | `03`, `06` |
| **Two-zone split** | Vouched-for (trusted hue, weightier) vs. self-asserted (quiet, labeled "the artist says…") | Every EPK and dossier | `08` §2.1 |
| **Escrow state chip** | held (gold 🔒) / due (amber ⚠) / released (green ✓) / frozen (dispute) — icon + label + color | Escrow status, deal headers, confirmation footer | `04` |
| **State rail** | The deal's position on the `05` machine, always visible | Negotiation thread, deal list | `05` |
| **Explainability line** | "Verified · 12 booked on showman · responds in ~6h" — *why* this ranked / why trust this | Discovery cards, dossier | `08` §6.2 |
| **Release countdown** | "Auto-releases in 2d 18h unless disputed" — I-17 as a ticking promise | Escrow status | `04` |
| **Acting-as note** | Discreet "acting as [member]" for *your own* team's accountability — never shown to the counterparty | Thread, your-side actions | `02` (actor-vs-principal) |
| **Floor-blind copy** | Reason-free, number-free decline/nudge strings | Negotiation, decline | `05` §5, I-6 |

These patterns are the design-system primitives the eventual component library (Phase 1, `12`) should build first — they are where "trust + calm" become reusable code.

---

## 12. What this doc deliberately does not design (scope guardrails)

To stay consistent with the foundation's non-goals (`01`) and avoid relitigating owned decisions:

- **Not a social feed.** No timeline, follows, comments, or engagement surface anywhere — the public confirmation card is a shareable *artifact*, full stop (`06` §4.4, `01` non-goal). There is no "feed" screen to design because there is no feed.
- **Not the contract/legal UI internals.** The e-sign experience is the vendor's (Dropbox Sign / DocuSign — `04`/`05`); we design the *handoff* (the deal shows "out for signature" in the state rail), not the signing surface itself.
- **Not the money mechanics.** Every escrow pixel renders `04`'s state; this doc never invents a money rule or a release timing — it visualizes them.
- **Not the staff/ops console in depth.** Dispute *adjudication* tooling for showman `staff` (`04`, `11`) is its own internal surface; here we design only the *participant-facing* dispute entry/status (§8).
- **Not a final visual comp.** This is a *direction* + wireframe brief. Concrete component specs, the chosen typefaces, exact hex tokens, and a full design system are Phase-1 work (`12-roadmap-risks-open-questions.md`), built on the primitives in §11.

---

## 13. Cross-reference map

| Sibling doc | What this doc renders from it | The design contract it must honor |
| --- | --- | --- |
| [`02-domain-model.md`](./02-domain-model.md) | Ubiquitous language for every label; actor-vs-principal | Screens name **principals**, never `User`s; "acting as" is internal-only |
| [`03-trust-verification.md`](./03-trust-verification.md) | Provenance badges (sourced, tiered) | Badges show the *source* of trust, never an opaque tick |
| [`04-payments-escrow-disputes.md`](./04-payments-escrow-disputes.md) | `EscrowBalance` state, release policy, dispute entry | "Held by Stripe"; held-gold ≠ due-amber; I-15/16/17/18 made legible |
| [`05-negotiation-deal-lifecycle.md`](./05-negotiation-deal-lifecycle.md) | The state machine the thread visualizes; `Offer` chain | One open offer (I-14); acceptance ≠ confirmation; floor-blind (I-6) |
| [`06-availability-confirmation.md`](./06-availability-confirmation.md) | The `Confirmed` artifact, four surfaces, ICS, public card | Explicit-confirm only (I-10); names the principal; mutual-opt-in public |
| [`07-roster-org-rbac.md`](./07-roster-org-rbac.md) | Who may confirm / send / fund (role-gated affordances) | Actions appear only for permitted `role`s (e.g. Confirm for `owner`/`agent`) |
| [`08-profiles-pitches-discovery.md`](./08-profiles-pitches-discovery.md) | EPK, dossier, pitch form, decision surface, discovery | The two-zone rule; floor never in any UI/index (I-6); no paid placement |
| [`09-system-architecture.md`](./09-system-architecture.md) | The read/render surfaces these screens sit on | Floor not in the search index; reduced-motion + a11y are build requirements |
| [`11-gtm-liquidity-trust-safety-ops.md`](./11-gtm-liquidity-trust-safety-ops.md) | Single-player EPK as standalone press kit; confirmation growth loop | `unlisted` EPK works pre-liquidity; public card is the viral surface |
| [`12-roadmap-risks-open-questions.md`](./12-roadmap-risks-open-questions.md) | Component library + design system as Phase-1 work | §11 primitives are the first components to build |

---

## 14. Open questions (carried, not blocking)

- **Typeface selection.** §2 specifies a *direction* (one display identity + neutral grotesque + tabular money). The actual licensed faces are a Phase-1 brand decision — get it right before the confirmation card ships, since that's the screenshot surface.
- **Confirmation reveal — how cinematic is too cinematic?** §4/§9 budget a real ~1s sequenced moment. Needs a prototype to tune so it lands as *premium* and not *gimmicky*; validate with real represented-tier users. (Candidate for the `prototype` skill.)
- **Dark-mode-first vs. light-mode-first default.** Touring/night audience argues dark-first; agency/desktop triage argues light-first. Likely respect OS preference and make both flawless; confirm the *default* for unset users with `11`.
- **Public-card consent UX.** `06` §4.4 leaves the exact gating open (both opt-in vs. headline-party-must-not-object) against festival lineup-embargo conventions. The §9 wireframe assumes mutual opt-in; finalize the consent flow UX with `06`/`08`/`11`.
- **Inbound-sync conflict alert UX.** `06` §1.4/§9 raises a team alert when an external calendar block collides with a live showman `Hold`. The *surfacing* of that alert (where, how loud, what actions) is a design call shared with `06`/`07`.
- **Reputation cold-start presentation.** `08` §5.1 mandates `sample_size_note: new` be honest without penalizing. The exact visual treatment (so "new" reads as *neutral*, not *risky*) is a shared design/trust question with `08`.
- **Money-input affordance under I-6.** The offer composer (§7) shows the artist team their *own* floor as a private guide. Confirm the interaction can't leak via shared screens, screenshots in disputes, or notification previews — harden with `05`/`03`.

---

*End of 10-design-direction-ux.md — the design language and the wireframes for discovery, EPK, dossier, request+pitch, negotiation, escrow, and the confirmation moment. Renders the siblings' decisions; never redefines them. Amend `02` first for any new term, and the owning sibling for any flow change.*
