import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { updateArtistProfile, deleteArtistProfile } from "@/app/artists/actions";
import { db } from "@/db";

export const dynamic = "force-dynamic";

export default async function EditArtistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const profile = await db.query.artistProfiles.findFirst({
    where: (a, { eq }) => eq(a.slug, slug),
  });

  if (!profile) notFound();

  const user = await getCurrentUser();
  if (!user || user.id !== profile.ownerUserId) redirect(`/artists/${slug}`);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Edit profile</h1>
        <p className="mt-2 text-zinc-400">Update your artist profile details.</p>

        <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/60 p-8">
          <form action={updateArtistProfile} className="flex flex-col gap-6">
            <input type="hidden" name="slug" value={profile.slug} />

            <div className="flex flex-col gap-1.5">
              <label htmlFor="stageName" className="text-sm font-medium text-zinc-300">
                Stage name <span className="text-zinc-500">*</span>
              </label>
              <input
                id="stageName"
                name="stageName"
                type="text"
                required
                defaultValue={profile.stageName}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
                placeholder="Your artist name"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="homeMarket" className="text-sm font-medium text-zinc-300">
                Home market
              </label>
              <input
                id="homeMarket"
                name="homeMarket"
                type="text"
                defaultValue={profile.homeMarket ?? ""}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
                placeholder="e.g. Berlin, London, New York"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="genres" className="text-sm font-medium text-zinc-300">
                Genres
              </label>
              <input
                id="genres"
                name="genres"
                type="text"
                defaultValue={profile.genres.join(", ")}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
                placeholder="house, techno, disco"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="bio" className="text-sm font-medium text-zinc-300">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={5}
                defaultValue={profile.bio ?? ""}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
                placeholder="Tell us about your sound, your influences, your journey."
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
              >
                Save changes
              </button>
              <Link
                href={`/artists/${profile.slug}`}
                className="inline-flex items-center rounded-lg border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">Danger zone</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Permanently delete this artist profile. This action cannot be undone.
          </p>
          <form action={deleteArtistProfile} className="mt-4">
            <input type="hidden" name="slug" value={profile.slug} />
            <button
              type="submit"
              className="inline-flex items-center rounded-lg border border-rose-500/40 bg-transparent px-4 py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/10"
            >
              Delete profile
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
