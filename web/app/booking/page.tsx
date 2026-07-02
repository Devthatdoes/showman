import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { panelStyles } from "@/components/ui/panel";
import { getCurrentUser } from "@/lib/session";
import { getActorWorkspace } from "@/server/identity/queries";

export const dynamic = "force-dynamic";

export default async function BookingPage() {
  const user = await getCurrentUser();
  const workspace = user ? await getActorWorkspace(user.id) : null;
  const bookerProfile = workspace?.bookerProfile ?? null;
  const orgs = workspace?.orgs ?? [];

  return (
    <main className="min-h-screen px-4 pb-20 pt-28 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className={`${panelStyles("elevated")} overflow-hidden p-6 sm:p-10`}>
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#ffb06a]">
                Booking
              </p>
              <h1 className="mt-5 max-w-4xl text-5xl font-black uppercase leading-[0.88] tracking-[-0.06em] text-[var(--showman-bone)] sm:text-7xl">
                Build the request before money enters the room.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--showman-muted)] sm:text-lg">
                Booking on Showman starts with the event brief, the artist principal, and the
                booking principal. No blank inquiries, no scraped calendars, no accidental buyer
                identities.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-[var(--showman-muted)]">
              <div className="border-l border-[#ff8a2a] pl-4">
                <p className="font-bold uppercase tracking-[0.16em] text-[var(--showman-bone)]">
                  01 Describe the event
                </p>
                <p className="mt-2 leading-6">Venue, date, capacity, budget band, and why this artist fits.</p>
              </div>
              <div className="border-l border-white/10 pl-4">
                <p className="font-bold uppercase tracking-[0.16em] text-[var(--showman-bone)]">
                  02 Act as a principal
                </p>
                <p className="mt-2 leading-6">Requests come from a BookerProfile or booking-capable org, not a raw login.</p>
              </div>
              <div className="border-l border-white/10 pl-4">
                <p className="font-bold uppercase tracking-[0.16em] text-[var(--showman-bone)]">
                  03 Route to real teams
                </p>
                <p className="mt-2 leading-6">Artist teams get a dossier and pitch they can actually evaluate.</p>
              </div>
            </div>
          </div>
        </section>

        {!user ? (
          <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className={`${panelStyles("subtle")} p-6 sm:p-8`}>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ffb06a]">
                Start booking
              </p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-none tracking-[-0.05em] text-[var(--showman-bone)]">
                Create a booking identity when you are ready to send requests.
              </h2>
              <p className="mt-4 text-sm leading-6 text-[var(--showman-muted)]">
                You can browse artists publicly first. Sending a serious request requires an account
                and a booking profile the artist team can size up.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up?role=booker" className={buttonStyles("primary")}>
                  Start booking setup
                </Link>
                <Link href="/artists" className={buttonStyles("secondary")}>
                  Browse artists
                </Link>
              </div>
            </div>
            <div className={`${panelStyles("subtle")} p-6 sm:p-8`}>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/40">
                Already inside
              </p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-none tracking-[-0.05em] text-[var(--showman-bone)]">
                Continue from your existing workspace.
              </h2>
              <p className="mt-4 text-sm leading-6 text-[var(--showman-muted)]">
                Sign in to continue a booker dashboard, manage an artist roster, or add booking
                capability from the right principal.
              </p>
              <Link href="/sign-in" className={`${buttonStyles("secondary")} mt-6`}>
                Sign in
              </Link>
            </div>
          </section>
        ) : (
          <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            {bookerProfile ? (
              <div className={`${panelStyles("subtle")} p-6 sm:p-8`}>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ffb06a]">
                  Booking principal
                </p>
                <h2 className="mt-4 text-3xl font-black uppercase leading-none tracking-[-0.05em] text-[var(--showman-bone)]">
                  {bookerProfile.displayName}
                </h2>
                <p className="mt-4 text-sm leading-6 text-[var(--showman-muted)]">
                  This BookerProfile can send requests and organize event briefs. Continue through
                  the dashboard before opening a request thread.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link href="/booker" className={buttonStyles("primary")}>
                    Open dashboard
                  </Link>
                  <Link href="/booker/events/new" className={buttonStyles("secondary")}>
                    Create event brief
                  </Link>
                  <Link href="/artists" className={buttonStyles("ghost")}>
                    Browse artists
                  </Link>
                </div>
              </div>
            ) : (
              <div className={`${panelStyles("subtle")} p-6 sm:p-8`}>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ffb06a]">
                  Add booking capability
                </p>
                <h2 className="mt-4 text-3xl font-black uppercase leading-none tracking-[-0.05em] text-[var(--showman-bone)]">
                  No booking principal is active yet.
                </h2>
                <p className="mt-4 text-sm leading-6 text-[var(--showman-muted)]">
                  Managing artists and booking other artists are separate capabilities. Create a
                  BookerProfile only when this account or workspace needs to send requests.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link href="/onboarding?role=booker" className={buttonStyles("primary")}>
                    Set up booking
                  </Link>
                  <Link href="/artists" className={buttonStyles("secondary")}>
                    Browse first
                  </Link>
                </div>
              </div>
            )}

            <div className={`${panelStyles("subtle")} p-6 sm:p-8`}>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/40">
                Workspace context
              </p>
              <h2 className="mt-4 text-3xl font-black uppercase leading-none tracking-[-0.05em] text-[var(--showman-bone)]">
                {orgs.length > 0 ? "Your orgs stay distinct." : "No org workspace yet."}
              </h2>
              <p className="mt-4 text-sm leading-6 text-[var(--showman-muted)]">
                {orgs.length > 0
                  ? "Org-backed booking needs an explicit buyer profile before that org can send requests. This page shows the context without assuming capability."
                  : "If you manage artists, create or join a team workspace separately from booking setup."}
              </p>
              {orgs.length > 0 ? (
                <div className="mt-6 grid gap-3">
                  {orgs.map((orgItem) => (
                    <div
                      key={orgItem.id}
                      className="rounded-2xl border border-white/10 bg-black/20 p-4"
                    >
                      <p className="font-bold uppercase tracking-[0.12em] text-[var(--showman-bone)]">
                        {orgItem.name}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--showman-muted)]">
                        Booking capability not assumed
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <Link href="/onboarding" className={`${buttonStyles("secondary")} mt-6`}>
                  Set up a team workspace
                </Link>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
