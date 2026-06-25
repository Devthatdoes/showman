# 06 — Availability & Confirmation

> Part of the **showman** foundation doc set (`docs/foundation/`). This doc owns the **calendar substrate** (`AvailabilityWindow`), the **soft-lock** that prevents double-booking (`Hold`), and the first-class **`Confirmed`** artifact ("Prince is confirmed for [event]").
>
> It does **not** redefine the entities — their canonical shapes live in [`02-domain-model.md`](./02-domain-model.md). It does **not** own the deal flow — that is the state machine in [`05-negotiation-deal-lifecycle.md`](./05-negotiation-deal-lifecycle.md); this doc plugs into it. It does **not** own money — escrow/deposit timing lives in [`04-payments-escrow-disputes.md`](./04-payments-escrow-disputes.md); here we only reference *when* a `Hold` is deposit-backed and *when* a `Deposit` is captured.
>
> **Invariants this doc owns the enforcing behavior of:** **I-9** (no double-booking), **I-10** (holds never auto-confirm), **I-11** (holds expire). It must also honor **I-12** (requests resolve to the team principal), **I-16** (balance escrowed before performance), and **I-21** (notifications fan out to the team).

---

## 0. The two hard rules this doc exists to enforce

Two requirements come straight from `init-jot` and are non-negotiable. Everything in this document is downstream of them.

> **HARD RULE 1 — No auto-accept from the calendar.** Availability is *information*, never *consent*. A free date on an artist's calendar tells a booker "this might be possible," not "you may book this." **Every booking requires an explicit confirm/deny by an authorized actor on the artist side** (a `User` holding a `Membership` with the right `role` over the `ArtistProfile` — see [`07-roster-org-rbac.md`](./07-roster-org-rbac.md)). A `Hold` *never* auto-converts to a confirmed booking, no matter how long it sits, how much deposit backs it, or whether the date is otherwise free. This is Invariant **I-10**.

> **HARD RULE 2 — No double-booking.** Two confirmed deals can never occupy the same span of an artist's time. The calendar is the single source of truth for "is this artist committed on this date," and the `Hold` mechanism makes the race between two competing bookers safe. This is Invariant **I-9**.

The tension between these two rules is the whole design problem. Rule 2 wants to *lock dates aggressively* so two bookers don't both think they have the date. Rule 1 forbids the lock from ever *becoming* the booking on its own. The `Hold` — a **tentative, time-boxed, never-auto-converting** reservation — is the resolution: it is strong enough to win the race (Rule 2) but inert enough that it can only become a booking through a human's explicit confirm (Rule 1).

---

## 1. The calendar model

### 1.1 `AvailabilityWindow` — the substrate

An `AvailabilityWindow` (defined in [`02-domain-model.md`](./02-domain-model.md) §1.2) is a span of calendar time with a **status**, belonging to one `ArtistProfile`. It is the atom of double-booking prevention. The status set is small and total:

| Status | Meaning | Can a new `Hold` attach? | Can it be `Confirmed`? |
| --- | --- | --- | --- |
| `open` | The artist is potentially bookable in this span. | Yes | Yes (via the flow below) |
| `held` | One or more `Hold`s are competing for this span. | Yes (subject to §2.3 stacking policy) | Yes — the winning hold's deal confirms |
| `blocked` | Manually or sync-marked unavailable (vacation, other commitment, blackout). | No | No |
| `booked` | A `Confirmed` `Agreement` occupies this span. Terminal for the life of that agreement. | **No** (Invariant I-9) | Already is |

