import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/sign-out-button";
import { buttonStyles } from "@/components/ui/button";
import { panelStyles } from "@/components/ui/panel";
import { listArtistProfilesForOwner } from "@/server/catalog/queries";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/sign-in");
  }

  const { user } = session;

  const profiles = await listArtistProfilesForOwner(user.id);

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
            Your profiles are the supply-side base of showman: real artist identity,
            visible availability, and clean ownership for the booking rails ahead.
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
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl font-bold tracking-[-0.03em] text-[var(--showman-bone)]">
              Your profiles
            </h2>
            <Link href="/artists/new" className={buttonStyles("primary")}>
              Add profile
            </Link>
          </div>

          {profiles.length === 0 ? (
            <div className={`${panelStyles("subtle")} flex flex-col items-center gap-4 p-8 text-center`}>
              <p className="text-sm leading-6 text-[var(--showman-muted)]">
                You have not created any profiles yet.
              </p>
              <Link href="/artists/new" className={buttonStyles("primary")}>
                Add profile
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {profiles.map((p) => (
                <div
                  key={p.slug}
                  className={`${panelStyles("subtle")} flex items-center justify-between gap-4 p-4 sm:p-5`}
                >
                  <Link href={`/artists/${p.slug}`} className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[var(--showman-bone)]">
                      {p.stageName}
                    </span>
                    {p.homeMarket && (
                      <span className="block truncate text-xs text-[var(--showman-muted)]">
                        {p.homeMarket}
                      </span>
                    )}
                  </Link>
                  <Link href={`/artists/${p.slug}/edit`} className={buttonStyles("secondary")}>
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
