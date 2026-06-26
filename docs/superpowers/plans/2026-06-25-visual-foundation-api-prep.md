# Visual Foundation and API-First Prep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the current Phase 0 app around a reusable Raw Gallery carbon/bone/orange design foundation while extracting artist/profile data access into a small internal catalog server boundary.

**Architecture:** Keep the Next.js App Router app as the single deployable monolith. Extract current Drizzle reads/writes from pages and server actions into `web/server/catalog/*` so pages, actions, and future API route handlers can share the same logic. Build a small local UI component foundation under `web/components/ui/*` and apply it to existing pages only.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Drizzle ORM, PostgreSQL, Better Auth, Node test runner.

## Global Constraints

- Visual direction: Raw Gallery with carbon, bone, and orange.
- Product voice: raw and alive, but concrete enough for money, contracts, and professional booking.
- Avoid copy that frames agents or managers as enemies.
- Do not use "no middleman," "disrupt the industry," or "democratize."
- No new database tables.
- No booking, payment, escrow, dispute, contract, verification, org/RBAC, native iOS, or production mobile API work.
- Do not introduce a third-party design system.
- Current auth/ownership behavior must remain intact.
- Keep implementation mobile-first and usable at mobile-width viewports.
- Keep `.superpowers/` ignored.

---

## File Structure

### New files

- `web/server/catalog/types.ts` — catalog-facing types and form parsing helpers shared by mutations/actions.
- `web/server/catalog/queries.ts` — read functions for profiles and availability.
- `web/server/catalog/mutations.ts` — write functions that enforce current user-level ownership.
- `web/components/ui/button.tsx` — shared button/link class helper and button style constants.
- `web/components/ui/panel.tsx` — reusable panel/card class helper.
- `web/components/ui/form.tsx` — reusable form field class constants.
- `web/components/ui/badge.tsx` — reusable badge/status class helper.

### Modified files

- `web/app/globals.css` — global tokens, carbon/bone/orange theme, base body styling.
- `web/app/layout.tsx` — metadata and body background alignment.
- `web/components/site-header.tsx` — Raw Gallery app shell/header.
- `web/app/page.tsx` — product-forward landing page.
- `web/app/artists/page.tsx` — polished artist directory using catalog query.
- `web/app/artists/[slug]/page.tsx` — polished public profile using catalog queries.
- `web/app/artists/new/page.tsx` — shared form styling.
- `web/app/artists/[slug]/edit/page.tsx` — catalog query and shared form styling.
- `web/app/artists/[slug]/availability/page.tsx` — catalog query and shared UI styling.
- `web/app/artists/actions.ts` — call catalog mutations instead of direct Drizzle writes.
- `web/app/artists/[slug]/availability/actions.ts` — call catalog mutations instead of direct Drizzle writes.
- `web/app/sign-in/page.tsx` — shared auth styling and voice.
- `web/app/sign-up/page.tsx` — shared auth styling and voice.
- `web/app/account/page.tsx` — catalog query and shared UI styling.
- `web/tests/gates.test.mjs` — keep existing gate coverage; add assertions only if route outcomes change.
- `docs/BUILD-JOURNAL.md` — append implementation notes and deviations.

---

### Task 1: Extract Internal Catalog Server Boundary

**Files:**
- Create: `web/server/catalog/types.ts`
- Create: `web/server/catalog/queries.ts`
- Create: `web/server/catalog/mutations.ts`
- Modify: `web/app/artists/actions.ts`
- Modify: `web/app/artists/[slug]/availability/actions.ts`
- Modify: `web/app/artists/[slug]/edit/page.tsx`
- Modify: `web/app/artists/[slug]/availability/page.tsx`
- Modify: `web/app/artists/page.tsx`
- Modify: `web/app/artists/[slug]/page.tsx`
- Modify: `web/app/account/page.tsx`
- Test: `web/tests/gates.test.mjs`