> **`open` vs `held` is a derived convenience, not a second source of truth.** A window's *effective* availability is computed from `(window.status, active Holds on it, the listing's availability_policy)`. We persist `status` for query speed and integrity checks, but the authoritative answer to "is this artist free?" is always recomputed against live `Hold`s and the `availability_policy`. Never let a stale `status` flag override a live hold check — that is how double-bookings leak in.

**`AvailabilityWindow` is per-`ArtistProfile`, not per-`Listing`.** A DJ's "DJ set" listing and their "live band" listing draw from the *same body of physical time* — the human can only be in one place at once. The `Listing.availability_policy` (defined in `02`, owned in [`08-profiles-pitches-discovery.md`](./08-profiles-pitches-discovery.md)) *projects* a listing onto these windows (which windows it's bookable in, blackout rules, lead-time minimums, travel/radius constraints), but a confirmed booking on *any* listing consumes the underlying window for *all* listings. See §6 for the multi-listing collision rule.

### 1.2 What a "window" actually spans — the engagement envelope, not just stage time

A naive model treats the window as the performance slot (doors 8pm, set 10–11pm). That under-books the artist and causes real-world double-bookings. The window must represent the **engagement envelope**: travel + load-in + soundcheck + performance + load-out, plus any `availability_policy` lead-time/radius buffer. Two shows in the same city the same night might both fit; the same artist in two cities the same night does not — and the envelope, not the stage time, is what tells them apart.

For v1 we model the envelope explicitly as the window's span and let the `availability_policy` add buffers; we do **not** attempt automatic travel-time/geo conflict detection across cities (that is a Phase-2 enhancement, flagged in [`12-roadmap-risks-open-questions.md`](./12-roadmap-risks-open-questions.md)). v1's guarantee is *exact-span* conflict prevention; geo-aware soft-warnings come later.

### 1.3 Time zones, dates, and the cross-day problem

Touring is inherently multi-timezone, and "the night of the 14th" in one city can be the 15th in UTC. Rules:

- **Store every span as an absolute instant range in UTC**, plus the **IANA timezone of the venue/market** (`America/Chicago`, not a fixed offset — offsets break across DST).
- **Display and conflict-detect in the artist's relevant local context.** A festival slot that runs 23:30–00:45 is *one* engagement even though it crosses midnight; the window is one continuous instant range, never two calendar-day rows.
- **The `Pitch` (on the `BookingRequest`) supplies the venue timezone**; if absent, fall back to the artist's `home_market` timezone and flag it for confirmation.
- All ICS output (§4.3) and all "is this free?" math operate on the UTC instant range; the human-facing date is rendered from the venue timezone.

### 1.4 Where windows come from

- **Manual** — the artist or their team paints availability/blackouts directly (the single-player calendar tool that ships before any bookers exist; see [`11-gtm-liquidity-trust-safety-ops.md`](./11-gtm-liquidity-trust-safety-ops.md)).
- **Integration-synced** — a `calendar_sync` `Integration` (defined in `02`) pulls from Google Calendar / external tour calendars and writes `blocked` windows for offline commitments. Sync is **one-way inbound for blackouts by default**: showman is authoritative for showman bookings; external calendars are authoritative for "the artist is otherwise busy." We never silently push a tentative hold into someone's primary calendar — only a `Confirmed` booking emits an ICS invite (§4.3).

> **Open question (carried, see §9):** when an external calendar and a showman `Hold` disagree (artist's manager blocked a date in Google *after* a showman hold was placed), who wins? v1 policy: **showman holds are not overridden by inbound sync**; a conflicting inbound block raises a **team alert** rather than auto-releasing the hold, because releasing a deposit-backed hold has money consequences (§2.4). Resolution is a human decision, surfaced, never silent.

---

## 2. `Hold` — the soft-lock that makes the race safe

### 2.1 What a `Hold` is and is not

A `Hold` (defined in `02` §1.2) is a **tentative, time-boxed reservation** of an `AvailabilityWindow`, backing exactly one `BookingRequest`. It exists for one reason: so that while a deal is being negotiated, a *second* booker can't quietly start a parallel deal for the same date and have both sides believe they have the artist.

| A `Hold` **is** | A `Hold` **is not** |
| --- | --- |
| A soft-lock that wins the race for a date | A confirmed booking (that's a `booked` window + `Confirmed` `Agreement`) |
| Time-boxed — it always has an expiry | Permanent — there is no perpetual hold |
| Tied to one `BookingRequest` | A standalone reservation a booker can "buy" |
| Releasable on expiry/decline/cancel | Auto-promotable to a booking (Invariant **I-10** forbids it) |
| Optionally **deposit-backed** (harder) | Always free — strength varies (§2.2) |

### 2.2 Hold strength: `soft` vs `deposit-backed`

The `Hold.strength` field (from `02`) encodes two tiers, and this is where this doc meets the "money as the spam filter" thesis from [`01-vision-strategy.md`](./01-vision-strategy.md) and [`03-trust-verification.md`](./03-trust-verification.md):

- **`soft` hold** — placed when a `BookingRequest` is sent without a deposit hold. Cheap to place, easy to lose. Short expiry. Used for early-stage interest and lower-tier deals.
- **`deposit-backed` hold** — the `BookingRequest` carries an **escrowed deposit hold** (a Stripe authorization/uncaptured PaymentIntent — mechanics in [`04-payments-escrow-disputes.md`](./04-payments-escrow-disputes.md)). This requires a charge-capable payment method and real money on the line, which is precisely the anti-spam filter described in `01`/`03`. It holds *harder*: longer expiry, higher priority in the stacking policy (§2.3), and it is the only strength eligible to advance to confirmation without re-placing money.

> The deposit hold is an **authorization, not a capture.** No money leaves the booker until the deal reaches **`DepositCaptured`** — after the `Contract` is fully executed and **before** `Confirmed` (`05` state machine, `04` money flow). An expired or lost deposit-backed hold simply *voids the authorization* (Invariant **I-11**) — the booker is never charged for a hold that didn't become a booking.

### 2.3 Stacking policy — can two holds coexist on one window?

This is the central race-condition decision. Two models were considered:

- **Exclusive holds** (one hold per window at a time): simplest, but creates a denial-of-service vector — a tire-kicker places a `soft` hold and freezes a hot date for everyone until it expires.
- **Stacked holds** (multiple holds, prioritized): more complex, but resilient to griefing and closer to how real holds work in the industry (a "first hold / second hold / challenge" convention promoters already use).

**Decision: stacked, prioritized holds, with deposit-backing as the priority lever.**

- Multiple `Hold`s may attach to one `open`/`held` window. They form a **priority queue**, not a free-for-all.
- **Priority order:** `deposit-backed` always outranks `soft`; within the same strength, earlier `placed_at` wins. (This mirrors the promoter convention of "first hold" but lets a serious, money-backed booker challenge a stale soft hold.)
- Only the **top-priority hold** is eligible to advance its `BookingRequest` to confirmation. Lower holds are "in line."
- **The artist side is never forced to honor priority order.** Priority decides *who may proceed to confirm*, not *who the team must pick*. The team can confirm any one of the competing requests — Hard Rule 1 means the human always chooses. Priority only governs the *default* "you're clear to send the contract" signal and the challenge/release timers.
- When the top hold's deal `Confirmed`s, **all other holds on that window are released** and their backers notified ("the date you were holding has been booked"). Deposit authorizations on released holds are voided.

> **Anti-griefing guard:** a `soft` hold that a `deposit-backed` hold is queued behind gets a **shortened "challenge" expiry** — the soft holder is nudged ("a verified booker is waiting on this date — confirm intent or place a deposit hold within 48h"). This keeps a free hold from indefinitely blocking a money-backed one without violating Hard Rule 1.

### 2.4 Hold lifecycle and expiry

```
                       place (with BookingRequest)
   AvailabilityWindow ──────────────────────────────►  Hold: active
        (open/held)                                       │
                                                          │
        ┌─────────────────────────────────────┬──────────┼───────────────┐
        │                                      │          │               │
   expiry timer fires              request declined/   request        deal Confirmed
   (no extension)                  cancelled (05)    superseded by    on THIS request
        │                                      │     higher hold          │
        ▼                                      ▼          │               ▼
   Hold: expired                       Hold: released     ▼          Hold: promoted
   - window → open (if no              - window → open    Hold:       - window → booked
     other holds) else held             if last hold     released    - OTHER holds on
   - deposit auth voided (I-11)       - deposit auth      (challenge   window → released
   - backer notified                   voided             lost)       - their auths voided
                                                                      - all backers notified
