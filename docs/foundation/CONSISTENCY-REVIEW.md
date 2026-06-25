# CONSISTENCY REVIEW — showman foundation doc set (`docs/foundation/`)

> **Role:** adversarial consistency critic. Scope: docs `01`–`12`, with deep cross-checks on
> (a) inter-doc contradictions, (b) ubiquitous-language / term drift vs. the glossary in
> `02-domain-model.md`, (c) dangling references to undefined things, (d) reconciliation of the
> deal state machine (`05`) against the payment/escrow flow (`04`) and the holds/confirmation
> flow (`06`), and (e) module boundaries in `09-system-architecture.md` vs. the subsystems in
> `03`–`08`.
>
> **Method:** read all twelve numbered docs in full; cross-grepped enums, state names, timer
> windows, take-rate figures, and entity names across the set.
>
> **Overall:** the doc set is unusually disciplined — `02` is treated as a real spine, invariants
> (`I-1…I-21`) are referenced consistently, and most cross-references resolve. The findings below
> are the exceptions. The two Blocking items are genuine contradictions on load-bearing
> transitions/boundaries that *will* produce divergent code if handed to implementers as-is.

---

## Severity summary

| # | Severity | One-line | Primary docs |
|---|----------|----------|--------------|
| B1 | **Blocking** | Deposit-capture timing relative to `Confirmed` is contradictory: `02`/`04`/`12` say "on/at/after Confirmed"; `05`/`06` make `DepositCaptured` a discrete state *before* `Confirmed`. | 02, 04, 05, 06, 12 |
| B2 | **Blocking** | `09` declares **nine** bounded contexts incl. a `verification` module that `02` never defines; `02` defines **eight** and says they are "the same contexts used in `09`." | 02, 09 |
| S1 | **Should-fix** | `EscrowBalance` state `fully_funded` is used as a real state in `04`/`09`/`12` but is absent from `02`'s canonical `EscrowBalance` enum. | 02, 04, 09, 12 |
| S2 | **Should-fix** | The post-show release timer is named three different things across docs; `04`'s name ("confirmation window") collides with the glossary's pre-show "Confirmed". | 04, 05, 06 |
| S3 | **Should-fix** | `06 §2.4` states "No money leaves the booker until the deal reaches `Confirmed` and the `Deposit` is captured" — contradicts `05` T17/T19 ordering and `06`'s own §3 table. | 05, 06 |
| S4 | **Should-fix** | New entities (`BookingGroup`, `ProfileMedia`, `BookingCredit`, `ReputationSummary`, `Pitch` sub-objects) are introduced in `07`/`08`/`09` but never amended into `02`'s catalog/glossary, which `02 §5` forbids. | 02, 07, 08, 09 |
| N1 | **Nice-to-have** | `06`'s worked example A says "deposit authorization captured" — internally contradictory phrasing (an authorization is not a capture). | 06 |
| N2 | **Nice-to-have** | `Hold` lifecycle state enum (`active/pending_confirmation/promoted/expired/released`) lives only in `06`; `02` lists `Hold` fields but no status enum, unlike its treatment of `AvailabilityWindow.status`. | 02, 06 |
| N3 | **Nice-to-have** | `06 §2.4` is internally imprecise about whether the `pending_confirmation` freeze begins at `Accepted` or when "the contract goes out." | 06 |
| N4 | **Nice-to-have** | `06` calls the hold-expiry job "the 'escrow release timer' sibling," conflating two jobs that `09 §6.1` correctly lists separately. | 06, 09 |
| N5 | **Nice-to-have** | `T26` (`Disputed → Cancelled` for refund-to-booker) reuses `Cancelled` as a financial-close bucket; `04`/`05`/`13`-open-Qs all flag a possible `Refunded` status. Consistent but worth resolving once. | 04, 05 |

---

## BLOCKING

### B1 — Deposit-capture timing relative to `Confirmed` is contradictory across the spine, the money doc, and the state machine

This is the most serious inconsistency in the set because it changes the **shape of the state graph**, and the docs that disagree each claim authority over it.