**Interfaces:**
- Consumes: `db` from `@/db`, `artistProfiles` and `availabilityWindows` from `@/db/schema`, Drizzle operators.
- Produces:
  - `parseArtistProfileFormData(formData: FormData): ArtistProfileFields`
  - `listArtistProfiles(): Promise<ArtistProfile[]>`
  - `getArtistProfileBySlug(slug: string): Promise<ArtistProfile | undefined>`
  - `getUpcomingOpenAvailabilityForArtist(artistId: string, today?: string): Promise<AvailabilityWindow[]>`
  - `listAvailabilityForArtist(artistId: string): Promise<AvailabilityWindow[]>`
  - `listArtistProfilesForOwner(ownerUserId: string): Promise<ArtistProfile[]>`
  - `createArtistProfileForUser(ownerUserId: string, formData: FormData): Promise<string>`
  - `updateOwnedArtistProfile(ownerUserId: string, slug: string, formData: FormData): Promise<string>`
  - `deleteOwnedArtistProfile(ownerUserId: string, slug: string): Promise<void>`
  - `requireOwnedArtist(ownerUserId: string, slug: string): Promise<ArtistProfile>`
  - `addAvailabilityWindowForOwnedArtist(ownerUserId: string, formData: FormData): Promise<string>`
  - `deleteAvailabilityWindowForOwnedArtist(ownerUserId: string, formData: FormData): Promise<string>`

- [ ] **Step 1: Add catalog types and form parsing**

Create `web/server/catalog/types.ts`:

```ts
import type { ArtistProfile, AvailabilityWindow } from "@/db/schema";

export type ArtistProfileFields = {
  stageName: string;
  bio: string | null;
  homeMarket: string | null;
  genres: string[];
};

export type ArtistProfileSummary = Pick<
  ArtistProfile,
  "id" | "slug" | "stageName" | "bio" | "genres" | "homeMarket" | "ownerUserId" | "createdAt" | "updatedAt"
>;

export type ArtistAvailabilityWindow = AvailabilityWindow;

export function slugifyArtistName(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "artist"
  );
}

export function parseArtistProfileFormData(formData: FormData): ArtistProfileFields {
  const stageName = ((formData.get("stageName") as string | null) ?? "").trim();
  const bio = ((formData.get("bio") as string | null) ?? "").trim() || null;
  const homeMarket = ((formData.get("homeMarket") as string | null) ?? "").trim() || null;
  const genres = ((formData.get("genres") as string | null) ?? "")
    .split(",")
    .map((genre) => genre.trim())
    .filter((genre) => genre.length > 0);

  return { stageName, bio, homeMarket, genres };
}
```

- [ ] **Step 2: Add catalog query functions**

Create `web/server/catalog/queries.ts`:

```ts
import { db } from "@/db";
import type { ArtistProfile, AvailabilityWindow } from "@/db/schema";

export async function listArtistProfiles(): Promise<ArtistProfile[]> {
  return db.query.artistProfiles.findMany({
    orderBy: (artist, { desc }) => desc(artist.createdAt),
  });
}

export async function listArtistProfilesForOwner(ownerUserId: string): Promise<ArtistProfile[]> {
  return db.query.artistProfiles.findMany({
    where: (artist, { eq }) => eq(artist.ownerUserId, ownerUserId),
    orderBy: (artist, { desc }) => desc(artist.createdAt),
  });
}

export async function getArtistProfileBySlug(slug: string): Promise<ArtistProfile | undefined> {
  return db.query.artistProfiles.findFirst({
    where: (artist, { eq }) => eq(artist.slug, slug),
  });
}

export async function getUpcomingOpenAvailabilityForArtist(
  artistId: string,
  today = new Date().toISOString().slice(0, 10),
): Promise<AvailabilityWindow[]> {
  return db.query.availabilityWindows.findMany({
    where: (window, { and, eq, gte }) =>
      and(eq(window.artistId, artistId), eq(window.status, "open"), gte(window.endDate, today)),
    orderBy: (window, { asc }) => asc(window.startDate),
    limit: 3,
  });
}

export async function listAvailabilityForArtist(artistId: string): Promise<AvailabilityWindow[]> {
  return db.query.availabilityWindows.findMany({
    where: (window, { eq }) => eq(window.artistId, artistId),
    orderBy: (window, { asc }) => asc(window.startDate),
  });
}
```

- [ ] **Step 3: Add catalog mutation functions**

Create `web/server/catalog/mutations.ts`:

