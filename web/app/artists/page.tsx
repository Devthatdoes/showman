export const dynamic = "force-dynamic";

import Link from "next/link";
import { db } from "@/db";
import { type ArtistProfile } from "@/db/schema";

export default async function ArtistsPage() {
  const artists = await db.query.artistProfiles.findMany({
    orderBy: (a, { desc }) => desc(a.createdAt),
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">Artists</h1>
          <Link
            href="/artists/new"
            className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
          >
            New artist
          </Link>
        </div>

        {artists.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-12 text-center">
            <p className="mb-6 text-zinc-400">
              No artists yet — add the first profile.
            </p>
            <Link
              href="/artists/new"
              className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
            >
              New artist
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {artists.map((artist: ArtistProfile) => (
              <Link
                key={artist.id}
                href={`/artists/${artist.slug}`}
                className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 transition-colors hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-100">{artist.stageName}</p>
                    {artist.homeMarket && (
                      <p className="mt-0.5 text-sm text-zinc-400">{artist.homeMarket}</p>
                    )}
                  </div>
                  {artist.genres && artist.genres.length > 0 && (
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {artist.genres.map((genre: string) => (
                        <span
                          key={genre}
                          className="rounded-full border border-zinc-700 px-2.5 py-0.5 text-xs text-zinc-300"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
