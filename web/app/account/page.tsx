import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/sign-out-button";
import { buttonStyles } from "@/components/ui/button";
import { panelStyles } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ artist?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  const { user } = session;
  const { artist: requestedArtist } = await searchParams;

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
              : "You are signed in. Choose the working surface that matches what you need to do next."}
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
            <Link href="/onboarding" className={buttonStyles("secondary")}>
              Onboarding
            </Link>
            <Link href="/team" className={buttonStyles("primary")}>
              Team dashboard
            </Link>
            <Link href="/booker" className={buttonStyles("secondary")}>
              Booker dashboard
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/team" className={`${panelStyles("subtle")} block p-5 transition hover:border-[#ff8a2a]`}>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ffb06a]">
              Artist / team
            </p>
            <h2 className="mt-3 text-xl font-black uppercase tracking-[-0.04em] text-[var(--showman-bone)]">
              Manage profiles
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--showman-muted)]">
              Profiles, readiness, inbound requests, and calendar attention belong in the team dashboard.
            </p>
          </Link>
          <Link href="/booker" className={`${panelStyles("subtle")} block p-5 transition hover:border-[#ff8a2a]`}>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#ffb06a]">
              Booker
            </p>
            <h2 className="mt-3 text-xl font-black uppercase tracking-[-0.04em] text-[var(--showman-bone)]">
              Build requests
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--showman-muted)]">
              Events, requested artists, and coordination context belong in the booker dashboard.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
