import Link from "next/link";
import { createArtistProfile } from "@/app/artists/actions";

export default function NewArtistPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-6">
          <Link href="/" className="text-sm font-medium text-zinc-100 hover:text-zinc-100">
            showman
          </Link>
          <Link href="/artists" className="text-sm text-zinc-400 hover:text-zinc-100">
            Artists
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">New artist profile</h1>
        <p className="mt-2 text-zinc-400">
          Create your electronic press kit. No booking or fees — just your story, your sound.
        </p>

        <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <form action={createArtistProfile} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="stageName" className="text-sm font-medium text-zinc-300">
                Stage name <span className="text-zinc-500">*</span>
              </label>
              <input
                id="stageName"
                name="stageName"
                type="text"
                required
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
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
                placeholder="Tell us about your sound, your influences, your journey."
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
              >
                Create profile
              </button>
              <Link
                href="/artists"
                className="inline-flex items-center rounded-lg border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
              >
                Back to artists
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