```

**Expiry is mandatory (Invariant I-11).** Every `Hold` carries an `expires_at`. Defaults (tunable per `availability_policy`, finalized with GTM in `11`):

| Hold strength | Default expiry | Extendable? |
| --- | --- | --- |
| `soft` | 72 hours | Once, by the artist team, +72h |
| `soft` under challenge (deposit hold queued) | 48 hours | No (the challenge is the deadline) |
| `deposit-backed` | 14 days (covers a real negotiation) | Yes, by mutual extension recorded as an `Event` |

- **Expiry is event-driven**, not polled lazily: a background job (the **hold-expiry timer**, a sibling of the escrow-release job, described in [`09-system-architecture.md`](./09-system-architecture.md) §6.1) fires at `expires_at`, transitions the hold to `expired`, recomputes the window status, voids any deposit authorization, and emits the release `Event`. Lazy "check on next read" expiry is insufficient because a deposit authorization left dangling costs the booker's payment method an open auth — it must be actively released.
- **A hold cannot outlive its `BookingRequest`.** If the request is declined, cancelled, or expires in the `05` state machine, the hold releases immediately regardless of `expires_at`.
- **Expiry pauses while a deal is `out_for_signature` or `Deposit`-capturing.** On **`Accepted`** (the moment an `Offer` is accepted — beginning the `05` machine's `Accepted → Contract e-signed → DepositCaptured → Confirmed` segment), the hold enters a **`pending_confirmation` freeze**: the expiry timer is suspended so the date can't evaporate mid-signature. There is still a backstop `confirmation_deadline` (default 7 days) after which, if confirmation hasn't completed, the hold releases and the deal returns to negotiation or cancels — otherwise a stalled signature would lock a date forever.

---

## 3. How `Hold` interacts with the deal state machine (`05`)

The canonical deal state machine is owned by [`05-negotiation-deal-lifecycle.md`](./05-negotiation-deal-lifecycle.md):

```
Draft → Request sent → Offer/Counter loop → Accepted → Contract e-signed
      → Deposit captured → Confirmed → Performed → Settled → Reviewed
                                   (with Expire / Cancel / Dispute branches)