```ts
import { db } from "@/db";
import { artistProfiles, availabilityWindows, type ArtistProfile } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import {
  parseArtistProfileFormData,
  slugifyArtistName,
} from "./types";
import { getArtistProfileBySlug } from "./queries";

export async function requireOwnedArtist(
  ownerUserId: string,
  slug: string,
): Promise<ArtistProfile> {
  const artist = await getArtistProfileBySlug(slug);
  if (!artist) throw new Error("Artist not found");
  if (artist.ownerUserId !== ownerUserId) throw new Error("Not authorized");
  return artist;
}

export async function createArtistProfileForUser(
  ownerUserId: string,
  formData: FormData,
): Promise<string> {
  const { stageName, bio, homeMarket, genres } = parseArtistProfileFormData(formData);
  if (!stageName) throw new Error("Stage name is required");

  const base = slugifyArtistName(stageName);
  let slug = base;
  const existing = await getArtistProfileBySlug(slug);
  if (existing) slug = `${base}-${Date.now().toString(36).slice(-4)}`;

  await db.insert(artistProfiles).values({
    slug,
    stageName,
    bio,
    homeMarket,
    genres,
    ownerUserId,
  });

  return slug;
}

export async function updateOwnedArtistProfile(
  ownerUserId: string,
  slug: string,
  formData: FormData,
): Promise<string> {
  const profile = await requireOwnedArtist(ownerUserId, slug);
  const { stageName, bio, homeMarket, genres } = parseArtistProfileFormData(formData);
  if (!stageName) throw new Error("Stage name is required");

  await db
    .update(artistProfiles)
    .set({ stageName, bio, homeMarket, genres, updatedAt: new Date() })
    .where(eq(artistProfiles.id, profile.id));

  return profile.slug;
}

export async function deleteOwnedArtistProfile(
  ownerUserId: string,
  slug: string,
): Promise<void> {
  const profile = await requireOwnedArtist(ownerUserId, slug);
  await db.delete(artistProfiles).where(eq(artistProfiles.id, profile.id));
}

export async function addAvailabilityWindowForOwnedArtist(
  ownerUserId: string,
  formData: FormData,
): Promise<string> {
  const slug = (formData.get("slug") as string | null)?.trim() ?? "";
  const startDate = (formData.get("startDate") as string | null)?.trim() ?? "";
  const rawEnd = (formData.get("endDate") as string | null)?.trim() ?? "";
  const endDate = rawEnd || startDate;
  const rawStatus = (formData.get("status") as string | null)?.trim() ?? "";
  const status: "open" | "blocked" = rawStatus === "blocked" ? "blocked" : "open";
  const market = ((formData.get("market") as string | null)?.trim() ?? "") || null;
  const note = ((formData.get("note") as string | null)?.trim() ?? "") || null;

  if (!startDate) throw new Error("Start date is required");
  if (endDate < startDate) throw new Error("End date must be on or after start date");

  const artist = await requireOwnedArtist(ownerUserId, slug);

  await db.insert(availabilityWindows).values({
    artistId: artist.id,
    startDate,
    endDate,
    status,
    market,
    note,
  });

  return slug;
}

export async function deleteAvailabilityWindowForOwnedArtist(
  ownerUserId: string,
  formData: FormData,
): Promise<string> {
  const id = (formData.get("id") as string | null)?.trim() ?? "";
  const slug = (formData.get("slug") as string | null)?.trim() ?? "";
  const artist = await requireOwnedArtist(ownerUserId, slug);

  if (id) {
    await db
      .delete(availabilityWindows)
      .where(and(eq(availabilityWindows.id, id), eq(availabilityWindows.artistId, artist.id)));
  }

  return slug;
}
```

- [ ] **Step 4: Refactor artist actions to use catalog mutations**

Replace the body of `web/app/artists/actions.ts` with:

```ts
"use server";

import { getCurrentUser } from "@/lib/session";
import {
  createArtistProfileForUser,
  deleteOwnedArtistProfile,
  updateOwnedArtistProfile,
} from "@/server/catalog/mutations";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createArtistProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const slug = await createArtistProfileForUser(user.id, formData);

  revalidatePath("/artists");
  redirect(`/artists/${slug}`);
}

export async function updateArtistProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const slug = ((formData.get("slug") as string | null) ?? "").trim();
  const updatedSlug = await updateOwnedArtistProfile(user.id, slug, formData);

  revalidatePath("/artists");
  revalidatePath(`/artists/${updatedSlug}`);
  redirect(`/artists/${updatedSlug}`);
}

export async function deleteArtistProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const slug = ((formData.get("slug") as string | null) ?? "").trim();
  await deleteOwnedArtistProfile(user.id, slug);

  revalidatePath("/artists");
  redirect("/artists");
}
```