- **`05-negotiation-deal-lifecycle.md`** (the doc that "owns the behavior of the deal entities" and that `04` itself calls "authoritative for the deal") makes deposit capture a **discrete state that strictly precedes `Confirmed`**:
  - `DepositCaptured` is its own state (`State catalog`, the `ContractSigned → DepositCaptured → Confirmed` path).
  - Transition **T17** `ContractSigned → DepositCaptured` (deposit `Payment` succeeds), then **T19** `DepositCaptured → Confirmed` (explicit artist-side confirm).
  - §6.2: "The ~50% **deposit** is captured into the `EscrowBalance` *after* `ContractSigned` and *before* `Confirmed`."
  - The whole rationale box ("Why deposit capture is its own state and not folded into `Confirmed`") depends on capture happening **before** the artifact lights up.

- **`02-domain-model.md`** (the spine) says the opposite in the `Deposit` entity (§1.5) and the glossary: *"captured **at/after** `Confirmed`."*

- **`04-payments-escrow-disputes.md`** also says capture happens **on** `Confirmed`: the money-flow table (§2) reads *"**On `Confirmed`**, capture the deposit,"* and the §7 escrow machine pins `Confirmed ──► EscrowBalance: holding (capture Deposit)` — i.e., capture is triggered *by* the `Confirmed` transition. There is **no `DepositCaptured` state anywhere in `04`'s machine**; `04` jumps `Accepted → Confirmed`.

- **`12-roadmap-risks-open-questions.md`** corroborates the `04`/`02` reading: *"`Deposit` on `Confirmed`."*

