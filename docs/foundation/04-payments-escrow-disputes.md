# 04 — Payments, Escrow & Disputes

> **Scope.** How money moves through a deal: deposit and balance held as escrow, auto-release after the show, and the dispute path when something goes wrong. The mechanism that the domain model (`02-domain-model.md`) deliberately left as "shapes only" lives here.
>
> **The one sentence to remember:** *showman never custodies funds. Stripe is the regulated money-transmitter; showman owns the **release policy** and the **dispute adjudication** on top of Stripe's custody.* That split is the whole design — buy the regulated rail, build the trust logic.
>
> **Reads this doc presupposes:**
> - `01-vision-strategy.md` — the take-rate model, the two canonical failures we exist to solve (booker ghosts after deposit; artist trapped by a false dispute), and the explicit non-goals (not a money transmitter, not an escrow agent on our own license, not a law firm).
> - `02-domain-model.md §1.5` — the entity shapes for `Deposit`, `EscrowBalance`, `Payment`, `Payout`, `Dispute`, and the `Agreement` they hang off. This doc does **not** redefine those; it specifies their mechanism and lifecycle.
> - `05-negotiation-deal-lifecycle.md` — the **deal state machine** (`Draft → … → Confirmed → Performed → Settled → Reviewed`, with `Expire / Cancel / Dispute` branches). The payment/escrow state machine in §7 of this doc is a **subordinate** machine that hangs off specific deal states. Where they touch is called out explicitly.

---

## 0. The thesis: escrow without an escrow license

The represented tier transacts on a fixed rhythm (grounded in `01`): **~50% deposit secures the date → balance paid before/at the show → settlement after.** Trust today is established out-of-band (reputation, the agent's relationship, the contract sitting in someone's inbox). showman's job is to put a neutral, funded escrow in the middle of that rhythm **without becoming a regulated money-services business.**

Holding other people's money pending a condition is, in most jurisdictions, **money transmission and/or escrow** — both heavily licensed (state-by-state MTLs in the US, FinCEN registration, bonding, etc.). A solo founder cannot and should not acquire that license to ship a v1. The entire payments design is therefore organized around a single constraint:

> **showman must never be the entity that holds, owns, or controls customer funds.** Every dollar that looks like "escrow" to a user must legally be **held by Stripe** under Stripe's licenses, in a state where showman *orchestrates* but does not *custody*.

Stripe Connect makes this possible with two primitives used together:

1. **Separate Charges and Transfers** — money comes in (a charge on the booker) and money goes out (a transfer to the artist's connected account) as **two decoupled operations**. The charge can land in the **platform's Stripe balance** and sit there, undirected, until showman decides where it goes. The funds are in Stripe's custody the entire time.
2. **Delayed / manual payouts** — connected accounts can be configured so that funds do **not** automatically pay out to the artist's bank. Payout timing is controlled by showman (manual payout schedule) or simply by *not transferring* until release. Stripe documents holds of **up to ~90 days** before a transfer must be made — comfortably longer than our deposit→settlement window, which is days-to-weeks.

Held between "charge captured" and "transfer + payout executed," the money is **escrow in economic substance and Stripe-custodied in legal substance.** That is the trick, and it is a well-trodden Connect pattern, not a hack.

> **Legal flag (not legal advice).** This design *reduces* showman's money-transmission exposure by routing custody through Stripe; it does not provably *eliminate* it, because "control" can be read broadly. Before real money flows, get a fintech/payments lawyer to confirm (a) Stripe Connect's Terms cover this flow-of-funds for our model, (b) showman is a "platform"/"marketplace" not a "money transmitter" under the relevant tests, and (c) the take-rate deduction mechanism (§5) is structured cleanly. This is the single most important external review item in the foundation; it is also carried in `12-roadmap-risks-open-questions.md`.

---

## 1. Why this exact flow solves the two canonical failures

`01-vision-strategy.md` names two failures that the represented tier suffers today and that no incumbent solves. The escrow flow is engineered backwards from them.

### Failure A — "the booker ghosts after the deposit"
*The classic: deposit secures the date, the act shows up and plays, and the balance never arrives. The artist has performed and is now chasing money over email.*

**Solution: the balance is escrowed _before_ the performance, not after.** showman does not let a deal reach the stage where the artist takes the stage on an unfunded promise. The `EscrowBalance` must be **fully funded (deposit + balance both captured into Stripe)** before the show date, gated by a hard pre-show deadline. If the balance is not escrowed by the deadline, the deal does not proceed to a funded `Performed` state and the booker — not the artist — bears the cancellation consequence. The artist never performs against an IOU.

### Failure B — "the artist is trapped by a false dispute"
*The mirror image: the act performs as agreed, and the booker manufactures a dispute (or simply refuses to confirm) to claw back escrowed funds or stall the payout indefinitely. On platforms with open-ended, manual dispute queues (the Airbnb critique), an artist can be held hostage by backlog.*

**Solution: funds auto-release to the artist unless an evidence-backed dispute lands inside a fixed window.** The default is **release, not hold.** After the show, a short **settlement window** opens (default **72 hours** — see §6). If no `Dispute` is opened in that window, the `EscrowBalance` **auto-releases** to the artist with no human in the loop. The booker cannot trap funds by inaction — silence pays the artist. To stop the release, the booker must take an affirmative, costly, evidenced action inside the window. Inertia favors the party who already delivered.

> These two are mirror images of the same principle: **make the default outcome favor whichever party has already kept their end.** Pre-show, the unfunded party (booker) must act to proceed → protects the artist from ghosting. Post-show, the delivered party (artist) is paid by default → protects the artist from a false dispute. The booker's protection is symmetric and lives in the *pre*-show half: their deposit isn't released until the artist actually performs.

---

## 2. The money flow, end to end

This mirrors the industry rhythm (`01`) one-to-one. Amounts use the domain entities from `02 §1.5`.

| Industry step | showman mechanism | Stripe primitive | Entity state |
|---|---|---|---|
| **Deposit secures the date** (~50%) | At **`DepositCaptured`** (after the `Contract` is fully executed, **before** `Confirmed`), capture the deposit from the booker into platform balance | `PaymentIntent` (capture); funds sit in platform Stripe balance, **no transfer yet** | `Deposit` captured → `Payment{purpose: deposit}` → funds `EscrowBalance` (`holding`) |
| **Balance due before the show** | Before a hard pre-show deadline, capture the remaining balance | Second `PaymentIntent`; funds join the held pool | `Payment{purpose: balance}` → `EscrowBalance` now **fully funded** |
| **Performance happens** | Show date passes; settlement window opens | (none — a timer, not a money move) | deal `Performed`; `EscrowBalance` release-eligible-at = show_end + window |
| **Settlement after** | Auto-release after the window, less take rate, **unless** a `Dispute` froze it | `Transfer` to artist connected account + `Payout` to their bank; `application_fee`/separate transfer carves the take rate | `Payout` drains `EscrowBalance` (`released`); deal `Settled` |

ASCII view of the happy path:

```
 BOOKER                         STRIPE (custody)                    ARTIST SIDE
   |                                  |                                  |
   |  deposit (≈50%) @ DepositCaptured|                                  |
   |--------------------------------->|  EscrowBalance: holding          |
   |                                  |   (deposit captured)             |
   |  balance, before pre-show cutoff |                                  |
   |--------------------------------->|  EscrowBalance: fully funded     |
   |                                  |   (deposit + balance)            |
   |                                  |                                  |
   |             === SHOW DATE / Performed ===                           |
   |                                  |                                  |
   |   [72h settlement window]      |  release_pending                 |
   |                                  |                                  |
   |   no in-window Dispute  ───────► |  Transfer + Payout (− take rate) |
   |                                  |--------------------------------->|  funds land
   |                                  |  EscrowBalance: released         |  (Settled)
```

**Key property:** the artist never crosses the "performed" line until the **balance is already in Stripe's custody**. The booker never has funds released until the artist has **performed and the window has elapsed without a valid dispute**. Neither side is ever exposed on an unfunded promise.

---

## 3. Where the money physically sits (Connect topology)

A precise statement, because "escrow" is doing legal work here.

- **Charge target.** Deposit and balance charges are taken **on the platform** (destination-less / separate-charges model), so funds land in **showman's Stripe platform balance** and are *not* yet allocated to any connected account. This is what makes the hold a hold: an undirected charge sitting in Stripe.
- **Custody.** Those funds are in **Stripe's** possession under Stripe's licenses. showman has an *instruction* relationship with Stripe, not a *custody* relationship with the user. showman's own bank account is never the resting place of deal money.
- **Release.** On release, showman creates a **Transfer** to the artist-side connected account (resolved via the managing `Org` or the self-managed `ArtistProfile` — see "payee resolution honors actor-vs-principal" in `02 §1.5`), then funds **Payout** to their bank per the account's payout schedule.
- **Refund.** On a refund outcome, showman **refunds the original charge(s)** back to the booker's card/source rather than transferring out. No transfer ever occurs.

### 3.1 Connect funds segregation (evaluate, don't depend on for v1)

Stripe has been previewing/rolling out **funds-segregation / "separate financial accounts"** features that let a platform hold balances in a more clearly ring-fenced way (distinct holding accounts per purpose, clearer "these funds are not the platform's operating money" semantics). This is attractive for an escrow narrative — it strengthens the "showman is not commingling, not controlling" story and helps the money-transmission analysis.

**Decision for v1:** *Design the ledger so segregation is a config swap, not a rewrite, but do not block v1 on it.* The core escrow property (separate charges + delayed payout) already works on standard Connect. Treat segregation as a **hardening upgrade** to pursue once volume justifies the lawyer time, and as a talking point in the compliance review. Track it in `12`.

> **Ledger principle regardless of segregation:** showman keeps its **own** authoritative ledger (the `EscrowBalance` object + `Event` log from `02`) that mirrors Stripe's state. We **never** infer "is this deal funded / released / refunded" from live Stripe API reads at decision time; we read from our ledger, which is reconciled against Stripe via webhooks (§8). Stripe is the custodian and source of truth *for cash*; our ledger is the source of truth *for policy*.

---

## 4. Build-vs-buy for v1: pure Stripe primitives vs. a Trustap-style escrow service

The blueprint's locked build-vs-buy is **hybrid** (`01`): buy regulated rails, build trust logic. Within payments specifically there is a *second-order* choice, because a vendor exists that bundles **escrow + dispute resolution** as a service.

| | **Option A — Pure Stripe Connect primitives** (separate charges/transfers + delayed payouts; showman builds the escrow ledger, release timers, and dispute flow) | **Option B — Trustap-style escrow+dispute service** (a vendor that holds funds and runs the dispute process behind an API) |
|---|---|---|
| Money-transmission custody | Stripe (already our rail) | The escrow vendor (a *second* regulated custodian) |
| Escrow-release policy | **Built by showman** (the moat) | Vendor's policy, with limited tuning |
| Dispute adjudication | **Built by showman** (the moat) | Vendor adjudicates (faster to ship, less control) |
| Speed to v1 | Slower — we build the state machine + ops | Faster — buy the whole escrow+dispute box |
| Control over the "tightened Airbnb" UX | Total | Constrained to the vendor's flow |
| Strategic fit | Escrow-release policy + dispute flow are **explicitly named as things showman builds** in the locked decisions | Outsources the two pieces the blueprint says are the moat |
| Fee stacking | One take rate over Stripe fees | Stripe-equivalent fees **plus** the escrow vendor's cut → squeezes our 8–12% take (`01`) |
| Integration surface | One vendor (Stripe), one webhook source | Two money vendors to reconcile, two failure modes |

**Decision for v1: Option A — pure Stripe Connect primitives.** Reasons, in order:

1. **The locked decisions already chose this.** "Build in-house: the deal state machine, escrow-release policy, … and the dispute flow" (`01`, blueprint §"Locked decisions"). Buying Trustap would outsource exactly the trust logic identified as the moat.
2. **Margin.** A second money vendor stacks fees onto an 8–12% take rate that already shares the gross with the agent's separate ~10% (`01`). We cannot afford a third hand in the pot.
3. **One reconciliation surface.** Two custodians = two ledgers to reconcile and two webhook ecosystems. The escrow ledger is hard enough with one source of truth.
4. **Control over the tightened dispute UX.** The product differentiator in §6 (fixed window, structured outcomes, default-release) requires owning the flow. A vendor's generic dispute box won't enforce our windowed, default-favors-the-performer policy.

**What we give up:** speed, and we have to build adjudication ops (queues, SLAs, appeals — co-owned with `11-gtm-liquidity-trust-safety-ops.md`). That is acceptable because dispute volume at beachhead scale is low and *manual adjudication is fine at low volume* (`11`). **Revisit trigger:** if dispute volume outgrows solo/manual adjudication before we can staff ops, reconsider Option B for the *adjudication* piece only — but keep Stripe custody. Carried in `12`.

---

## 5. The take rate, mechanically

`01-vision-strategy.md` sets the **policy** (target ~8–12% all-in, split across both sides, on gross booking value, leaving the agent's ~10% intact). This doc owns the **mechanism**.

- **When deducted:** at **release**, not at charge. The booker is charged the full agreed amount (deposit then balance); the take rate is carved out of the **transfer to the artist** (and/or surfaced as a separate line to the booker per the final split decided in `11-gtm-liquidity-trust-safety-ops.md`). Deducting at release keeps the math clean on refunds — if a deal refunds, no take has been transferred out, so there is nothing to unwind.
- **How, in Stripe terms:** either an **`application_fee_amount`** on the flow, or by **transferring less than the held total** to the artist (the difference is showman's revenue, retained in the platform balance). The second is the natural fit for separate charges/transfers and is the v1 default.
- **On partial outcomes:** for a `resolved_split` dispute (§6), the take rate is applied **only to the portion released to the artist**, pro-rata. Refunded portions carry no take.
- **No pay-to-pitch, no upfront supply fees** (`01`): revenue exists **only** on confirmed, escrowed, released bookings. If nothing releases, showman earns nothing. This is the alignment property — we get paid when value is created, not before.

---

## 6. The dispute model — Airbnb Resolution Center, tightened

The reference point is Airbnb's **Resolution Center**; the explicit design goal is to fix its documented failure modes (backlog, inconsistency, open-ended timelines, ambiguous outcomes). The `Dispute` entity shape lives in `02 §1.6`; this is its **flow and policy**.

### 6.1 The four tightenings

1. **Fixed evidence window.** A dispute can only be opened during the post-show **settlement window** (default **72h** after show end). Outside it, the deal is `Settled` and immutable. This single rule is what makes auto-release safe and kills the "held hostage by an indefinitely-open ticket" failure. *(Tunable per `Listing`/risk tier; never unbounded.)*
2. **Structured, enumerated outcomes — not free-form mediation.** Every dispute resolves to exactly one of: `resolved_release` (full to artist), `resolved_refund` (full to booker), or `resolved_split` (a stated percentage). These map 1:1 to the `Dispute.state` enum in `02`. No vague "we'll work it out" — the adjudicator picks a defined outcome that the escrow ledger can execute deterministically.
3. **Platform adjudication on policy, not law.** showman adjudicates the **escrow/fund outcome** under **platform policy**, explicitly *not* legal liability (a non-goal in `01`). We decide who gets the held money; we do **not** rule on breach-of-contract damages. Decisions cite the policy rule applied, for consistency and appeal.
4. **Evidence-backed by construction.** Opening a dispute **requires** a reason code (enum) and at least one evidence attachment. Reason-code + evidence is mandatory; an empty dispute cannot be filed. This raises the cost of a frivolous/false dispute (Failure B) and gives the adjudicator something concrete.

### 6.2 Dispute lifecycle

```
            (post-show settlement window OPEN)
                          |
            booker or artist opens Dispute
            (reason code + evidence REQUIRED)
                          |
                          v
   EscrowBalance: frozen_by_dispute  ── auto-release timer CANCELLED
                          |
                Dispute: open
                          |
        counterparty rebuttal window (e.g. 48h, evidence)
                          |
                Dispute: under_review  (platform staff)
                          |
        +-----------------+------------------+----------------+
        v                 v                  v                v
 resolved_release   resolved_refund    resolved_split     escalated
   (full→artist)     (full→booker)    (pct split exec)   (senior review
        |                 |                  |             / external)
        v                 v                  v                |
  Transfer+Payout    Refund charges    Transfer part +        v
  (− take rate)      to booker         Refund part         re-enters at
        |                 |            (take on released)   under_review
        v                 v                  v             with outcome
   EscrowBalance:    EscrowBalance:    EscrowBalance:
     released          refunded          released
        \________________ | ________________/
                          v
                  deal: Settled / Cancelled
                  Dispute outcome → ReputationScore (dispute rate)
```

- **Freeze, then resolve.** Opening a dispute moves `EscrowBalance` to `frozen_by_dispute` and **cancels the auto-release timer**. Funds stay in Stripe custody (no transfer, no refund) until adjudication. The artist's default-release is paused *only* by a real, evidenced, in-window dispute.
- **Bounded throughout.** Rebuttal window and adjudication SLA are time-boxed (the anti-backlog fix). Escalation is a defined state (`escalated`), not an informal "this got messy."
- **Outcomes feed reputation.** Every resolution updates the `ReputationScore` dispute rate (`02`), so chronic false-disputers and chronic non-performers surface over time — the long-run defense against gaming the window.

### 6.3 Edge cases the policy must name (decided here, refined with ops in `11`)
- **No-show by artist** → `resolved_refund` to booker (deposit + balance returned); reputation hit to artist.
- **Partial performance** (showed up, short set / technical failure) → typically `resolved_split`; the structured % is the adjudicator's lever.
- **Booker cancels pre-show** → governed by the `Agreement`'s **cancellation policy** (terms frozen at acceptance, `02`), executed as a deposit-forfeit / partial-refund schedule — handled by the *cancellation* path in `05`, not the dispute path.
- **Balance never escrowed by the pre-show cutoff** → not a dispute; it's a **funding failure** that prevents `Performed` (Failure A defense). The deal cancels against the booker per the cancellation policy.

---

## 7. Payment / escrow state machine (subordinate to the deal state machine in `05`)

The deal state machine in `05-negotiation-deal-lifecycle.md` is authoritative for the *deal*. This is the **money** machine that hangs off it. Each escrow transition is pinned to the deal state that triggers it, so the two never drift.

```
 DEAL STATE (from 05)            ESCROW / PAYMENT STATE (this doc)         TRIGGER
──────────────────────────────────────────────────────────────────────────────────
 Accepted                        (no money yet)                            offer accepted
        │  contract e-signed (Agreement fully_executed)
        ▼
 DepositCaptured ─────────────►  EscrowBalance: holding                    capture Deposit
        │                         (deposit captured, Stripe custody)        (Payment:deposit)
        │  explicit artist-side Confirm
        ▼
 Confirmed                       (artifact lights up; window → booked)      (no money move)
        │
        │  pre-show balance cutoff reached
        ▼
 (still Confirmed) ────────────►  EscrowBalance: fully_funded               capture Balance
                                                                            (Payment:balance)
        │                         ── if balance NOT captured by cutoff ──►  FUNDING FAILURE
        │                            → cancel vs booker (Failure A guard)
        ▼
 Performed ───────────────────►  EscrowBalance: release_pending            show_end reached;
                                  (settlement window timer running)        72h window opens
        │
        ├── no in-window Dispute ─────►  release_pending ──► released       AUTO-RELEASE
        │                                Transfer+Payout (− take rate)       (timer fires)
        │                                        │
        │                                        ▼
        │                                 DEAL: Settled
        │
        └── Dispute opened in-window ─►  EscrowBalance: frozen_by_dispute   timer CANCELLED
                                                 │  (adjudication, §6)
                                                 ▼
                         ┌───────────────────────┼───────────────────────┐
                         ▼                        ▼                       ▼
                 resolved_release         resolved_refund          resolved_split
                 → released               → refunded               → released (partial)
                 Transfer+Payout          Refund to booker         Transfer + Refund
                 (− take rate)            (no take)                (take on released part)
                         │                        │                       │
                         ▼                        ▼                       ▼
                   DEAL: Settled            DEAL: Cancelled          DEAL: Settled
```

**Escrow states (canonical, from `02 §1.5`):**

| State | Meaning | Money location | Set by |
|---|---|---|---|
| `holding` | Deposit captured, balance not yet | Stripe platform balance | `DepositCaptured` (deposit capture, pre-`Confirmed`) |
| `fully_funded`¹ | Deposit + balance both captured | Stripe platform balance | balance capture before cutoff |
| `release_pending` | Performed; settlement window running | Stripe platform balance | `Performed` (window opens) |
| `released` | Transferred + paid out to artist | Artist connected account / bank | auto-release **or** `resolved_release`/`resolved_split` |
| `refunded` | Returned to booker | Booker's original source | `resolved_refund` (or full pre-show cancel) |
| `frozen_by_dispute` | In-window dispute opened; timer cancelled | Stripe platform balance | `Dispute` opened |

¹ `fully_funded` is a **canonical `EscrowBalance` state** in `02 §1.5` — surfaced explicitly because the **balance-escrowed-before-show** invariant (Failure A) is the whole point. Implementation may physically model it as `holding` + an `is_balance_captured` flag or as a distinct state; either is fine as long as "fully funded before `Performed`" is enforceable.

**The two load-bearing invariants** (these are *correctness* properties, not nice-to-haves):
- **INV-1 (Failure A):** a deal cannot transition to `Performed` unless `EscrowBalance` is `fully_funded`. No performance against an unfunded balance, ever.
- **INV-2 (Failure B):** from `release_pending`, the **only** thing that stops auto-release is a `Dispute` opened *inside* the window. Inaction → release. (Cross-check with `06-availability-confirmation.md`: the post-show settlement window and the artifact's "show happened" signal feed this timer.)

---

## 8. Webhooks, idempotency & reconciliation (the unglamorous correctness layer)

Money correctness is mostly about not double-acting and not drifting from Stripe.

- **Stripe is the cash source of truth; our ledger is the policy source of truth.** State changes are driven by **Stripe webhooks** (`payment_intent.succeeded`, `charge.refunded`, `transfer.created`, `payout.paid`, `charge.dispute.created`, etc.), not by optimistic client responses. The `Event` log in `02` records every transition for audit and reconciliation.
- **Idempotency everywhere.** Every charge/transfer/refund uses a Stripe **idempotency key** derived from the `Agreement` + purpose (e.g. `agreement:{id}:capture:balance`). Webhook handlers are idempotent on Stripe event id. A re-delivered webhook or a retried timer **must not** double-charge, double-release, or double-refund. (Architecture-level treatment of idempotent payment webhooks is in `09-system-architecture.md`.)
- **The release timer is a background job, not a request.** Auto-release is a scheduled job keyed off `EscrowBalance.release_eligible_at`. It re-checks ledger state at fire time (still `release_pending`? no open dispute?) before transferring — so a dispute that landed a minute before the timer wins.
- **Reconciliation.** A periodic job diffs our ledger against Stripe balances/transfers and flags any divergence for ops. We never let the two silently drift.

---

## 8b. Chargeback & direct-liability posture

### Two distinct liabilities — lead with the distinction

**In-platform `Dispute` (artist↔booker):** showman exclusively directs *escrowed* funds it already holds in Stripe custody. Freeze on dispute (`I-18`); never release before the **settlement window** (`I-17`). Outcomes move held funds under platform policy, not legal liability (the not-a-law-firm non-goal from `01`). **Zero direct cost to showman** — operational only.

**Card chargeback (booker's bank, bypasses the Resolution Center):** under separate charges & transfers, showman is [merchant of record and ultimately liable](https://docs.stripe.com/connect/marketplace/tasks/refunds-disputes). This is the **only path that can reach company capital**.

### The structural trap

A cardholder has [up to 120 days (Visa/MC; ~540 in edge cases)](https://www.clear.sale/blog/what-is-the-time-limit-on-chargebacks) to file a chargeback. Our `EscrowBalance` releases ~72h post-show (the **settlement window**). A booker can be paid-out-to-artist and then claw back months later.

Account-type re-routing does not fix this. "Standard account → connected account liable" applies only to *direct charges*. Under separate charges & transfers, the charge is on the platform, so showman is liable regardless — exactly the [liability profile for this charge structure](https://docs.stripe.com/connect/disputes). The same Custom/Express account control that makes escrow-hold possible is what creates the platform-side liability. There is no routing trick that buys the control without the liability.

### The defense — a layered cascade; company capital is the never-reached last resort

Run the layers in order. The goal is that company capital is never reached in practice.

1. **Artist-first debit.** Stripe [debits the artist (connected account) first](https://docs.stripe.com/connect/disputes); only if the connected account balance is insufficient does it hit the platform. Keep the artist's balance funded so the debit lands there.
2. **Release-with-reserve.** Hold a rolling reserve on the artist's `Payout` via [Stripe Connect connected-account reserves](https://docs.stripe.com/connect/connected-account-reserves), sized to chargeback exposure. Recoverable without touching company money.
3. **Transfer reversal (+ pending transfer reversals).** Claw back from the artist via [transfer reversal](https://docs.stripe.com/connect/pending-transfer-reversals). If the artist has no balance now, Stripe holds it pending and auto-recovers from future earnings — repeat artists self-fund the clawback.
4. **Stripe Chargeback Protection.** [~0.4% per eligible transaction, caps reimbursement at $25,000, works with Connect (with limitations)](https://www.horizon-labs.co/resources/managing-refunds-chargebacks-disputes-with-stripe-connect) — Stripe absorbs eligible disputed amounts. Fold the 0.4% into the **take rate**; the merchant absorbs the fee but not the disputed charge.
5. **Win with evidence.** KYC'd booker + signed `Contract` + `Confirmed` artifact + delivery evidence = strong representment evidence. A won chargeback costs nothing.
6. **Take-rate float reserve.** Carve a small reserve from the take rate on every released deal so the platform's collective fees absorb rare residuals — not company capital.

### Recommended v1 posture (decided)

- **Release-with-reserve**, not full release: hold a connected-account reserve sized to chargeback exposure on every `Payout`.
- **Enable Stripe Chargeback Protection** and price the 0.4% into the take rate — Stripe absorbs eligible disputed amounts, the cost is predictable and manageable at beachhead volume.
- **Delay release / require stronger funding for first-time or high-risk bookers** (KYB depth per `03`; see also OQ-3).
- Keep in-platform `Dispute`s strictly about escrowed funds and platform policy (`§6`); never conflate them with card chargebacks.

**Net property:** company capital is the last-resort backstop that, in practice, is never reached — every layer (artist debit, reserve, transfer reversal, Chargeback Protection, representment win, float reserve) drains first.

**The failure mode to avoid:** releasing escrow with no reserve and no Chargeback Protection enabled.

> **⚖️ Flag.** The precise liability and money-transmission structure here — in particular how merchant-of-record exposure interacts with the platform's regulatory posture — is the `M6`/`OQ-4-LEGAL` counsel gate. [Risk/liability by account control level](https://docs.stripe.com/connect/risk-management) is the Stripe reference to bring to counsel. This section is the architecture to review with counsel, not a substitute for that review.

---

## 9. Regulatory & financial-edge items (flag, don't hand-wave)

| Item | Position | Owner / where it's resolved |
|---|---|---|
| **Money transmission** | **Offloaded to Stripe** via Connect (separate charges/transfers + delayed payouts; §0, §3). showman orchestrates, Stripe custodies. *Still requires a payments-lawyer sign-off that our specific flow-of-funds and take-rate carve don't tip us into "control."* | Counsel review pre-launch; `12` |
| **1099 / tax reporting** | Payouts to artist-side connected accounts are **income to the payee**. Stripe Connect handles **1099-K**/equivalent issuance for connected accounts (Stripe is the payer-of-record on the rail). showman must ensure connected-account **tax onboarding** (TIN/W-9 collection) is part of Stripe Identity/Connect onboarding (see `03-trust-verification.md` for KYC/KYB onboarding). showman's *own* revenue (the take rate) is showman's income, separately. | Connect tax onboarding; finance |
| **Refunds** | Modeled as **refund of original charge(s)** to the booker's source, never a transfer. Take rate is deducted at release, so refunds need **no take-unwind** (§5). Card-network refund windows and partial-refund mechanics are Stripe's; our ledger mirrors them. | §5, §6; Stripe |
| **Card chargebacks (distinct from our `Dispute`)** | A card-network dispute initiated at the booker's bank — bypasses the Resolution Center entirely; showman is merchant of record and ultimately liable under separate charges & transfers. Full posture: **§8b**. A platform `Dispute` and a card `chargeback` are different objects (`02` glossary; `§8b` explains the structural difference). | §8b; `09` (evidence retention); risk register in `12` |
| **Connect funds segregation** | Evaluate as a **hardening upgrade** to strengthen the non-custody story; not a v1 blocker (§3.1). | §3.1; `12` |
| **Cross-border / FX** | Artists and bookers in different countries → Connect cross-border payouts + FX. **Out of scope for the beachhead** (`11` seeds one scene/genre/city). Flagged so the ledger/account model doesn't bake in single-currency assumptions. | `12` |

> **The chargeback line is the one that can actually lose money.** Everything else is policy; a post-release chargeback is real downside. The layered defense (§8b) is designed so company capital is never the first payer — but underwrite the residual; don't assume it's zero.

---

## 10. Open decisions carried forward

These are unresolved here on purpose; they're owned downstream (and tracked in `12-roadmap-risks-open-questions.md`).

- **Settlement window length** — 72h is the default proposal; final value (and whether it varies by deal size / risk tier) is set with ops in `11` (`12` OQ-8).
- **Take-rate split & whether it's surfaced to the booker** — policy in `01`, final split/tiering in `11`. This doc only fixes *when/how* it's deducted (at release).
- **E-sign vendor** (Dropbox Sign vs DocuSign vs build-minimal) — gates `Agreement` execution before deposit capture; decided with `05` and the blueprint's open questions.
- **KYB depth for the booker side** — how strict business verification is at launch affects chargeback risk and is owned by `03`.
- **Legal entity / jurisdiction & contract-template source** — affects the money-transmission analysis and 1099 mechanics; `12`.
- **Trustap (or similar) as a fallback for adjudication only** — re-open if manual dispute volume outpaces solo ops before we can staff it (§4 revisit trigger).

---

### Cross-references
- **`01-vision-strategy.md`** — take-rate policy (8–12%), the two canonical failures, the "not a money transmitter / not an escrow agent / not a law firm" non-goals, money-gated requests as anti-spam.
- **`02-domain-model.md`** — entity shapes for `Deposit`, `EscrowBalance`, `Payment`, `Payout`, `Dispute`, `Agreement`, `Event`; actor-vs-principal payee resolution; the platform-`Dispute`-vs-card-`chargeback` distinction.
- **`03-trust-verification.md`** — Stripe Connect/Identity KYC+KYB onboarding (also the tax-onboarding seam) and the deposit-backed-request anti-spam filter that gates *whether* a `Payment` method even exists.
- **`05-negotiation-deal-lifecycle.md`** — the authoritative deal state machine this doc's escrow machine hangs off; cancellation-policy path (distinct from disputes).
- **`06-availability-confirmation.md`** — the post-show settlement window and "show happened" signal that feed the auto-release timer (INV-2).
- **`09-system-architecture.md`** — idempotent payment webhooks, background jobs (release timers), the `payments` bounded context, evidence retention.
- **`11-gtm-liquidity-trust-safety-ops.md`** — dispute-handling SLAs, adjudication queues, appeals; final settlement-window and take-rate-split values.
- **`12-roadmap-risks-open-questions.md`** — money-transmission counsel review, funds-segregation upgrade, chargeback underwriting, cross-border/FX, the Trustap revisit trigger.