```

This doc defines the **calendar side-effects** of those transitions. The deal state machine is authoritative for the deal; the calendar reacts to it. The mapping:

| `05` deal transition | Calendar / `Hold` side-effect (this doc) | Invariant |
| --- | --- | --- |
| **Draft → Request sent** | A `Hold` is placed on the target `AvailabilityWindow`(s). Strength = `deposit-backed` if the request carries a deposit hold, else `soft`. Window → `held`. Request resolves the team principal first (**I-12**). | I-11, I-12 |
| **Offer / Counter loop** | Hold persists; `expires_at` may be extended by mutual agreement (recorded as an `Event`). A below-floor `auto_declined` offer (per `05`) does **not** by itself drop the hold — the request can still be re-offered until it expires/declines. | I-11 |
| **Accepted** | Hold enters `pending_confirmation` freeze; expiry timer suspended, backstop `confirmation_deadline` armed. | I-10, I-11 |
| **Contract e-signed** | No window status change yet. Signature ≠ booking (Hard Rule 1 still pending the explicit confirm — see §3.1). | I-10 |
| **Deposit captured** | The `Deposit` is captured into the `EscrowBalance` (`04`). Still not `booked` — capture is a money fact, not the calendar commitment. | I-16 |
| **→ Confirmed** | **The explicit confirm fires here.** Window → `booked`; the hold is `promoted`; *all other* holds on the window are released and their auths voided (**I-9**); the **`Confirmed` artifact** is minted (§4); notifications fan out to **both teams** (**I-21**). | **I-9, I-10, I-21** |
| **Performed** | No calendar change; the window stays `booked`. Triggers the post-performance **settlement window** in `04`. | — |
| **Settled / Reviewed** | No calendar change. | — |
| **Expire / Cancel / Decline (any pre-Confirmed state)** | Hold released; window recomputed to `open`/`held`; deposit auth voided. | I-11 |
| **Cancel (post-Confirmed)** | A confirmed booking cancelling is a **money + reputation event** (handled by `04` cancellation policy + `05`), and it *re-opens* the window: `booked → open`. This is a distinct, audited path — not a silent calendar edit. | I-9 |

### 3.1 The explicit-confirm gate (Hard Rule 1, mechanized)

The single most important transition above is **`Deposit captured → Confirmed`**, because that is the *only* edge that flips a window to `booked`, and **it requires an explicit human act by an authorized artist-side actor**. It cannot be reached by a timer, by the booker alone, by a fully-signed contract, or by a captured deposit. Concretely:

- The artist-side team sees a **"Confirm this booking"** action on the deal, available only once the contract is `fully_executed` and the `Deposit` is captured-or-authorized per the `04` flow.
- The acting `User` must hold a `Membership` with a `role` permitting confirmation over the `ArtistProfile` (`owner`/`agent` — matrix in [`07-roster-org-rbac.md`](./07-roster-org-rbac.md)). A `viewer` or `finance`-only member cannot confirm.
- The confirm (and a symmetric **deny**, which routes the deal to `Cancel`/back-to-negotiation) is recorded as an `Event` with `(actor, principal, role)` — full attribution per Invariant **I-2**.
- **Why a deny path matters:** even with money escrowed and a contract signed, the artist team retains the right to refuse (illness, routing conflict surfaced late, a higher offer). Denying after deposit capture triggers the deposit *refund* path in `04`. The platform never strips the artist's final say — that is the entire "aid, not replace" principle from `01`.

> **Design consequence:** the "confirm" button is the product's most important click. It is where `06` (calendar), `05` (deal), `04` (money), and `07` (authority) all converge in one authorized, audited, irreversible-by-default act. Section 4 turns that act into something worth celebrating.

---

## 4. The `Confirmed` artifact — "Prince is confirmed for [event]"

This is the payoff moment of the entire product and, per `init-jot` and `01`, a **first-class object**, not a status flag. When the confirm in §3.1 fires, the platform mints a **Confirmation** — a durable, shareable, multi-surface artifact.

### 4.1 What it is, structurally

A `Confirmation` is a derived, immutable artifact attached to a `Confirmed` `Agreement`. It is *generated from* the frozen `Agreement` terms (`02` §1.4) — it never holds its own editable copy of the deal.

| Field | Source |
| --- | --- |
| Artist (principal name + verification provenance badge) | `ArtistProfile` (`02`, `03`) |
| Event name, venue, market, date/time | `Pitch` on the `BookingRequest` (`02`, `08`) |
| Booker (principal name + verification badge) | `BookerProfile` (`02`, `03`) |
| The headline string — *"{Artist} is confirmed for {Event}"* | composed |
| Confirmation timestamp + confirming `Event` reference | audit log (`02` §1.6) |
| Public/private visibility setting | set at mint, editable by either team (§4.4) |
| Stable shareable slug/URL | minted once, permanent |

> **The artifact names the principal, not the actor.** Per `02`'s keystone rule, the card says *"Prince is confirmed for Lollapalooza 2027"* — it never says "manager Jane confirmed." The actor (Jane) is in the audit `Event`; the principal (Prince) is on the artifact. This is the actor-vs-principal split paying off exactly where it's most visible.

### 4.2 The four surfaces

The single Confirmation renders across four surfaces, all derived from the same object:

1. **The in-app confirmation page/card** — the "moment." A polished, screenshot-worthy page (design language in [`10-design-direction-ux.md`](./10-design-direction-ux.md)) showing both verified parties, the event, the date, and the verification provenance badges that make it *trustworthy*, not just pretty. This is the canonical view both teams land on.
2. **The ICS calendar invite** (§4.3) — pushed to both teams so the date lands in everyone's real calendar.
3. **Notifications** — fan-out to **both** principals' teams via `Membership` (Invariant **I-21**), across `in_app` / `email` / `push` and any `notification_sink` `Integration` (Slack for festivals/labels — the `init-jot` "run at scale" ask). See §5.
4. **The optional public/promo card** (§4.4) — the growth loop. A shareable, OG-image-friendly public page that doubles as marketing.

### 4.3 The ICS calendar invite

On confirmation, the platform generates a standards-compliant **iCalendar (`.ics`) `VEVENT`** and delivers it to both teams (email attachment + downloadable link):

- `UID` = a stable platform identifier for the `Agreement` (so updates/cancellations target the same calendar entry rather than duplicating it).
- `DTSTART`/`DTEND` = the engagement-envelope instant range (§1.2), emitted in UTC with the venue `TZID` for correct local display.
- `SUMMARY` = *"{Artist} @ {Event} ({Venue})"*.
- `DESCRIPTION` = a deep link back to the in-app confirmation page + the showman take-rate-free factual summary.
- `ORGANIZER`/`ATTENDEE` = the principals' team contacts resolved through `Membership` (Invariant I-21), respecting notification preferences.
- `SEQUENCE` increments on any post-confirmation change (reschedule, cancel) so calendars update the existing event. A **cancellation** emits a `METHOD:CANCEL` for the same `UID`.

> We **only** emit ICS for `Confirmed` bookings — never for `Hold`s. Tentative holds are deliberately kept out of people's real calendars (see §1.4); a calendar invite *means* the deal is real.

### 4.4 The public/promo card — the growth loop

This is where the most valuable instant in the booking flow becomes a marketing surface, exactly as `init-jot` imagined ("this could even be used for promotional reasons").

- **Off by default; opt-in to public.** A confirmation is **private** until a team with the right `role` flips it public. Going public requires **both** sides to consent (or at minimum the side whose name leads the headline must not have objected) — you cannot unilaterally announce someone else's booking. Announcement timing is commercially sensitive (festival lineup embargoes, exclusivity windows), so the default protects the parties.
- **When public:** a clean, branded, OpenGraph-optimized page at the stable slug — *"Prince is confirmed for Lollapalooza 2027"* — with both verified badges, designed to look great when pasted into Instagram/X/a press release. The verification provenance (`03`) is the differentiator: this isn't an unverifiable flyer, it's a *platform-attested* confirmation between two verified parties.
- **The growth mechanic:** every public card carries showman's mark and a "verify on showman / book on showman" affordance. Artists and promoters *want* to share the confirmation (it's promotion for *their* event), and each share is a verified, high-trust impression that pulls the other side of the marketplace in. The artifact that closes one deal advertises the platform to the participants in the next. This is the closest thing showman has to a viral loop, and it rides on the moment users are *most* delighted — which is why §4.1's polish budget is justified.
- **Non-goals guardrail:** the public card is **not** a social feed (a `01` non-goal). There are no follows, no comments, no engagement loop — it's a shareable artifact, full stop. Sharing happens on the user's existing social channels, not inside showman.

### 4.5 What confirmation does *not* do

- It does **not** move money on its own — `Deposit` capture is the `04`/`05` flow that *precedes* it; balance escrow and settlement come later (`04`).
- It does **not** make the platform a party to the contract — showman *generates* the artifact; the legal authority sits with the signed `Contract` and the parties (`01` non-goal, `02` authority note).
- It does **not** become editable. A confirmation is immutable; a change to the underlying deal (reschedule, cancel) creates a **new audited event** that supersedes it and re-emits the ICS with an incremented `SEQUENCE` — it never silently rewrites history.

---

## 5. Notifications & confirmation comms

Confirmation is the headline notification event, but the whole hold/availability lifecycle emits notifications. All of them obey **Invariant I-21**: a `Notification` about a principal's deal fans out to the `User`s holding a qualifying `Membership` over that principal (filtered by `role`/preference), **not** only to the actor who clicked.

| Trigger (`Event`) | Notify | Channels |
| --- | --- | --- |
| Hold placed (request received) | Artist team | in_app, email |
| Competing/deposit-backed hold challenges a soft hold | Soft-hold backer (booker team) | in_app, email, push |
| Hold expiring soon (T-24h / T-2h) | Hold backer + counterparty | in_app, push |
| Hold expired / released | Affected team(s) | in_app, email |
| Lost the date (another deal confirmed first) | Released holders | in_app, email |
| **Booking Confirmed** | **Both teams** | **in_app, email (with ICS), push, Slack sink** |
| Confirmation made public | Both teams | in_app |
| Confirmed booking rescheduled/cancelled | Both teams | in_app, email (ICS update), push, Slack sink |

- **Channels** come from `Notification` (`02` §1.6): `in_app` / `email` / `push`, plus any `notification_sink` `Integration` (Slack/email workflow). Festivals and labels coordinating many acts get the firehose into Slack; individual artists get in-app + email. Routing/preferences are per-`Membership`.
- **The confirmation notification is special-cased** as the highest-priority, never-suppressed alert (you can mute hold reminders; you cannot accidentally not-find-out that you're confirmed for a show). It carries the ICS and the deep link to the §4.1 page.

---

## 6. Double-booking prevention — the complete guarantee (Invariant I-9)

Pulling the threads together, here is the full set of mechanisms that make I-9 hold, and the edge cases each closes:

1. **Single calendar substrate per `ArtistProfile`.** All listings draw from the same `AvailabilityWindow`s, so a confirmed booking on *any* listing marks the underlying time `booked` for *all* listings. Closes the **multi-listing self-collision** (DJ set + live band same night).
2. **`booked` is closed to new holds.** Once a window is `booked`, no new `Hold` may attach and no second `Agreement` may confirm on it (the §3 transition table forbids it). Closes the **second-deal-after-confirm** case.
3. **Stacked, prioritized holds with atomic promotion.** When one deal confirms, promotion to `booked` and the release of all sibling holds happen in **one transaction**, so there is no window in which two deals both see "free." Closes the **confirm-race** (two deals reaching confirm near-simultaneously) — the database transaction + a unique constraint on `(artist, window, status=booked)` is the hard backstop; the second confirm fails and routes to "date no longer available."
4. **Holds win the *negotiation* race; confirm wins the *booking* race.** A soft/deposit hold prevents two bookers from *both negotiating in the dark*; the atomic confirm guarantees only one *wins*. The loser is notified, not silently dropped. Closes the **parallel-negotiation** case.
5. **Engagement-envelope spans, not stage-time spans** (§1.2). Conflict detection uses the full envelope, so a too-tight turnaround is caught. Closes the **back-to-back-overrun** case (within v1's exact-span guarantee; cross-city geo conflicts are the flagged Phase-2 gap).
6. **Expiry can't strand a window** (Invariant I-11). Every hold releases; no window is permanently frozen by an abandoned deal. Closes the **zombie-hold DoS** case (further hardened by the §2.3 challenge timer).

> **The one race that requires DB-level enforcement, not application logic:** two authorized actors clicking "Confirm" on two different deals for the same window at the same instant. Application checks are necessary but not sufficient. The authoritative guard is a **database uniqueness constraint** that at most one `booked` window can exist for a given artist+span, enforced inside the same transaction that promotes the hold and mints the `Confirmation`. Whichever transaction commits second fails cleanly and surfaces "this date was just booked." This is called out for [`09-system-architecture.md`](./09-system-architecture.md) to implement at the persistence layer.

---

## 7. State & status reference

### 7.1 `AvailabilityWindow.status`

```
        manual paint / sync                  hold placed
  ─────────────────────────►  open  ───────────────────────►  held
        │  ▲                    │  ▲                            │  │
   block│  │unblock        last │  │hold placed/released   confirm│  │all holds expire
        ▼  │                hold│  │                              ▼  │
      blocked              released                            booked
                                                                  │
                                              confirmed-cancel (04/05) → open
