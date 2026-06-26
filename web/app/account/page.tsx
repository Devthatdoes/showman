import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import SignOutButton from "@/components/sign-out-button";
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-md px-6 py-16 flex flex-col gap-8">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 flex flex-col gap-4">
          <h1 className="text-3xl font-semibold tracking-tight">Your account</h1>
          <div className="flex flex-col gap-2">
            <p className="text-zinc-100 font-medium">{user.name}</p>
            <p className="text-zinc-400 text-sm">{user.email}</p>
            <p className="text-zinc-500 text-xs font-mono">{user.id}</p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <SignOutButton />
            <Link
              href="/artists"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
            >
              Browse artists
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Your profiles</h2>
            <Link
              href="/artists/new"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
            >
              Add profile
            </Link>
          </div>

          {profiles.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 flex flex-col gap-4 items-center text-center">
              <p className="text-zinc-400 text-sm">You have not created any profiles yet.</p>
              <Link
                href="/artists/new"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
              >
                Add profile
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {profiles.map((p) => (
                <div
                  key={p.slug}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex items-center justify-between gap-4"
                >
                  <Link href={`/artists/${p.slug}`} className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-zinc-100 truncate">{p.stageName}</span>
                    {p.homeMarket && (
                      <span className="text-xs text-zinc-400 truncate">{p.homeMarket}</span>
                    )}
                  </Link>
                  <Link
                    href={`/artists/${p.slug}/edit`}
                    className="shrink-0 inline-flex items-center rounded-lg border border-zinc-700 bg-transparent px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-zinc-800"
                  >
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
