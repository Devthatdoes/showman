export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { availabilityWindows } from "@/db/schema";

export default async function ArtistProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const artist = await db.query.artistProfiles.findFirst({
    where: (a, { eq }) => eq(a.slug, slug),
  });

  if (!artist) {
    notFound();
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcomingWindows = await db.query.availabilityWindows.findMany({
    where: (w, { and, eq, gte }) =>
      and(eq(w.artistId, artist.id), eq(w.status, "open"), gte(w.endDate, today)),
    orderBy: (w, { asc }) => asc(w.startDate),
    limit: 3,
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-8">
          <Link
            href="/artists"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100"
          >
            <span aria-hidden="true">&#8592;</span>
            All Artists
          </Link>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-8">
          <h1 className="text-3xl font-semibold tracking-tight">{artist.stageName}</h1>

          {artist.homeMarket && (
            <p className="mt-2 text-zinc-400">{artist.homeMarket}</p>
          )}

          {artist.genres && artist.genres.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {artist.genres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-zinc-700 px-2.5 py-0.5 text-xs text-zinc-300"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}

          {artist.bio && (
            <p className="mt-8 whitespace-pre-wrap leading-relaxed text-zinc-300">
              {artist.bio}
            </p>
          )}

          <div className="mt-10">
            <h2 className="text-sm font-medium uppercase tracking-widest text-zinc-500">
              Availability
            </h2>
            <div className="mt-4 space-y-2">
              {upcomingWindows.length > 0 ? (
                upcomingWindows.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3"
                  >
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-xs text-emerald-300">
                      open
                    </span>
                    <span className="text-sm text-zinc-200">
                      {w.startDate} &ndash; {w.endDate}
                    </span>
                    {w.market && (
                      <span className="text-sm text-zinc-400">{w.market}</span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-400">No upcoming availability listed.</p>
              )}
            </div>
            <div className="mt-4">
              <Link
                href={`/artists/${slug}/availability`}
                className="inline-flex items-center rounded-lg border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
              >
                Manage availability →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
