# showman — Project Status

_Last updated: 2026-06-25_

A verified, direct artist-booking marketplace for the represented-artist tier: artists (or their teams) list a booking fee and verified bookers/curators/festivals book them directly, with escrowed payments, structured negotiation, and a polished "confirmed" moment. Origin brief: `init-jot`.

## Stack and infrastructure
- App in `web/`: Next.js 16 (App Router, TypeScript, Tailwind v4).
- PostgreSQL via Drizzle ORM. Local DB runs in Docker (container `showman-postgres`); connection in `web/.env` (see `web/.env.example`).
- Authentication: Better Auth (email/password), self-hosted, auth data in our own Postgres.
- CI: GitHub Actions on every pull request (typecheck, lint, migrations against a fresh Postgres, build).
- Repo: private on GitHub. Work happens on `feat/*` branches with one PR per increment.

## Foundation
The product and architecture foundation lives in `docs/foundation/` (12 reconciled documents plus `CONSISTENCY-REVIEW.md`). Locked decisions: full-stack TypeScript; Stripe Connect for payments/escrow when that lands (buy the regulated rails, build the trust logic); Better Auth for identity; user-level profile ownership now with organizations later.

## Shipped (merged to `main`)
- Phase 0 EPK: create, view, and list `ArtistProfile` (landing, `/artists`, `/artists/new`, `/artists/[slug]`).
- Availability calendar: manual `open` / `blocked` windows per artist, two-month grid, shown on the EPK.

## In review (open PRs)
- **#3** CI / GitHub Actions (base `main`).
- **#2** Email/password auth via Better Auth: sign-in / sign-up / sign-out, sessions, gated `/account`, global session-aware header (base `main`).
- **#4** Profile ownership: login-required create, owner-gated edit/delete and availability, "Your profiles" on the account page (stacked on #2).

Recommended merge order: #3, then #2, then #4 (which retargets to `main` after #2). Branch protection requiring the CI check is to be enabled once #3 is merged.

## Data model
Tables: `artist_profiles` (with `owner_user_id`), `availability_windows`, and the Better Auth tables `user` / `session` / `account` / `verification`. Migrations `0000`–`0001` are on `main`; `0002` (auth) and `0003` (ownership) arrive with PRs #2 and #4.

## Run locally
1. Start Postgres (Docker): a `showman-postgres` container on port 5432 (user/password/db all `showman`).
2. `cd web && cp .env.example .env`, then set `BETTER_AUTH_SECRET` (e.g. `openssl rand -base64 32`).
3. `npm install`
4. `npx tsx db/migrate.ts` (apply migrations)
5. `npm run dev` then open http://localhost:3000
- Local test account (after auth is merged/active): `founder@showman.test` / `supersecret123`.

## Conventions
- One PR per increment on a `feat/*` branch; CI must pass before merge.
- Schema changes are made in `web/db/schema.ts` and applied with `npx drizzle-kit generate && npx tsx db/migrate.ts`.

## Next up
- Organizations / teams / RBAC: members, roles, invitations, and acting on behalf of an artist (doc `07`). This is the next increment.

## Later (sequenced)
- Verification: artist authenticity and authority via OAuth account-linking plus public-source authority-chaining (doc `03`).
- Fee visibility gated to verified bookers only (docs `02` / `08`).
- Booking transaction core: offer/counter negotiation, deposit and escrow, disputes (docs `04` / `05`).
- CD (auto-deploy) once a hosting target is chosen (e.g. Vercel plus a managed Postgres).