- [ ] **Step 5: Refactor availability actions to use catalog mutations**

Replace the body of `web/app/artists/[slug]/availability/actions.ts` with:

```ts
"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import {
  addAvailabilityWindowForOwnedArtist,
  deleteAvailabilityWindowForOwnedArtist,
} from "@/server/catalog/mutations";

export async function addAvailabilityWindow(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("You must be signed in");

  const slug = await addAvailabilityWindowForOwnedArtist(user.id, formData);

  revalidatePath(`/artists/${slug}/availability`);
  revalidatePath(`/artists/${slug}`);
}

export async function deleteAvailabilityWindow(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("You must be signed in");

  const slug = await deleteAvailabilityWindowForOwnedArtist(user.id, formData);

  revalidatePath(`/artists/${slug}/availability`);
  revalidatePath(`/artists/${slug}`);
}
```

- [ ] **Step 6: Update pages to use catalog queries**

Change direct `db.query.artistProfiles` and `db.query.availabilityWindows` calls in these pages to use the query functions:

```ts
import {
  getArtistProfileBySlug,
  getUpcomingOpenAvailabilityForArtist,
  listArtistProfiles,
  listArtistProfilesForOwner,
  listAvailabilityForArtist,
} from "@/server/catalog/queries";
```

Apply exact replacements:

- `web/app/artists/page.tsx`: replace `db.query.artistProfiles.findMany(...)` with `await listArtistProfiles()`.
- `web/app/artists/[slug]/page.tsx`: replace profile lookup with `await getArtistProfileBySlug(slug)` and upcoming windows with `await getUpcomingOpenAvailabilityForArtist(artist.id)`.
- `web/app/artists/[slug]/edit/page.tsx`: replace profile lookup with `await getArtistProfileBySlug(slug)`.
- `web/app/artists/[slug]/availability/page.tsx`: replace profile lookup with `await getArtistProfileBySlug(slug)` and windows with `await listAvailabilityForArtist(artist.id)`.
- `web/app/account/page.tsx`: replace owner profile query with `await listArtistProfilesForOwner(user.id)`.

Remove unused `db` imports after each replacement.

- [ ] **Step 7: Run verification for behavior preservation**

Run:

```bash
cd web
npx tsc --noEmit
npm run lint
```

Expected: both pass.

If a type error appears because `findFirst` returns `ArtistProfile | undefined`, keep existing `notFound()` and redirect guards; do not use non-null assertions.

- [ ] **Step 8: Commit Task 1**

```bash
git add web/server/catalog web/app/artists/actions.ts web/app/artists/[slug]/availability/actions.ts web/app/artists/page.tsx web/app/artists/[slug]/page.tsx web/app/artists/[slug]/edit/page.tsx web/app/artists/[slug]/availability/page.tsx web/app/account/page.tsx
git commit -m "refactor: add catalog server boundary"
```

---

### Task 2: Add Visual Tokens and Shared UI Primitives

**Files:**
- Modify: `web/app/globals.css`
- Modify: `web/app/layout.tsx`
- Create: `web/components/ui/button.tsx`
- Create: `web/components/ui/panel.tsx`
- Create: `web/components/ui/form.tsx`
- Create: `web/components/ui/badge.tsx`

**Interfaces:**
- Consumes: Tailwind class names.
- Produces:
  - `buttonStyles(intent?: ButtonIntent): string`
  - `panelStyles(tone?: PanelTone): string`
  - `fieldClassName: string`
  - `labelClassName: string`
  - `helpTextClassName: string`
  - `badgeStyles(tone?: BadgeTone): string`

- [ ] **Step 1: Update global theme tokens**

Replace `web/app/globals.css` with:

