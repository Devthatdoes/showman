This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

The app uses local system font stacks in `app/globals.css` so local and CI builds do not depend on remote font fetches.

## Local Environment

Copy `.env.example` to `.env` and keep `BETTER_AUTH_TRUSTED_ORIGINS` aligned with the port you are previewing. Local development allows `localhost:3000` through `localhost:3005` so the app does not reject auth requests when the preview server moves ports.

Artist image uploads currently use `ARTIST_MEDIA_STORAGE=local`, which writes development files to `web/public/uploads/artists`. That is not a production storage strategy; production needs a durable object-storage adapter behind the same catalog media boundary.

## Database and Workflow Foundation

Run migrations against Postgres before loading the app:

```bash
npm run migrate
```

The current schema includes Better Auth tables, `artist_profiles`, manual `availability_windows`, and the first workflow foundation tables:

- `orgs` and `memberships` for the actor/principal model.
- `booker_profiles` for the demand-side dossier.
- `booker_events` for booker coordination around a specific show or event.
- `booking_requests` for structured request/pitch records.
- `events` for append-only audit records.

This is still pre-transaction infrastructure. There is no live escrow, e-sign, offer/counter-offer chain, hold promotion, confirmation artifact, payment capture, payout, dispute flow, or production verification rail yet. Those later systems should attach to the workflow spine rather than bypass it.

## Verification

```bash
npx tsc --noEmit
npm run lint
npm test
```

`npm test` expects a running app and a reachable `DATABASE_URL` because the gate tests exercise the real auth and artist routes. Browser-facing changes should also be checked with Playwright from the repository root when the local browser environment is available.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
