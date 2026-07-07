import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { getActorWorkspace } from "@/server/identity/queries";
import SignOutButton from "@/components/sign-out-button";
import { buttonStyles } from "@/components/ui/button";
import { panelStyles } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ artist?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { artist: requestedArtist } = await searchParams;

  const workspace = await getActorWorkspace(user.id);

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 flex flex-col gap-8">
        <div className={`${panelStyles("elevated")} p-6 sm:p-8 flex flex-col gap-5`}>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ffb06a]">
            Account
          </p>
          <h1 className="text-3xl font-black uppercase tracking-[-0.05em] text-[var(--showman-bone)]">
            Your account
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[var(--showman-muted)]">
            {requestedArtist
              ? "You are signed in. Finish onboarding to turn the selected artist into a structured booking request."
              : "You are signed in. Choose the workspace that matches what you need to do next."}
          </p>
          <div className="flex flex-col gap-2">
            <p className="font-medium text-[var(--showman-bone)]">{user.name}</p>
            <p className="text-sm text-[var(--showman-muted)]">{user.email}</p>
            <p className="font-mono text-xs text-[var(--showman-muted)]">{user.id}</p>
          </div>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <SignOutButton />
            <Link href="/artists" className={buttonStyles("secondary")}>
              Browse artists
            </Link>
            {/* Only show onboarding if they have no active workspace */}
            {workspace.orgs.length === 0 && !workspace.bookerProfile && (
              <Link href="/onboarding" className={buttonStyles("secondary")}>
                Onboarding
              </Link>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {workspace.orgs.map((orgItem) => (
            <Link 
              key={orgItem.id} 
              href={`/team?orgId=${orgItem.id}`} 
              className={`${panelStyles("subtle")} block p-5 transition hover:border-[#ff8a2a]`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ffb06a]">
                Artist / Team
              </p>
              <h2 className="mt-3 text-xl font-black uppercase tracking-[-0.04em] text-[var(--showman-bone)]">
                {orgItem.name}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--showman-muted)]">
                Manage profiles, readiness, and inbound requests for this roster.
              </p>
            </Link>
          ))}

          {workspace.bookerProfile && (
            <Link href="/booker" className={`${panelStyles("subtle")} block p-5 transition hover:border-[#ff8a2a]`}>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ffb06a]">
                Booker
              </p>
              <h2 className="mt-3 text-xl font-black uppercase tracking-[-0.04em] text-[var(--showman-bone)]">
                {workspace.bookerProfile.displayName}
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--showman-muted)]">
                Build requests, manage events, and coordinate booking context.
              </p>
            </Link>
          )}

          {workspace.orgs.length === 0 && (
            <Link href="/onboarding" className={`${panelStyles("subtle")} block p-5 border-dashed border-2 border-white/10 transition hover:border-[#ff8a2a]`}>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/40">
                Setup
              </p>
              <h2 className="mt-3 text-xl font-black uppercase tracking-[-0.04em] text-[var(--showman-bone)]">
                Create Artist Team
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--showman-muted)]">
                Establish a professional roster to start managing artist bookings.
              </p>
            </Link>
          )}
          {!workspace.bookerProfile && (
            <Link href="/onboarding" className={`${panelStyles("subtle")} block p-5 border-dashed border-2 border-white/10 transition hover:border-[#ff8a2a]`}>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/40">
                Setup
              </p>
              <h2 className="mt-3 text-xl font-black uppercase tracking-[-0.04em] text-[var(--showman-bone)]">
                Create Booker Profile
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--showman-muted)]">
                Setup your professional identity to send booking requests.
              </p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