```css
@import "tailwindcss";

:root {
  --background: #090908;
  --foreground: #fff8ec;
  --showman-carbon: #090908;
  --showman-carbon-2: #11100e;
  --showman-carbon-3: #1b1916;
  --showman-bone: #fff8ec;
  --showman-muted: #b8ad9d;
  --showman-line: rgba(255, 248, 236, 0.12);
  --showman-orange: #ff7a1a;
  --showman-orange-strong: #ff5f00;
  --showman-danger: #ff5c7a;
  --showman-success: #6ee7a8;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

* {
  box-sizing: border-box;
}

html {
  background: var(--showman-carbon);
}

body {
  min-height: 100vh;
  background:
    radial-gradient(circle at 78% 0%, rgba(255, 122, 26, 0.18), transparent 34rem),
    radial-gradient(circle at 8% 42%, rgba(255, 248, 236, 0.05), transparent 30rem),
    var(--showman-carbon);
  color: var(--showman-bone);
  font-family: Arial, Helvetica, sans-serif;
}

::selection {
  background: rgba(255, 122, 26, 0.35);
  color: var(--showman-bone);
}

input,
textarea,
select,
button {
  font: inherit;
}
```

- [ ] **Step 2: Update layout metadata and body classes**

In `web/app/layout.tsx`, change metadata to:

```ts
export const metadata: Metadata = {
  title: "showman",
  description: "Booking infrastructure for the next wave of live culture.",
};
```

Keep the Geist font setup, and set the body to:

```tsx
<body className="min-h-full bg-background text-foreground antialiased">
  <SiteHeader />
  {children}
</body>
```

- [ ] **Step 3: Add button style helper**

Create `web/components/ui/button.tsx`:

```tsx
export type ButtonIntent = "primary" | "secondary" | "ghost" | "danger";

const base =
  "inline-flex min-h-10 items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--showman-orange)] disabled:pointer-events-none disabled:opacity-60";

const intents: Record<ButtonIntent, string> = {
  primary:
    "bg-[var(--showman-orange)] text-[#160b02] hover:bg-[var(--showman-orange-strong)]",
  secondary:
    "border border-[var(--showman-line)] bg-[rgba(255,248,236,0.04)] text-[var(--showman-bone)] hover:bg-[rgba(255,248,236,0.09)]",
  ghost:
    "text-[var(--showman-muted)] hover:text-[var(--showman-bone)] hover:bg-[rgba(255,248,236,0.06)]",
  danger:
    "border border-[rgba(255,92,122,0.45)] bg-transparent text-[var(--showman-danger)] hover:bg-[rgba(255,92,122,0.1)]",
};

export function buttonStyles(intent: ButtonIntent = "primary"): string {
  return `${base} ${intents[intent]}`;
}
```

- [ ] **Step 4: Add panel style helper**

Create `web/components/ui/panel.tsx`:

```ts
export type PanelTone = "default" | "subtle" | "elevated";

const base = "border border-[var(--showman-line)]";

const tones: Record<PanelTone, string> = {
  default: "rounded-2xl bg-[rgba(17,16,14,0.78)]",
  subtle: "rounded-2xl bg-[rgba(255,248,236,0.035)]",
  elevated: "rounded-3xl bg-[rgba(17,16,14,0.9)] shadow-2xl shadow-black/30",
};

export function panelStyles(tone: PanelTone = "default"): string {
  return `${base} ${tones[tone]}`;
}
```

- [ ] **Step 5: Add form style constants**

Create `web/components/ui/form.tsx`:

```ts
export const labelClassName =
  "text-xs font-semibold uppercase tracking-[0.16em] text-[var(--showman-muted)]";

export const fieldClassName =
  "w-full rounded-xl border border-[var(--showman-line)] bg-[rgba(9,9,8,0.72)] px-4 py-3 text-sm text-[var(--showman-bone)] placeholder:text-[rgba(184,173,157,0.55)] focus:border-[var(--showman-orange)] focus:outline-none";

export const helpTextClassName = "text-xs leading-relaxed text-[var(--showman-muted)]";
```

- [ ] **Step 6: Add badge style helper**

Create `web/components/ui/badge.tsx`:

```ts
export type BadgeTone = "default" | "orange" | "open" | "blocked" | "muted";

const base =
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold";

const tones: Record<BadgeTone, string> = {
  default:
    "border-[var(--showman-line)] bg-[rgba(255,248,236,0.04)] text-[var(--showman-bone)]",
  orange:
    "border-[rgba(255,122,26,0.45)] bg-[rgba(255,122,26,0.14)] text-[#ffb06a]",
  open:
    "border-[rgba(110,231,168,0.45)] bg-[rgba(110,231,168,0.12)] text-[var(--showman-success)]",
  blocked:
    "border-[rgba(255,92,122,0.45)] bg-[rgba(255,92,122,0.12)] text-[var(--showman-danger)]",
  muted:
    "border-[var(--showman-line)] bg-transparent text-[var(--showman-muted)]",
};

export function badgeStyles(tone: BadgeTone = "default"): string {
  return `${base} ${tones[tone]}`;
}
```

- [ ] **Step 7: Run style foundation checks**

Run:

```bash
cd web
npx tsc --noEmit
npm run lint
```

Expected: both pass.

- [ ] **Step 8: Commit Task 2**

```bash
git add web/app/globals.css web/app/layout.tsx web/components/ui
git commit -m "feat(ui): add showman visual foundation"
```

---

### Task 3: Polish App Shell, Landing, Artist Directory, and Profile

**Files:**
- Modify: `web/components/site-header.tsx`
- Modify: `web/app/page.tsx`
- Modify: `web/app/artists/page.tsx`
- Modify: `web/app/artists/[slug]/page.tsx`

**Interfaces:**
- Consumes: `buttonStyles`, `panelStyles`, `badgeStyles`, catalog queries from Task 1.
- Produces: polished public browsing surfaces with no behavior changes.

- [ ] **Step 1: Restyle shared header**

Update `web/components/site-header.tsx` to use `buttonStyles("primary")` for sign-up and quiet text links. Preserve session behavior:

```tsx
import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/sign-out-button";
import { buttonStyles } from "@/components/ui/button";

export default async function SiteHeader() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--showman-line)] bg-[rgba(9,9,8,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-5">
          <Link href="/" className="text-xl font-black tracking-[-0.06em] text-[var(--showman-bone)]">
            showman
          </Link>
          <Link
            href="/artists"
            className="hidden text-sm font-medium text-[var(--showman-muted)] transition-colors hover:text-[var(--showman-bone)] sm:inline"
          >
            Artists
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {session ? (
            <>
              <Link
                href="/account"
                className="max-w-32 truncate text-sm font-medium text-[var(--showman-bone)] hover:text-[#ffb06a] sm:max-w-none"
              >
                {session.user.name || session.user.email}
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/sign-in" className={buttonStyles("ghost")}>
                Sign in
              </Link>
              <Link href="/sign-up" className={buttonStyles("primary")}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Restyle landing page**

Replace `web/app/page.tsx` with a product-forward landing page:

```tsx
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { panelStyles } from "@/components/ui/panel";

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto grid min-h-[calc(100vh-65px)] max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-[#ffb06a]">
            Verified artist booking
          </p>
          <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-[var(--showman-bone)] sm:text-7xl lg:text-8xl">
            Booking rails for the next wave of live culture.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[var(--showman-muted)] sm:text-lg">
            Real artists, authorized teams, visible availability, and direct booking infrastructure for people pushing the needle and putting scenes on.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/artists" className={buttonStyles("primary")}>
              Browse artists
            </Link>
            <Link href="/artists/new" className={buttonStyles("secondary")}>
              Create artist profile
            </Link>
          </div>
        </div>

        <div className={`${panelStyles("elevated")} p-4 sm:p-5`}>
          <div className="aspect-[4/5] rounded-2xl border border-[var(--showman-line)] bg-[radial-gradient(circle_at_70%_20%,rgba(255,122,26,0.34),transparent_32%),linear-gradient(145deg,#25211c,#0f0e0d)] p-5">
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-[var(--showman-muted)]">
                <span>artist profile</span>
                <span className="text-[#ffb06a]">open dates</span>
              </div>
              <div>
                <p className="text-4xl font-black uppercase leading-none tracking-[-0.06em]">
                  Find the act.
                  <br />
                  Hold the date.
                  <br />
                  Make it real.
                </p>
                <p className="mt-4 max-w-xs text-sm leading-6 text-[var(--showman-muted)]">
                  Phase 0 is live with artist profiles and availability. Booking and escrow come next.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: Restyle artist directory**

In `web/app/artists/page.tsx`, keep the `listArtistProfiles()` query from Task 1 and render cards using `panelStyles("subtle")`, `badgeStyles("muted")`, and orange primary links. Empty state copy:

```tsx
<p className="text-sm text-[var(--showman-muted)]">
  No artists yet. Put the first profile on the board.
</p>
```

Each artist card must keep `href={`/artists/${artist.slug}`}` and show `stageName`, `homeMarket`, and genres.

- [ ] **Step 4: Restyle public artist profile**

In `web/app/artists/[slug]/page.tsx`, preserve existing owner logic and upcoming availability logic. Restyle:

- Use a two-column responsive layout on desktop.
- Left side: image-ready placeholder panel with artist initials or stage name.
- Right side: artist name, market, genre badges, bio, availability list.
- Use orange only for the primary owner action or key accent.
- Keep owner-only links to edit profile and manage availability.

- [ ] **Step 5: Run public surface checks**

Run:

```bash
cd web
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all pass.

- [ ] **Step 6: Commit Task 3**

```bash
git add web/components/site-header.tsx web/app/page.tsx web/app/artists/page.tsx web/app/artists/[slug]/page.tsx
git commit -m "feat(ui): polish public showman surfaces"
```

---

### Task 4: Polish Forms, Auth, Account, and Availability Management

**Files:**
- Modify: `web/app/artists/new/page.tsx`
- Modify: `web/app/artists/[slug]/edit/page.tsx`
- Modify: `web/app/artists/[slug]/availability/page.tsx`
- Modify: `web/app/sign-in/page.tsx`
- Modify: `web/app/sign-up/page.tsx`
- Modify: `web/app/account/page.tsx`
- Modify: `web/components/sign-out-button.tsx`

**Interfaces:**
- Consumes: UI primitives from Task 2 and catalog queries from Task 1.
- Produces: polished owner/auth surfaces with existing auth and ownership behavior preserved.

- [ ] **Step 1: Restyle shared sign-out button**

Update `web/components/sign-out-button.tsx` to use the ghost/secondary visual language while preserving existing sign-out behavior. If it is a client component, keep `"use client"` intact and import only `buttonStyles`.

- [ ] **Step 2: Restyle create/edit profile forms**

In `web/app/artists/new/page.tsx` and `web/app/artists/[slug]/edit/page.tsx`:

- Use `fieldClassName`, `labelClassName`, and `helpTextClassName`.
- Use `buttonStyles("primary")` for submit.
- Use `buttonStyles("secondary")` for cancel/back.
- Use `panelStyles("elevated")` for the form panel.
- Preserve form field names exactly: `stageName`, `homeMarket`, `genres`, `bio`, and hidden `slug` on edit.

Create page intro copy:

```tsx
Create the profile that helps real bookers understand your sound, market, and next open dates.
```

- [ ] **Step 3: Restyle danger zone**

In `web/app/artists/[slug]/edit/page.tsx`, keep the delete form action and hidden `slug`. Use `buttonStyles("danger")` for the delete button and a subdued panel.

- [ ] **Step 4: Restyle auth pages**

In `web/app/sign-in/page.tsx` and `web/app/sign-up/page.tsx`:

- Keep existing Better Auth client calls and redirects.
- Use `panelStyles("elevated")`.
- Use `fieldClassName` and `labelClassName`.
- Use `buttonStyles("primary")` for submit.
- Update copy to match voice:

```tsx
<p className="mt-2 text-sm text-[var(--showman-muted)]">
  Access profiles, availability, and the booking rails as they come online.
</p>
```

- [ ] **Step 5: Restyle account page**

In `web/app/account/page.tsx`:

- Preserve redirect to `/sign-in`.
- Preserve session display and owned profiles.
- Use `listArtistProfilesForOwner(user.id)` from Task 1.
- Use panels and buttons from Task 2.
- Use copy:

```tsx
Your profiles are the supply-side base of showman. Orgs, teams, and on-behalf-of roles come next.
```

- [ ] **Step 6: Restyle availability management**

In `web/app/artists/[slug]/availability/page.tsx`:

- Preserve owner redirect behavior.
- Use `fieldClassName`, `labelClassName`, `helpTextClassName`, `buttonStyles`, `panelStyles`, and `badgeStyles`.
- Keep form field names exactly: `slug`, `startDate`, `endDate`, `status`, `market`, `note`.
- Keep calendar helper behavior: blocked overrides open, current month plus next month.
- Use orange for submit, green for open status, danger color for blocked status.

- [ ] **Step 7: Run owner/auth checks**

Run:

```bash
cd web
npx tsc --noEmit
npm run lint
npm run build
```

Expected: all pass.

If a local Postgres and environment are available, also run:

```bash
cd web
npm run test
```

Expected: all auth/ownership gate tests pass.

- [ ] **Step 8: Commit Task 4**

```bash
git add web/app/artists/new/page.tsx web/app/artists/[slug]/edit/page.tsx web/app/artists/[slug]/availability/page.tsx web/app/sign-in/page.tsx web/app/sign-up/page.tsx web/app/account/page.tsx web/components/sign-out-button.tsx
git commit -m "feat(ui): polish owner and auth surfaces"
```

---

### Task 5: Verify, Browser Review, and Document Deviations

**Files:**
- Modify: `docs/BUILD-JOURNAL.md`
- Modify: `docs/superpowers/plans/2026-06-25-visual-foundation-api-prep.md` only if implementation reality changes the plan before completion.
- Test: current app in browser.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: final verification record and notes for follow-up.

- [ ] **Step 1: Run full automated checks**

Run:

```bash
cd web
npx tsc --noEmit
npm run lint
npx tsx db/migrate.ts
npm run build
```

Expected: all pass.

If Postgres and runtime env are available:

```bash
cd web
npm run test
```

Expected: existing gate tests pass.

- [ ] **Step 2: Start local app for visual review**

Run:

```bash
cd web
npm run dev
```

Open `http://localhost:3000`.

- [ ] **Step 3: Review desktop and mobile surfaces**

Check these routes at desktop width and mobile width:

- `/`
- `/artists`
- `/artists/[existing-slug]`
- `/sign-in`
- `/sign-up`
- `/account` signed in
- `/artists/new` signed in
- `/artists/[owned-slug]/edit` signed in as owner
- `/artists/[owned-slug]/availability` signed in as owner

Expected:

- No overlapping text or controls.
- Header remains usable on mobile.
- Primary actions use orange consistently.
- Forms remain readable and tappable on mobile.
- Public pages still work while signed out.
- Owner-only pages still redirect for anonymous and non-owner users.

- [ ] **Step 4: Update build journal**

Append to `docs/BUILD-JOURNAL.md`:

```md
## 2026-06-25 — Visual foundation implementation

### Shipped

- Added internal catalog server boundary for profile and availability reads/writes.
- Added reusable UI primitives for buttons, panels, fields, and badges.
- Restyled current Phase 0 public, auth, owner, and availability surfaces around the carbon/bone/orange Raw Gallery direction.

### Verification

- Typecheck:
- Lint:
- Migration:
- Build:
- Gate tests:
- Browser review:

### Follow-Ups

- Public JSON read endpoints for artist discovery/profile after visual foundation stabilizes.
- Org/RBAC planning remains the next major domain increment.
```

Fill each verification bullet with `passed`, `not run`, or the exact failure summary.

- [ ] **Step 5: Commit Task 5**

```bash
git add docs/BUILD-JOURNAL.md
git commit -m "docs: record visual foundation implementation"
```

---

## Subagent Execution Guidance

Recommended subagent-driven split:

- Worker 1 owns Task 1 only: `web/server/catalog/*` and direct DB-query refactors.
- Worker 2 owns Task 2 only: global CSS and `web/components/ui/*`.
- Main agent should integrate Tasks 3 and 4 after Tasks 1 and 2 land, because those page files depend on both prior tasks and are more likely to overlap.
- A review/verification subagent can inspect the final diff for consistency and missed direct DB calls after implementation.

Workers must not revert unrelated user changes. Workers must list every file they changed in their final response.

## Plan Self-Review

- Spec coverage: Tasks cover visual direction, voice, reusable components, current Phase 0 pages, internal catalog boundary, verification, subagent workflow, and documentation.
- Placeholder scan: no placeholder markers are intentionally left in task steps.
- Type consistency: function names in Task 1 interfaces match the code snippets and usage instructions.