So two mutually exclusive models coexist:
- **Model A (`05`, and `06`'s §3 transition table):** `…ContractSigned → DepositCaptured → Confirmed…` — capture is a *prerequisite* of confirm.
- **Model B (`02`, `04`, `12`):** capture is *triggered by / coincident with* `Confirmed`; `DepositCaptured` is not a state.

These cannot both be the schema. `04 §7` even bills itself as "subordinate to the deal state machine in `05`" and claims "each escrow transition is pinned to the deal state that triggers it, so the two never drift" — but it has drifted: it omits `05`'s `DepositCaptured` state entirely and re-pins deposit capture onto `Confirmed`.

**Fix:** pick one model and propagate. The intent in `05` (capture *before* the confirmation artifact, so "Prince is confirmed" is never shown on unfunded money) is clearly the considered design and is the safer one. Therefore:
1. In `02 §1.5` and the glossary, change `Deposit` to *"captured at `DepositCaptured`, after the contract is fully executed and **before** `Confirmed`."*
2. In `04 §2` and the §7 escrow machine, insert the `DepositCaptured` deal state: `ContractSigned → DepositCaptured (capture Deposit → EscrowBalance: holding) → Confirmed`. Remove "On `Confirmed`, capture the deposit."
3. In `12`, change "`Deposit` on `Confirmed`" to "`Deposit` at `DepositCaptured` (pre-`Confirmed`)."

---

### B2 — `09` declares a `verification` bounded context that the spine (`02`) never defines; the two docs disagree on the number and identity of contexts

`02 §1` states entities are *"grouped by **bounded context** (the same contexts used in `09-system-architecture.md`)"* and enumerates **eight**: `identity` (§1.1), `catalog` (§1.2–1.3), `booking` (§1.4), `payments` (§1.5), and `reputation` / `messaging` / `notifications` / `integrations` (§1.6). **There is no `verification` context in `02`** — verification *state* is explicitly attached to `User`/`Org`/`ArtistProfile`/`Membership`, which `02` places inside `identity` and `catalog`.

`09 §1` declares **nine** bounded contexts and adds a standalone **`verification`** module, described as owning *"verification state on `User`/`Org`/`ArtistProfile`/`Membership`; provenance records."* That is state `02` assigned to other contexts. So:
- The two docs disagree on the count (8 vs 9).
- `09` carves a new context out of `identity`/`catalog` without amending `02` first — directly violating `02 §5`'s consistency obligation: *"if a later doc needs a new entity, term, or to change a relationship, it must amend this file first."*
- `02`'s claim "the same contexts used in `09`" is now false.

This matters for module boundaries (check (e)): a reader reconciling `03` (trust/verification behavior) to a home module finds it in `09`'s `verification` module but cannot find that context in the spine's entity grouping.

**Fix (either direction, but make them agree):**
- *Preferred:* amend `02 §1` to add a ninth `verification` context (or an explicit note that verification state spans `identity`+`catalog` but is **operated** by a `verification` module in `09`), so the count and ownership match.
- Update `02 §1`'s parenthetical so it no longer asserts identical grouping if you keep them different on purpose. As written, the two are in direct conflict.

---

## SHOULD-FIX

### S1 — `EscrowBalance` state `fully_funded` is used as a first-class state but is missing from `02`'s canonical enum

`02 §1.5` fixes the `EscrowBalance` release-state enum as: **`holding | release_pending | released | refunded | frozen_by_dispute`**. There is no `fully_funded`.

But `04` uses `fully_funded` as a state throughout: the §7 machine (`(still Confirmed) ──► EscrowBalance: fully_funded`), the canonical state table (`§7`, row `fully_funded`), and **INV-1** (*"a deal cannot transition to `Performed` unless `EscrowBalance` is `fully_funded`"*). `09 §5.2` and `12` (the Stripe test-mode spike: `holding → fully_funded → release_pending → released`) both treat it as a real state.

`04`'s own footnote ¹ admits the gap: *"`fully_funded` is a sub-state of `holding`'s family **in `02`'s enum narrative**"* — but `02` has no such narrative; its enum simply lacks the value. This is exactly the term drift `02` forbids ("no synonyms, no drift... table/type names must match the ubiquitous language exactly").

**Fix:** amend `02 §1.5`'s `EscrowBalance` enum to either (a) add `fully_funded` as a canonical state, or (b) add the `holding` + `is_balance_captured` flag the `04` footnote offers as the alternative — and have `04`/`09`/`12` reference whichever is chosen. Right now the spine and the money doc disagree on the enum.

### S2 — The post-show release timer has three names, and `04`'s name collides with the glossary's pre-show "Confirmed"

The single post-performance window during which auto-release is pending is called:
- **`04`:** *"confirmation window"* (default 72h) — repeatedly (§1, §2, §6.1, §7, §9).
- **`05`:** *"post-performance settlement window"* / *"post-performance window."*
- **`06`:** *"post-performance escrow window"* (§3).

Beyond the cosmetic drift, `04`'s choice is actively confusing: **"Confirmed" / "confirmation" is a load-bearing glossary term in `02`** for the *pre-show* artifact and the `Confirmed` state/transition. `06` independently uses `pending_confirmation` and `confirmation_deadline` for a *third, different* (pre-show, signature-stage) timer. So "confirmation window" now overloads a word that already has two distinct meanings.

**Fix:** standardize on one name for the post-show auto-release window — recommend **"settlement window"** (matches `05`, avoids the "confirmation" collision) — and update `04` and `06` to use it. Add it to the `02` glossary so it's canonical.

### S3 — `06 §2.4` contradicts the capture ordering in `05` and in `06`'s own transition table

`06 §2.4` (on `deposit-backed` holds) states: *"No money leaves the booker until the deal reaches `Confirmed` and the `Deposit` is captured."* This asserts capture happens **at/after `Confirmed`** — i.e., it takes Model B from finding **B1**.

But `06`'s own §3 transition table has a **`Deposit captured`** row ("the `Deposit` is captured into the `EscrowBalance`... Still not `booked`") that precedes the separate **`→ Confirmed`** row — i.e., Model A. And `05` (T17 before T19) is Model A.

So `06` contradicts both `05` and itself within a few pages. (This is the same root issue as B1, surfacing as an *intra-doc* contradiction in `06`; called out separately because fixing B1 in `02`/`04`/`12` won't automatically fix this sentence in `06`.)

**Fix:** rewrite `06 §2.4`'s sentence to: *"No money leaves the booker until the deal reaches `DepositCaptured` (after the contract is fully executed, before `Confirmed`); an expired/lost deposit-backed hold simply voids the authorization."*

### S4 — New entities introduced downstream are never amended into the spine, as `02 §5` requires

`02 §5` is explicit: *"if a later doc needs a new entity, term, or to change a relationship, it must amend **this file first**, then reference it — never define a competing term locally."* Several entities violate this:

- **`BookingGroup`** — defined in `07 §7.2` (the multi-artist coordination context) and listed as an owned entity of the `booking` module in `09 §1`. Not in `02`'s catalog or glossary. (`02 §6` only mentions a hypothetical "`BookingBundle`" as an open question — a *different*, rejected name — so the spine doesn't even reserve the term that won.)
- **`ProfileMedia`, `BookingCredit`** — defined in `08 §2.3–2.4`, listed as owned by `catalog` in `09 §1`. Not in `02`.
- **`ReputationSummary`** — defined in `08 §5.1`, listed as projected by `reputation` in `09 §1`. Not in `02` (which has `ReputationScore` but not the summary projection).
- Pitch sub-objects (`PitchTemplate`, `PitchAttachment`) and EPK value-objects (`FeeDisplay`, `ResponseProfile`, etc.) — defined in `08`. `02` keeps `Pitch` embedded but does not list these.

`08` and `07` *do* soften this by saying they "augment" the spine entity — but `02` was not actually amended, and `09`'s module table lists these as canonical owned entities, so a reader who treats `09 §1` as the schema map will find entities the spine doesn't acknowledge. `BookingGroup` and the `verification` context (B2) are the load-bearing ones; the presentation value-objects are lower-risk.

**Fix:** add a short "downstream-amended entities" subsection to `02 §1` (or extend the catalog) naming at minimum `BookingGroup` (booking), `ProfileMedia`/`BookingCredit` (catalog), and `ReputationSummary` (reputation), each with a one-line definition and a pointer to its owning doc — so the spine remains the single source of truth it claims to be.

---

## NICE-TO-HAVE

### N1 — "deposit authorization captured" is self-contradictory phrasing
`06`'s worked example A: *"contract e-signed → **deposit authorization captured** (`04`) → clicks Confirm."* An authorization and a capture are distinct Stripe operations (`06 §2.4` itself stresses "authorization, **not** a capture"). The phrase reads as both at once. **Fix:** "deposit captured" (if it follows the `DepositCaptured` state) — and align with whatever B1 resolves.

### N2 — `Hold` has a status enum in `06` but not in `02`
`06 §7.2` defines `Hold` lifecycle states `active → {expired | released | pending_confirmation → promoted}`. `02 §1.2` lists `Hold`'s *fields* (window, request, expiry, strength) but no status enum — even though it *does* give `AvailabilityWindow` a canonical `status` enum. For symmetry and to keep the spine authoritative, **fix:** add the `Hold.status` enum to `02 §1.2`.

### N3 — `06` is imprecise about when the `pending_confirmation` freeze starts
`06 §3` transition table arms `pending_confirmation` at **`Accepted`**; `06 §2.4` describes the freeze as covering the "`Accepted → Contract e-signed → Deposit captured → Confirmed` segment" and says it begins when "the contract goes out." Pick one trigger point (recommend `Accepted`, matching the table) and state it once.

### N4 — Hold-expiry job conflated with the escrow-release job
`06 §2.4` calls the hold-expiry background job *"the 'escrow release timer' sibling."* `09 §6.1` correctly lists **"Escrow auto-release"** and **"Hold expiry"** as two separate jobs. Minor, but rename in `06` to "the hold-expiry timer (a sibling of the escrow-release job)" to avoid implying they are the same timer.

### N5 — `Refunded` terminal status is perpetually deferred
`05` T26 routes a refund-to-booker dispute outcome through the `Cancelled` terminal; `04 §7` shows `resolved_refund → DEAL: Cancelled`; both, plus `05 §13` and `04 §10`, flag a possible dedicated `Refunded` status. The docs are *consistent* (all defer it), but since three docs each carry the same open question, resolve it once in `02` (the spine) and have the others reference it, rather than re-deferring in parallel.

---

## Cross-check results (explicit, per the brief)

**(d) Deal state machine (`05`) vs. payments/escrow (`04`) vs. holds/confirmation (`06`):**
Mostly reconciles cleanly — the invariant cross-refs (I-9, I-10, I-11, I-16, I-17, I-18, I-19) line up, and `04`'s subordinate escrow machine maps to `05`'s states at most points. **The exceptions are B1/S3 (deposit-capture ordering — a real graph-level divergence) and S2 (window naming).** `04`'s claim that its escrow machine "never drifts" from `05` is not currently true because `04` drops the `DepositCaptured` state. Fix B1/S2/S3 and the three machines reconcile fully.

**(e) Module boundaries (`09`) vs. subsystems (`03`–`08`):**
Strong overall — `09`'s module→owning-doc reconciliation table is thorough and the dependency-direction graph is coherent. **The exception is B2 (the undeclared `verification` context) and S4 (entities in `09`'s module table that the spine never defines).** With those two fixed, the boundary map is internally consistent. Note the boundary lint rule, the `authorize()` chokepoint, the `(artist, window, status=booked)` constraint, "floor not in the index," and idempotent webhooks are all correctly traced back to their owning docs.

