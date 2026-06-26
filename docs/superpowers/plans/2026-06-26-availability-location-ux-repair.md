# Availability Location UX Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the owner availability workflow feel clickable, legible, and booking-aware while replacing free-form market entry with structured dev-safe location selections.

**Architecture:** Keep the database unchanged for this increment: `availability_windows.market` remains the persisted canonical display string, and travel policy is stored in the existing note field as human-readable Phase 0 context. Move calendar/date/location interaction into a focused client component that posts to the existing server action. Shared option data lives in a small module so later schema/API work can replace the storage without rewriting the UI.

**Tech Stack:** Next.js App Router, React client component for interaction, existing server actions, Tailwind CSS utility classes, Playwright for rendered verification.

## Global Constraints

- Do not add a third-party calendar or location dependency in this pass.
- Do not introduce a location database migration until the final location/search model is designed.
- Keep all public copy aligned with “real artists, real booking infrastructure, pushing culture forward.”
- Preserve owner-only gates on availability management.
- Update `docs/BUILD-JOURNAL.md` in this turn.

---

### Task 1: Shared Booking Location Options

**Files:**
- Create: `web/lib/booking-locations.ts`

**Interfaces:**
- Produces: `BOOKING_LOCATION_GROUPS`, an array of continent/country/region/city option groups.
- Produces: `TRAVEL_POLICY_OPTIONS`, stable values and labels for travel coverage.

- [ ] **Step 1: Create location option module**

Add a curated starter list with enough structure to prove the UX: North America, Europe, Asia, and Global/Fly-in markets. Each location option must expose a stable `value`, display `label`, and `searchText`.

- [ ] **Step 2: Typecheck**

Run: `cd web && npx tsc --noEmit`

Expected: pass.

### Task 2: Interactive Availability Composer

**Files:**
- Create: `web/components/availability/availability-composer.tsx`
- Modify: `web/app/artists/[slug]/availability/page.tsx`

**Interfaces:**
- Consumes: `AvailabilityWindow[]`, `BOOKING_LOCATION_GROUPS`, `TRAVEL_POLICY_OPTIONS`.
- Produces: hidden form fields `startDate`, `endDate`, `status`, `market`, and `note` for `addAvailabilityWindow`.

- [ ] **Step 1: Build client composer**

Create a `"use client"` component with:

- Clickable two-month date grid.
- First date click sets `startDate`; second click sets `endDate`; earlier second click swaps the range.
- Hover/focus/cursor states on every selectable date.
- Clear labels: `Taking requests` and `Not accepting`.
- Structured location search/select as chips grouped by region.
- Travel policy segmented control: `Travel covered`, `Case by case`, `Local only`.
- Hidden inputs matching the existing server action.

- [ ] **Step 2: Replace old add form and display-only calendar**

In the availability page, remove the old black native date fields and the non-clickable calendar section. Render `AvailabilityComposer` above the windows list.

- [ ] **Step 3: Preserve existing windows list**

Keep deletion and existing window rendering, but rename visible status labels to `Taking requests` / `Not accepting`.

### Task 3: Form and Badge Affordance Polish

**Files:**
- Modify: `web/components/ui/form.tsx`
- Modify: `web/components/ui/badge.tsx`

**Interfaces:**
- Produces clearer dark-field affordances for native date/select fallback uses.
- Produces less generic status badge styling.

- [ ] **Step 1: Improve field affordance**

Add pointer cursor for date/select controls where appropriate and explicit `color-scheme: dark` support via utility classes/CSS.

- [ ] **Step 2: Improve status badge language/style**

Keep tone names internally as `open` and `blocked`, but style them with more editorial, less default-app energy.

### Task 4: Verification and Journal

**Files:**
- Modify: `docs/BUILD-JOURNAL.md`

**Checks:**
- `cd web && npx tsc --noEmit`
- `cd web && npm run lint`
- `cd web && npm run build`
- Playwright screenshot pass on `/artists/[owned-slug]/availability` desktop/mobile.
- Playwright interaction: sign up/sign in, create a test profile if needed, open availability, click dates, select location, submit, confirm the window appears.

- [ ] **Step 1: Update journal**

Record the UX critique, the repair scope, verification results, and remaining follow-ups: full location schema, full profile customization, public/private artist access redesign, and landing page living gallery pass.
