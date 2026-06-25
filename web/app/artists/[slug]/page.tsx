export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";

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

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-800">
        <div className="mx-auto flex max-w-2xl items-center gap-6 px-6 py-4 text-sm text-zinc-400">
          <Link href="/" className="font-semibold tracking-tight text-zinc-100 hover:text-white">
            showman
          </Link>
          <Link href="/artists" className="hover:text-zinc-100">
            Artists
          </Link>
        </div>
      </nav>

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
        </div>
      </div>
    </main>
  );
}