**(b) Term drift vs. the `02` glossary:**
The glossary is respected almost everywhere (10's color/status mapping, 08's presentation fields, 07's roles all match). Drift is concentrated in: `fully_funded` (S1), the post-show window name (S2), and the downstream entities never back-ported (S4). No role-name, invariant-id, or actor/principal drift was found — those are clean across all twelve docs.

**(c) Dangling references:**
No broken invariant references (every `I-#` cited resolves to `02 §4`). No cross-doc pointer to a section that does not exist was found. The only "references something never *defined in the spine*" cases are the S4 entities and the B2 context — captured above. `BookingBundle` appears only as a named-and-rejected open-question alternative, not as a live dangling reference.

---

*End of original findings — grouped Blocking / Should-fix / Nice-to-have, each with a concrete fix.*

---

## Resolution log — applied 2026-06-23 ("apply all per critic recommendations")

All findings reconciled. Status: **resolved**.

| # | Status | What changed | Files touched |
|---|--------|--------------|---------------|
| **B1** | ✅ | Adopted the `05` model: **`DepositCaptured`** is a discrete deal state **after** contract execution and **before** `Confirmed`; deposit is captured there, so the confirmation artifact never lights up on unfunded money. `04 §7`'s escrow machine now contains the `DepositCaptured` state (no longer jumps `Accepted → Confirmed`). | 02 §1.5/glossary, 04 §2/§7, 06 §2.4, 12 |
| **B2** | ✅ | `02 §1` now declares **nine** bounded contexts incl. `verification` (cross-cutting: state in `identity`/`catalog`, *operated* by the `verification` module in `09`). Count + ownership match `09`. | 02 §1 |
| **S1** | ✅ | `fully_funded` added to `02`'s canonical `EscrowBalance` enum; `04`'s footnote ¹ now calls it canonical, not "enum narrative". | 02 §1.5, 04 §7 |
| **S2** | ✅ | Post-show timer standardized on **"settlement window"** everywhere (incl. hyphenated + `01`/`09` strays); `Settlement window` added to the `02` glossary with an explicit "never call it confirmation window" note; OQ-8 relabeled. | 01, 02, 04, 06, 09, 12 |
| **S3** | ✅ | `06 §2.4` sentence rewritten to `DepositCaptured` ordering. | 06 §2.4 |
| **S4** | ✅ | Added `02 §1.7 "Downstream-amended entities"` registering `BookingGroup`, `ProfileMedia`, `BookingCredit`, `ReputationSummary`, and the Pitch/EPK value-objects with owning-doc pointers. | 02 §1.7 |
| **N1** | ✅ | `06` worked-example "deposit authorization captured" → `DepositCaptured` (deposit captured). | 06 §8 |
| **N2** | ✅ | `Hold.status` enum added to `02 §1.2`. | 02 §1.2 |
| **N3** | ✅ | `06`'s `pending_confirmation` freeze pinned to **`Accepted`** (matches the §3 table). | 06 §2.4 |
| **N4** | ✅ | `06` renamed the hold-expiry job; no longer conflated with the escrow-release timer. | 06 §2.4 |
| **N5** | ✅ | Canonical decision in `02 §1.5`: **no separate `Refunded` deal status** — refund = deal `Cancelled` + `EscrowBalance: refunded`. `05`'s two stale open questions (Refunded status; `BookingBundle`) marked resolved. | 02 §1.5, 05 |

Cross-checks **(d)** and **(e)** now pass: `04`'s escrow machine includes `DepositCaptured` (no drift from `05`), and `02`/`09` agree on nine contexts. Per **OQ-24**, re-run this pass at each phase boundary and on any change to `02`/`04`/`05`/`06`.