```

- `open ⇄ held` is driven entirely by whether ≥1 active `Hold` exists.
- `→ booked` is reachable **only** through the explicit-confirm gate (§3.1).
- `booked → open` happens **only** via an audited post-confirmation cancellation (`04`/`05`), never a silent edit.
- `blocked` is orthogonal: a manually/sync-blocked window accepts no holds and cannot be booked.

### 7.2 `Hold` lifecycle states

`active → { expired | released | pending_confirmation → promoted }`

- `active` — counting down to `expires_at`; in the §2.3 priority queue.
- `pending_confirmation` — deal `Accepted`; expiry frozen, `confirmation_deadline` armed.
- `promoted` — its deal `Confirmed`; window now `booked`. Terminal-success.
- `expired` — timer fired; deposit auth voided. Terminal.
- `released` — request declined/cancelled, or lost a challenge/confirm race; deposit auth voided. Terminal.

---

## 8. Worked examples

**A. The clean confirm (happy path).**
A festival's talent buyer sends a `deposit-backed` `BookingRequest` for a mid-tier artist for July 14. A `deposit-backed` `Hold` attaches; the July-14 envelope window → `held`. Two rounds of `Offer`/counter (`05`). Accepted → hold freezes (`pending_confirmation`) → contract e-signed → **`DepositCaptured`** (deposit captured, `04`). The artist's manager (an `agent`-role `Membership`) clicks **Confirm**. In one transaction: window → `booked`, hold → `promoted`, `Confirmation` minted, ICS sent to both teams, Slack + email + push fan-out to both teams (I-21). The festival opts the card public a week later (both sides consent); the *"[Artist] is confirmed for [Festival] 2027"* page goes live and gets shared.

**B. Two bookers, one date (the race).**
Booker A places a `soft` hold on Sept 2; Booker B, a verified festival, places a `deposit-backed` hold the next day. B outranks A (§2.3). A's hold goes under **challenge** (48h shortened expiry); A is nudged to place a deposit or confirm intent. A doesn't; A's hold expires. B negotiates and confirms. Had A *also* moved to a deposit hold and the team preferred A, **the team could still confirm A** — priority governs the default "clear to proceed," not the human's choice (Hard Rule 1). Whoever loses gets the "date booked / hold released" notification, auth voided.

**C. Signed contract, then the artist denies.**
A deal reaches `Deposit captured`, but the artist's manager discovers a routing conflict and clicks **Deny** instead of Confirm. The window never reaches `booked`. The deal routes to `Cancel`; the deposit refunds per `04`. The artist's right of final refusal is preserved even post-signature — this is the "aid, not replace" principle, enforced by Hard Rule 1.

**D. Abandoned negotiation.**
A `soft` hold sits for 72h with no progress; the timer fires, the hold expires, the window recomputes to `open` (or `held` if another hold remains), and any deposit auth (none here) is voided. The booker is notified the hold lapsed. The date is free for the next request — no zombie lock (I-11).

---

## 9. Open questions (carried, not blocking)

- **Inbound-sync vs. live-hold conflict.** When an external `calendar_sync` block lands on a date that already has a showman `Hold`, v1 raises a team alert rather than auto-releasing (§1.4). Confirm this policy and the alert UX with [`07-roster-org-rbac.md`](./07-roster-org-rbac.md) and [`10-design-direction-ux.md`](./10-design-direction-ux.md).
- **Cross-city geo/travel conflict detection.** v1 guarantees exact-span conflict prevention only; travel-time-aware soft warnings (two cities, same night) are deferred to Phase 2 — tracked in [`12-roadmap-risks-open-questions.md`](./12-roadmap-risks-open-questions.md).
- **Hold expiry defaults & challenge windows.** The §2.4 durations (72h soft, 14d deposit-backed, 48h challenge) are starting values; tune against real funnel data with [`11-gtm-liquidity-trust-safety-ops.md`](./11-gtm-liquidity-trust-safety-ops.md).
- **Public-card consent model.** §4.4 requires mutual consent to publish; the exact gating (both must opt-in vs. headline-party-must-not-object) needs a product call, especially against festival lineup-embargo conventions — revisit in `08`/`11`.
- **Group/multi-artist holds.** When a booker requests several artists from one `Org` "together" (the `02` §6 / `07` open question), do their holds expire/confirm independently or as a bundle? v1: independent holds, co-routed via I-12. A bundled all-or-nothing confirmation is a Phase-2 candidate — flagged in `07` and `12`.
- **Reschedule semantics.** A confirmed booking that moves dates: does the original window release atomically with the new one booking (an atomic swap), and what does that do to a competing hold on the new date? Specify alongside the `04`/`05` cancellation/reschedule policy.

---

*End of 06-availability-confirmation.md. Calendar substrate, the `Hold` soft-lock, and the `Confirmed` artifact. Entities are defined in `02`; the deal flow is owned by `05`; money timing by `04`. Amend `02` first for any new term.*
