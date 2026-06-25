# 07 — Roster, Org & RBAC (the authority layer)

> This doc owns the **behavior** of `Org`, `Membership`, the `role` permission matrix, and principal **ownership**. The *shapes* of these entities are fixed in [`02-domain-model.md`](./02-domain-model.md) — this doc does not redefine them, it specifies how authority is granted, checked, revoked, and routed. It also resolves three of the spine's [open modeling questions](./02-domain-model.md#6-open-modeling-questions-carried-not-blocking): self-managed-artist mechanics, `BookerProfile`↔`Org` cardinality, and the group/multi-artist booking object.
>
> **Invariants this doc is responsible for enforcing:** **I-3** (one owner per principal), **I-4** (authority gates every on-behalf-of action), **I-12** (requests resolve to the team principal), **I-19** (payout follows the principal). It also leans on **I-1**, **I-2**, **I-5** defined in the spine.
>
> **What is *not* here:**
> - *How a `Membership` gets created via verification / vouching authority* → the trust mechanics (counter-signature, provenance, KYC/KYB gates) live in [`03-trust-verification.md`](./03-trust-verification.md). This doc owns the **invitation/vouching state machine and the role assigned**; that doc owns **whether the invitee/principal is verified enough to hold it**.
> - *Money routing internals* (separate charges & transfers, the agent's ~10%) → [`04-payments-escrow-disputes.md`](./04-payments-escrow-disputes.md). This doc owns **who is authorized to move money**, not the rails.
> - *The deal state machine* the matrix gates → [`05-negotiation-deal-lifecycle.md`](./05-negotiation-deal-lifecycle.md).

---

## 0. Why this layer exists at all

The single load-bearing decision of the whole platform — **actor vs principal** — is stated in [`02-domain-model.md §0`](./02-domain-model.md#0-the-one-decision-that-shapes-everything-actor-vs-principal). This doc is where that decision becomes an *operational* system: the rules that decide, on every click, **"is this actor allowed to do this thing to this principal?"**

The represented-artist tier makes this non-optional. From [`01-vision-strategy.md`](./01-vision-strategy.md): above the emerging tier, **the person clicking the button is almost never the artist** — it is a manager or agent acting on behalf of the artist, and the strategy *depends* on aiding those gatekeepers rather than routing around them. So authority cannot be a `is_admin` boolean bolted onto a `User`. It must be:

- **Per-principal** — a `User` is `finance` for Label A *and* `agent` for a side artist *and* `viewer` for a festival, all at once.
- **Explicit and granted** — never inferred from identity. Passing KYC does not make you Prince's manager (**I-5**).
- **Auditable** — every on-behalf-of action lands in the `Event` log as `(actor, principal, role, action)` (**I-2**).
- **Revocable instantly** — losing a `Membership` removes authority on the next request, mid-flight (**I-4**).

Everything below is the concrete encoding of those four properties.

---

## 1. The `Org`: one container, three jobs

An `Org` is a **team principal** (agency / label / management / festival / venue / promoter). Per the spine it has *two faces* (supply, demand, or both). Operationally it does three jobs that nothing else in the model does:

1. **It holds the team.** All the humans who can act for the team are `Membership`s on the `Org`. No shared logins, no shared passwords — each human is a `User` with their own credentials and their own role.
2. **It owns the roster.** Each managed act is an `ArtistProfile` that belongs to the `Org`. This is what makes "a manager with multiple artists" (the `init-jot` ask) a single team workspace rather than N disconnected accounts.
3. **It is the routing boundary.** Because inbound requests resolve to the managing `Org` (I-12), the `Org` is where dedup, co-routing, and "address the whole team" happen (§7, §8).

### 1.1 Self-managed artists: always a degenerate `Org` of one

The spine flagged this as open. **Decision: a self-managed artist is modeled as an `Org` with a single `owner` `Membership`, not as a direct `Membership` on the `ArtistProfile`.** One code path, not two.

| Option | Verdict | Why |
| --- | --- | --- |
| Direct `Membership` on `ArtistProfile` (polymorphic principal) | **Rejected as the primary path** | Forces every authority check, payout resolution, notification fan-out, and routing query to branch on "is the principal an `Org` or an `ArtistProfile`?" The branch metastasizes across the whole codebase. |
| Always an `Org` — even an `Org` of one | **Chosen** | Roster management, RBAC, payouts (I-19), and team routing (I-12) have exactly one shape. When a self-managed artist later signs with a real agency, it is a **principal-ownership transfer** (§6), not a model migration. |

This means: when a solo artist signs up, the platform silently provisions a personal `Org` (type `management`, often named for the artist) and makes them its `owner`. The artist barely perceives the `Org` — the UI shows "your artist profile" — but every downstream system treats it uniformly. The `Membership.principal_ref` polymorphism in the spine ER diagram remains *legal* (so the model isn't a lie), but it is a **migration-only / edge path**, never the path new self-managed artists take.

> **Consequence — graduation is a feature, not a rebuild.** "I got a manager" → the manager's `Org` is granted ownership of the `ArtistProfile`, the personal `Org` is either retired or downgraded to a `viewer`/`agent` `Membership` so the artist keeps visibility. No deal history, reputation, or escrow is disturbed because the **principal** (`ArtistProfile`) never changed identity — only its owning `Org` did. This is the model paying off exactly as the spine promised.

### 1.2 `BookerProfile` ↔ `Org` cardinality: one-to-many, confirmed

The spine asked whether one `Org` (a venue group) can own *multiple* `BookerProfile`s. **Decision: yes — one `Org` owns zero-or-more `BookerProfile`s.** A venue group with five rooms can present five `BookerProfile`s (one per room/buyer persona) while sharing one team, one KYB status, one connected account, and one set of `Membership`s. Authority is held over the **`Org`**; the `BookerProfile`s are demand-side faces of it. This keeps **I-3** intact (each `BookerProfile` has exactly one owner — here, the `Org`) while supporting the real-world "one company, many buyer identities" case.

A personal `BookerProfile` (an independent talent buyer with no company) is owned directly by a `User` — the one place a principal is owned by a `User` rather than an `Org`. Authority over a personal `BookerProfile` is **implicit in ownership** (you don't need a `Membership` to act for the profile you personally own), but it still produces the same `(actor, principal, role=owner)` audit shape so the `Event` log is uniform.

---

## 2. The `Membership`: the on-behalf-of grant, made operational

A `Membership` is the literal encoding of "this actor may act for this principal." Its fields are fixed in the spine; here is the **lifecycle** the rest of this doc gates on.

```
        invited ──accept──► active ──suspend──► suspended ──reactivate──► active
           │                  │                     │
        decline             revoke               revoke
           │                  │                     │
           ▼                  ▼                     ▼
        (deleted)         revoked              revoked          ← terminal
```

| Status | Authority granted? | Notes |
| --- | --- | --- |
| `invited` | **No** | A pending invite. The invitee can *see* the invite, nothing else. (§4) |
| `active` | **Yes**, scoped by `role` | The only state that authorizes on-behalf-of actions (**I-4**). |
| `suspended` | **No** | Temporary freeze (e.g., during a security review or an internal dispute). Reversible. |
| `revoked` | **No** (terminal) | Permanent. Audit history is retained; the `User` keeps their login and their *other* `Memberships`. |

**Authority is evaluated live, never cached into a session.** A `revoke` or `suspend` takes effect on the *next* authorization check — including for an actor mid-negotiation. If a manager is removed from a label at 14:00, any action they attempt at 14:01 fails the check, even inside an open `BookingRequest` thread (**I-4**). This is non-negotiable for a money-moving platform.

> **The role lives on the `Membership`, not the `User`.** A `User` has no global role beyond `member` vs platform `staff` (the spine's `User.global role`). All product authority is per-(actor, principal) and therefore lives on the `Membership`. This is the single most common mistake to avoid: never add a `role` column to `User`.

---

## 3. RBAC: the four roles and the permission matrix

Four roles, fixed in the spine: **`owner` · `agent` · `finance` · `viewer`**. They are intentionally few. The represented tier's real org chart is small (an artist's "team" is a manager, maybe a booking agent, maybe a business manager, maybe an assistant); four roles cover it without the false precision of a 20-permission ACL editor that no manager will ever configure.

### 3.1 Role intent (the one-line mental model)

| Role | Mental model | Real-world holder |
| --- | --- | --- |
| **`owner`** | Runs the org. Can do anything, including changing who else can do anything. | Agency principal, label head, the self-managed artist, festival GM. |
| **`agent`** | Does the deals. Negotiates, confirms, signs — but cannot restructure the org or redirect the money. | Booking agent, day-to-day manager. |
| **`finance`** | Handles the money and the paperwork. Banking, payouts, tax, contracts — but does not negotiate or confirm artistic bookings. | Business manager, label finance, festival accounting. |
| **`viewer`** | Sees everything, touches nothing. | Junior staff, an analyst, the graduated self-managed artist watching their new agency, an auditor. |

These map cleanly onto the industry: the **agent does the deal**, the **business/finance side moves the money**, the **principal (owner)** sets the terms and the team. Crucially, the agent's role does **not** include redirecting payouts or changing the connected bank account — separating *deal authority* from *money-destination authority* is the core internal-fraud control (§3.4).

### 3.2 The permission matrix (role × action)

Read as: **does an `active` `Membership` of this role authorize this action on the principal it covers?** ✅ = yes; ⚠️ = yes but conditioned (see footnote); ❌ = no. The **enforcing behavior** of each gated action lives in the owner doc named in the right column.

#### Org & membership administration

| Action | `owner` | `agent` | `finance` | `viewer` | Owner doc |
| --- | :---: | :---: | :---: | :---: | --- |
| View org, roster, members | ✅ | ✅ | ✅ | ✅ | this doc |
| Edit org profile (name, type, public info) | ✅ | ❌ | ❌ | ❌ | this doc |
| Invite a member | ✅ | ⚠️¹ | ❌ | ❌ | this doc §4 |
| Assign / change a member's role | ✅ | ❌ | ❌ | ❌ | this doc |
| Suspend / revoke a member | ✅ | ❌ | ❌ | ❌ | this doc |
| Transfer org ownership | ✅² | ❌ | ❌ | ❌ | this doc §6 |
| Delete / archive the org | ✅² | ❌ | ❌ | ❌ | this doc §6 |

#### Roster & catalog (supply side)

| Action | `owner` | `agent` | `finance` | `viewer` | Owner doc |
| --- | :---: | :---: | :---: | :---: | --- |
| Add / remove an `ArtistProfile` to/from roster | ✅ | ⚠️³ | ❌ | ❌ | this doc §6 |
| Edit `ArtistProfile` (EPK, media, bio) | ✅ | ✅ | ❌ | ❌ | [`08`](./08-profiles-pitches-discovery.md) |
| Initiate / manage artist verification claim | ✅ | ✅ | ❌ | ❌ | [`03`](./03-trust-verification.md) |
| Create / edit a `Listing` (`fee`, terms) | ✅ | ✅ | ❌ | ❌ | [`08`](./08-profiles-pitches-discovery.md) |
| Set / change `Listing.private_floor` | ✅ | ✅ | ❌ | ❌ | [`05`](./05-negotiation-deal-lifecycle.md) |
| Manage `AvailabilityWindow` / blackouts | ✅ | ✅ | ❌ | ❌ | [`06`](./06-availability-confirmation.md) |

#### Deal flow (the deal state machine in [`05`](./05-negotiation-deal-lifecycle.md))

| Action | `owner` | `agent` | `finance` | `viewer` | Owner doc |
| --- | :---: | :---: | :---: | :---: | --- |
| View a `BookingRequest` / negotiation thread | ✅ | ✅ | ✅ | ✅ | [`05`](./05-negotiation-deal-lifecycle.md) |
| Send a `BookingRequest` (demand side) | ✅ | ✅ | ❌ | ❌ | [`05`](./05-negotiation-deal-lifecycle.md) |
| Make / counter / accept an `Offer` | ✅ | ✅ | ❌ | ❌ | [`05`](./05-negotiation-deal-lifecycle.md) |
| Decline / withdraw / let expire | ✅ | ✅ | ❌ | ❌ | [`05`](./05-negotiation-deal-lifecycle.md) |
| **Confirm the booking** (the explicit artist-side confirm) | ✅ | ✅ | ❌ | ❌ | [`06`](./06-availability-confirmation.md) |
| Sign the `Contract` (bind the principal) | ✅ | ⚠️⁴ | ⚠️⁴ | ❌ | [`05`](./05-negotiation-deal-lifecycle.md) / [`04`](./04-payments-escrow-disputes.md) |

#### Money (the rails in [`04`](./04-payments-escrow-disputes.md))

| Action | `owner` | `agent` | `finance` | `viewer` | Owner doc |
| --- | :---: | :---: | :---: | :---: | --- |
| View `EscrowBalance` / `Payment` / `Payout` status | ✅ | ✅ | ✅ | ✅ | [`04`](./04-payments-escrow-disputes.md) |
| Complete Stripe Connect onboarding / KYB | ✅ | ❌ | ✅ | ❌ | [`03`](./03-trust-verification.md) / [`04`](./04-payments-escrow-disputes.md) |
| **Set / change the payout bank account** | ✅ | ❌ | ✅ | ❌ | [`04`](./04-payments-escrow-disputes.md) |
| Pay a `Deposit` / `balance` (demand side) | ✅ | ❌ | ✅ | ❌ | [`04`](./04-payments-escrow-disputes.md) |
| Approve / trigger a `Payout` release (where manual) | ✅ | ❌ | ✅ | ❌ | [`04`](./04-payments-escrow-disputes.md) |
| Issue a refund (within policy) | ✅ | ❌ | ✅ | ❌ | [`04`](./04-payments-escrow-disputes.md) |
| Configure the representation cut (the agent ~10%) | ✅ | ❌ | ✅ | ❌ | [`04`](./04-payments-escrow-disputes.md) |

#### Disputes & reputation

| Action | `owner` | `agent` | `finance` | `viewer` | Owner doc |
| --- | :---: | :---: | :---: | :---: | --- |
| Open a `Dispute` | ✅ | ✅ | ✅ | ❌ | [`04`](./04-payments-escrow-disputes.md) |
| Submit dispute evidence / respond | ✅ | ✅ | ✅ | ❌ | [`04`](./04-payments-escrow-disputes.md) |
| Accept a dispute resolution / settlement | ✅ | ⚠️⁵ | ⚠️⁵ | ❌ | [`04`](./04-payments-escrow-disputes.md) |
| Leave a `Review` (post-deal) | ✅ | ✅ | ✅ | ❌ | [`08`](./08-profiles-pitches-discovery.md) |

**Footnotes (the ⚠️ conditions):**

1. **`agent` can invite, but only `agent`/`viewer` and only with `owner`-configured "agents may invite" turned on.** Default off. An `agent` can never invite an `owner` or `finance`. Privilege escalation is impossible by construction — you cannot grant a role at or above your own.
2. **Ownership transfer / org deletion require step-up auth** (re-authentication / 2FA) and a notification to all `owner`s. Money-bearing orgs with an in-flight, funded `EscrowBalance` cannot be deleted until deals settle or are cancelled (see §6, and [`04`](./04-payments-escrow-disputes.md)).
3. **`agent` can add an `ArtistProfile` to the roster only if `owner` enabled "agents manage roster."** Removing an artist that has live deals is `owner`-only regardless.
4. **Signing authority is configurable per org.** Default: `owner` and `agent` may sign (bind) the principal; `finance` may sign only if the `owner` designates them a contract signatory. The signature is **attributed to the principal**, performed by the **actor** — exactly the spine's authority note on `Agreement`. The e-sign envelope records the actor's identity.
5. **Accepting a dispute settlement that moves money requires `finance` or `owner`** when the settlement is a split/refund (money leaves the principal); an `agent` may accept a full-release resolution (money comes *to* the artist) but not one that concedes funds.

### 3.3 The permission check, as a single rule

Every authorization in the system reduces to one predicate. There is exactly one gate; nothing routes around it.

```
authorize(actor: User, action: Action, target: Principal) -> Allow | Deny

  1. Resolve the Membership:
       m = membership where m.user == actor
                          and m.principal covers target   # see §3.3.1
                          and m.status == 'active'
     If none -> Deny  (no authority; I-4)

  2. Check the matrix:
       if PERMISSION_MATRIX[m.role][action] is granted (incl. conditions met)
            -> Allow, and emit Event(actor, target, m.role, action)   # I-2
       else -> Deny

  # No global override except platform `staff` acting through the
  # trust & safety surface (see 11-gtm-liquidity-trust-safety-ops.md),
  # which is itself audited as (actor=staff, ...) and never silent.
```

#### 3.3.1 "covers target": resolving the principal chain

`target` is the principal a request acts on (`ArtistProfile`, `BookerProfile`, or `Org`). A `Membership` is held over an `Org` (or, edge case, directly over a self-managed `ArtistProfile`). "Covers" walks the ownership edge:

- Action on an **`Org`** → covered by a `Membership` on that `Org`.
- Action on an **`ArtistProfile`** → covered by a `Membership` on the `Org` that **owns** that `ArtistProfile` (the roster edge). This is why one manager's one `Membership` authorizes them over the whole roster — exactly the spine's "no per-artist logins."
- Action on an **`Org`-owned `BookerProfile`** → covered by a `Membership` on the owning `Org`.
- Action on a **personal `BookerProfile`** → covered by direct `User` ownership (implicit `owner` role).

Because authorization walks the ownership edge rather than storing per-artist grants, **adding an artist to a roster instantly extends every team member's existing authority to that artist** — no fan-out of grants, no backfill. Removing the artist instantly retracts it. This is the I-12 routing boundary and the I-4 authority model being the *same* edge.

### 3.4 Why these specific cuts (the non-obvious design choices)

- **Deal authority ≠ money-destination authority.** The single most important line in the matrix: `agent` can run the entire deal — negotiate, accept, confirm, sign — but **cannot change the payout bank account** and **cannot trigger a payout to a new destination**. That power is `finance`/`owner` only and is step-up-protected (§5). This is the classic separation-of-duties control: the person who *closes* the deal is not the person who can *redirect* where the money lands, so a compromised or rogue `agent` cannot reroute funds. It directly serves I-19 (payout follows the principal, to the principal's account).
- **`finance` cannot negotiate or confirm.** A business manager should not be accepting artistic bookings on the artist's behalf. Money authority and booking authority are orthogonal on purpose.
- **`viewer` is a real role, not a placeholder.** It is how a graduated self-managed artist keeps a window into the agency now representing them, how festivals give programmers read access without buy authority, and how an auditor or investor sees the book without touching it. Read-only is a first-class need on this platform, not an afterthought.
- **No "super-admin per artist."** There is deliberately no role narrower than `Org`-wide for the supply side in v1. The represented-tier team is small and trusted; scoping an `agent` to "only artists X and Y" is a Phase-2 refinement (§9), not a launch requirement, and adding it later is additive (a per-`Membership` roster scope), not a breaking change.

---

## 4. Invitation & vouching flow (and its tie to verification authority)

Adding a human to a team is the moment authority is *created*. It is therefore the moment verification authority matters most. This section owns the **flow and the role granted**; the **verification gate** (is this person/principal allowed to be trusted at all?) is owned by [`03-trust-verification.md`](./03-trust-verification.md). The two interlock at the points marked **[→ 03]**.

### 4.1 The vouching insight

Per the spine, the `Membership.invited_by` field exists specifically to power the verification **counter-signature / vouch** path: *an already-verified team member invites and vouches for the next one.* This is how authority propagates through a team without every member re-running a full documentary verification. The first member's authority is hard-won (DSP claim / attestation / documentary — see [`03`](./03-trust-verification.md)); subsequent members can be **vouched in** by an `owner`, inheriting trust transitively from an already-verified principal.

This is the same mechanism Spotify-style "verified team" propagation uses, and it is what makes onboarding a 6-person agency tractable: verify the agency once (KYB + the principal's authority), then the `owner` vouches in the team.

### 4.2 The flow

```mermaid
sequenceDiagram
    participant Inviter as Inviter (owner / cond. agent)
    participant SHM as showman
    participant V as Verification [03]
    participant Invitee as Invitee (User)

    Inviter->>SHM: Invite(email, role) on Org/roster
    SHM->>SHM: Check authority (matrix §3.2) + role ceiling (§4.3)
    Note over SHM: role must be ≤ inviter's role
    SHM->>SHM: Create Membership(status=invited, invited_by=inviter, role)
    SHM->>Invitee: Invitation (email / in-app)

    Invitee->>SHM: Accept
    alt Invitee has no User yet
        SHM->>Invitee: Sign up → create User (login)
    end
    SHM->>V: Identity gate for this User+role  [→ 03]
    Note over V: Role-tiered: finance/owner & signatories<br/>require KYC (Stripe Identity/Persona).<br/>viewer/agent may be lighter. See 03.
    V-->>SHM: identity status
    alt Identity sufficient for role
        SHM->>SHM: Membership.status = active  (authority live; I-4)
        SHM->>Inviter: "X joined as <role>" (team notification)
    else Insufficient
        SHM->>Invitee: Step up (complete KYC) — stays `invited`
    end
```

### 4.3 Rules baked into the flow

- **Role ceiling — no privilege escalation.** An inviter may only grant a role **at or below their own**. `owner` can grant any role; a (conditionally enabled) `agent` can grant only `agent`/`viewer`. There is no path by which an actor mints authority exceeding their own. This is checked at invite time *and* re-checked at accept time (the inviter's role may have changed in between).
- **The vouch is recorded.** `Membership.invited_by` is the audit trail of who vouched for whom — usable by trust & safety to unwind a compromised onboarding chain, and consumed by [`03`](./03-trust-verification.md) as a trust signal.
- **Authority is granted at `accept`, gated by identity, not at `invite`.** An `invited` `Membership` confers nothing (§2). The `User` becomes able to act only when the `Membership` flips to `active`, which requires clearing the **role-tiered identity gate** in [`03`](./03-trust-verification.md): a `finance`/`owner` or a designated contract **signatory** must clear KYC before going active (they touch money and bind the principal); a `viewer` can go active with a lighter check. The exact gates are [`03`](./03-trust-verification.md)'s call; this flow just enforces "the gate must pass before `active`."
- **Inviting onto a roster vs onto an `Org`.** You always invite onto the **`Org`** (the team), never onto a single `ArtistProfile` — because authority is `Org`-wide by the §3.3.1 resolution. There is no "invite someone to just this one artist" in v1 (that is the Phase-2 scoped-`agent` feature, §9).
- **Joining vs creating supply.** A *new* `Org` (a real agency signing up) must clear **KYB** before it can receive `Payout`s or have its roster's `Listing`s go discoverable — see [`03`](./03-trust-verification.md). Inviting members into an already-verified `Org` rides on that `Org`'s standing.

### 4.4 The self-claim edge: an artist claiming their own profile

A self-managed artist "inviting themselves" is the degenerate case: they claim an `ArtistProfile` via the DSP/channel possession path in [`03`](./03-trust-verification.md), and on success the platform provisions their personal `Org` (§1.1) and seats them as `owner`. No human inviter; the **verification source is the voucher.** This is why §1.1's "always an `Org`" decision and §4's flow are the same flow with the inviter swapped for a verification provenance.

---

## 5. Sensitive-action guardrails (beyond the matrix)

The matrix says *who may*. Some actions need more than a role check because the blast radius is large or irreversible. These are layered on top of `authorize()`, not instead of it.

| Guardrail | Applies to | Why |
| --- | --- | --- |
| **Step-up auth** (re-auth / 2FA at action time) | change payout bank account; transfer/delete org; release a large manual `Payout` | A stolen session must not be able to reroute money or destroy a team. Highest-value, lowest-frequency actions. |
| **Cool-down + notify-all** | new payout bank account becomes eligible only after a delay, with all `owner`/`finance` notified | Detects account-takeover reroutes before funds move. Mirrors how banks treat a new payee. |
| **Two-person rule (configurable)** | optional: large `Payout` release or refund requires a second `owner`/`finance` approval | Lets bigger agencies/labels enforce dual control without us hard-coding it. Off by default for solo orgs. |
| **Funded-deal lock** | cannot delete/transfer an `Org`, or remove an `ArtistProfile`, with an in-flight funded `EscrowBalance` | Authority changes must never strand escrowed money. Ties to I-18/I-19 in [`04`](./04-payments-escrow-disputes.md). |

These are **policy**, configurable per org where noted; the platform ships safe defaults. None of them weaken the base rule — an action still must pass `authorize()` first; the guardrail is an *additional* gate.

---

## 6. Ownership transfers & lifecycle (enforcing I-3)

**I-3** says every principal has exactly one owner, never zero or two. The risky moments are transfers — handled explicitly so a principal is never orphaned.

- **`ArtistProfile` roster transfer ("the artist signed with a new agency").** The `ArtistProfile` is re-pointed from `Org` A to `Org` B. Requires consent from an `owner` of the losing side *or* a re-claim through verification authority (the artist's team re-asserts possession via [`03`](./03-trust-verification.md), which can override a stale association). The **principal identity never changes** — deals, reputation, and escrow history follow the `ArtistProfile`, not the `Org` (I-19 still routes future payouts to whoever owns it *now*). In-flight funded deals are settled or explicitly reassigned before the transfer completes (funded-deal lock, §5).
- **Org ownership transfer ("the principal is leaving / handing over").** A new `User` is promoted to `owner` before the old one is demoted/removed — the system never permits the last `owner` to leave without designating a successor (the "no zero owners" half of I-3). Step-up auth + notify-all (§5).
- **Org deletion / archival.** Blocked while any owned principal has a funded `EscrowBalance` or an open `Dispute`. Otherwise the `Org` is archived (soft), preserving the audit `Event` trail and reputation history; `Membership`s go `revoked`; `Listing`s go undiscoverable. Hard deletion is a [`03`](./03-trust-verification.md)/legal/PII concern, not a product action.
- **"At least one owner" invariant.** Enforced on every `Membership` mutation: you cannot revoke, suspend, or demote the **last** `active` `owner` of an `Org`. The UI surfaces "promote someone first."

---

## 7. Addressing a whole team vs an individual artist

This is the concrete payoff of I-12 and the answer to the `init-jot` festival/label-coordination ask. There are two distinct things a booker can address, and the model makes both first-class.

### 7.1 The two addressing modes

| Mode | What the booker targets | What resolves | When it's used |
| --- | --- | --- | --- |
| **Individual** | a specific `Listing` on one `ArtistProfile` | the `BookingRequest` targets that `ArtistProfile`; routing still resolves the managing `Org` for dedup (I-12) | The default: "I want to book *this* act for *this* date." |
| **Team / multi-artist** | the `Org` (the team), to coordinate several of its acts at once | a **co-routed set** of `BookingRequest`s, one per `ArtistProfile`, sharing a coordination context | Festival programming a label showcase; a brand wanting "any 2 of these 4 artists"; a promoter building a multi-act bill from one roster. |

Both are visible to the booker *because the team boundary is visible*: when a booker browses an act, the resolved `Org` is shown ("represented by Foo Management"), and the booker can pivot from "book this artist" to "this team also represents X, Y, Z — coordinate with the team." That discoverability is owned by [`08-profiles-pitches-discovery.md`](./08-profiles-pitches-discovery.md); the *routing* is owned here.

### 7.2 Group / multi-artist booking: the object

The spine left this open ("N co-routed `BookingRequest`s vs a new `BookingBundle` parent?"). **Decision for v1: N co-routed `BookingRequest`s, tied together by a lightweight `BookingGroup` coordination context — not N independent requests, and not a heavyweight bundle that fuses the deals.**

Rationale — the two extremes are both wrong:

- **N fully-independent requests** loses the coordination the `init-jot` explicitly asks for: the team can't see "these four asks are one festival's offer," can't negotiate them as a slate, and the booker re-enters event context four times.
- **A single fused `BookingBundle` deal** is wrong because each artist still negotiates its own `fee`/`private_floor`, confirms independently (the artist-side explicit confirm, I-10), signs its own `Contract`, and has its own `EscrowBalance` and `Payout` (I-19). Fusing them breaks per-artist authority, per-artist money, and per-artist confirmation.

So `BookingGroup` is a **coordination context**, not a deal:

- It carries the shared event `pitch` context once (event, venue, date, the booker), so the team sees the slate as one thing.
- Each member `BookingRequest` keeps its **own** deal lifecycle, `Offer` chain, `Agreement`, `EscrowBalance`, `Payout`, and **its own explicit artist-side confirm** (no group-confirm shortcut — I-10 holds per artist).
- It enables team-level views ("3 of 4 confirmed; 1 still negotiating") and team-level operations the matrix already permits (an `owner`/`agent` of the `Org` can triage the whole slate).
- A true fused bundle (one signature, one escrow across multiple acts) is a **Phase-2 candidate** if real demand appears — flagged here and in [`12-roadmap-risks-open-questions.md`](./12-roadmap-risks-open-questions.md). This matches the spine's open-question disposition.

```
   Booker (festival)
        │  one team request against Org "Foo Mgmt"
        ▼
   ┌─────────────── BookingGroup (coordination context) ───────────────┐
   │  shared: event pitch · venue · date window · booker principal      │
   │                                                                    │
   │   BookingRequest → Artist A   ── own Offer chain · Agreement ·     │
   │   BookingRequest → Artist B      EscrowBalance · Payout · CONFIRM  │
   │   BookingRequest → Artist C      (each independent; I-10/I-13/I-19)│
   └────────────────────────────────────────────────────────────────────┘
        │
        ▼  team-side: one inbox, one slate, role-gated by §3.2
   Foo Mgmt team (owner/agent triage the whole group)
```

### 7.3 Dedup of "same team" requests

The `init-jot` worry — *"avoid extra complications of having multiple requests for the same team"* — falls out of I-12 plus the resolved `Org`:

- **Detection.** Because every `BookingRequest` resolves the managing `Org`, the platform can see when one booker has multiple live requests landing on the **same `Org`** (whether for the same artist or different ones) within a window.
- **Co-routing, not blocking.** We do **not** hard-block a second request — a booker legitimately may want two of a team's acts. Instead we *surface and offer to coordinate*: "You already have a live request with Foo Management — add this to that conversation?" The team, in turn, sees both in one team inbox rather than as disconnected threads.
- **True duplicates** (same booker, same `Listing`, overlapping date, while one is already live) are deduped to the existing thread to avoid the team fielding two copies of the same ask — surfaced to the booker as "you already have this open."
- **The team inbox is the unit.** Because authority is `Org`-wide (§3.3.1), any `agent`/`owner` of the team sees and can act on the whole inbound surface; dedup and co-routing make that inbox coherent rather than a pile of near-identical threads.

This is the cleanest demonstration in the whole foundation that the actor-vs-principal + `Org` model *pays for itself*: three separate `init-jot` asks (roster, multi-artist coordination, same-team dedup) are not three features — they are one consequence of routing to the team principal.

---

## 8. Notifications & the team inbox (authority drives fan-out)

Per **I-21** (spine), a `Notification` fans out to the **principal's team** — the `User`s holding a qualifying `Membership` — not only to the actor who triggered the `Event`. This doc owns *which* members get *which* notifications, via role + preference:

- A new `BookingRequest` for an `ArtistProfile` notifies the `Org`'s `owner`/`agent` members (the people who can act on it), not `finance`/`viewer` by default.
- A `Payment`/`Payout`/escrow event notifies `owner`/`finance`.
- A "Prince is confirmed for [event]" event (the [`06`](./06-availability-confirmation.md) artifact) notifies the whole acting team — this is the moment everyone wants to see.

The fan-out is therefore *derived from the same `Membership` graph* that gates authority. There is no separate notification-recipient list to maintain: **who can act on it ≈ who hears about it**, filtered by role and per-`User` preference. The *delivery channels* (in-app/email/Slack via `Integration`) are owned by [`09-system-architecture.md`](./09-system-architecture.md); the *recipient resolution* is the `Membership` query specified here.

---

## 9. Open questions (carried, not blocking)

- **Scoped `agent` (per-artist authority).** v1 is `Org`-wide authority. Some large agencies will want "this agent handles only these 3 artists." Designed as a **future per-`Membership` roster scope** (an allow-list of `ArtistProfile`s on the `Membership`) — additive, not breaking, because `authorize()` already resolves through the roster edge (§3.3.1). Deferred to Phase 2; flagged in [`12-roadmap-risks-open-questions.md`](./12-roadmap-risks-open-questions.md).
- **Cross-org collaboration.** Co-management (two `Org`s share one `ArtistProfile`) and sub-agent / re-presentation chains exist in the real industry. I-3 says one owner; co-management would need an explicit secondary-grant model. Out of scope for v1; a likely Phase-2 entity.
- **Fused `BookingGroup` (one signature / one escrow over multiple acts).** §7.2 ships the coordination-context model; a true fused bundle is demand-gated and deferred.
- **Per-org policy surface.** Which guardrails in §5 (two-person rule, cool-down length, "agents may invite") are configurable vs fixed at launch — finalized alongside the trust & safety ops playbook in [`11-gtm-liquidity-trust-safety-ops.md`](./11-gtm-liquidity-trust-safety-ops.md).
- **`viewer` granularity.** Whether `viewer` should ever be restricted from seeing money figures (a "non-financial viewer") for junior staff. Leaning no for v1 (keep four clean roles); revisit if asked.

---

## 10. What this doc guarantees the rest of the foundation

| Consumer doc | What it can rely on from here |
| --- | --- |
| [`03-trust-verification.md`](./03-trust-verification.md) | The `Membership` invite/vouch state machine and `invited_by` chain to hang the counter-signature path on; the role-tiered identity gate hook at `accept`; "authority ≠ identity" (I-5) preserved. |
| [`04-payments-escrow-disputes.md`](./04-payments-escrow-disputes.md) | Exactly which roles may onboard KYB, change the payout account, release/refund — with separation of deal authority from money-destination authority, plus step-up/cool-down guardrails; payout resolves to the principal's account (I-19). |
| [`05-negotiation-deal-lifecycle.md`](./05-negotiation-deal-lifecycle.md) | Which roles may send/counter/accept/confirm/sign; that every transition is gated by one `authorize()` rule emitting an `Event` (I-2). |
| [`06-availability-confirmation.md`](./06-availability-confirmation.md) | That the explicit artist-side confirm is an `owner`/`agent`-only action, per artist, even inside a `BookingGroup` (I-10 preserved). |
| [`08-profiles-pitches-discovery.md`](./08-profiles-pitches-discovery.md) | The visible team boundary (`Org`) to power "represented by…" and team-addressing in discovery; roles allowed to edit profiles/listings. |
| [`09-system-architecture.md`](./09-system-architecture.md) | A single chokepoint authorization function over the `Membership` graph (the `identity` bounded context) and `Membership`-derived notification fan-out. |
| [`11`](./11-gtm-liquidity-trust-safety-ops.md) / [`12`](./12-roadmap-risks-open-questions.md) | The `staff` override surface, configurable guardrails, and the deferred-feature list (scoped agent, cross-org, fused bundle). |

---

*End of 07-roster-org-rbac.md — the authority layer. Entities and invariants are owned by [`02-domain-model.md`](./02-domain-model.md); amend the spine first, then reference it here.*
