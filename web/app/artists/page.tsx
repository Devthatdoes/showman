export const dynamic = "force-dynamic";

import Link from "next/link";
import { listPublicArtistProfiles } from "@/server/catalog/queries";
import { badgeStyles } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { panelStyles } from "@/components/ui/panel";
import { PRIMARY_GENRE_OPTIONS } from "@/lib/artist-genres";

type ArtistsPageProps = {
  searchParams: Promise<{
    q?: string;
    genre?: string;
  }>;
};

function includesQuery(value: string | null | undefined, query: string): boolean {
  return Boolean(value?.toLowerCase().includes(query));
}

export default async function ArtistsPage({ searchParams }: ArtistsPageProps) {
  const { q = "", genre = "" } = await searchParams;
  const searchQuery = q.trim().toLowerCase();
  const activeGenre = genre.trim();
  const artists = (await listPublicArtistProfiles()).filter((artist) => {
    const matchesQuery =
      !searchQuery ||
      includesQuery(artist.stageName, searchQuery) ||
      includesQuery(artist.bio, searchQuery) ||
      includesQuery(artist.homeMarket, searchQuery) ||
      includesQuery(artist.primaryGenre, searchQuery) ||
      artist.genres.some((artistGenre) => includesQuery(artistGenre, searchQuery));
    const matchesGenre =
      !activeGenre ||
      artist.primaryGenre === activeGenre ||
      artist.genres.includes(activeGenre);

    return matchesQuery && matchesGenre;
  });

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ffb06a]">
              Artist directory
            </p>
            <h1 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em] text-[var(--showman-bone)] sm:text-4xl">
              Artists
            </h1>
          </div>
          <Link href="/artists/new" className={buttonStyles("primary")}>
            New artist
          </Link>
        </div>

        <form
          action="/artists"
          className={`${panelStyles("subtle")} mb-8 grid gap-3 p-4 sm:grid-cols-[1fr_220px_auto]`}
        >
          <label className="sr-only" htmlFor="artist-search">
            Search artists
          </label>
          <input
            id="artist-search"
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search by artist, sound, or city"
            className="min-h-12 rounded-full border border-[var(--showman-line)] bg-black/25 px-5 text-sm text-[var(--showman-bone)] outline-none transition focus:border-[#ff7a1a]"
          />
          <label className="sr-only" htmlFor="artist-genre">
            Broad genre
          </label>
          <select
            id="artist-genre"
            name="genre"
            defaultValue={activeGenre}
            className="min-h-12 rounded-full border border-[var(--showman-line)] bg-black/25 px-5 text-sm text-[var(--showman-bone)] outline-none transition focus:border-[#ff7a1a]"
          >
            <option value="">All genres</option>
            {PRIMARY_GENRE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button type="submit" className={buttonStyles("primary")}>
            Search
          </button>
        </form>

        {artists.length === 0 ? (
          <div className={`${panelStyles("subtle")} p-12 text-center`}>
            <p className="text-sm text-[var(--showman-muted)]">
              No public-ready artists match that search yet.
            </p>
            <Link href="/artists/new" className={`${buttonStyles("primary")} mt-6`}>
              New artist
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {artists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artists/${artist.slug}`}
                className={`${panelStyles("subtle")} group block overflow-hidden transition-colors hover:border-[rgba(255,122,26,0.35)] hover:bg-[rgba(255,248,236,0.055)]`}
              >
                <div className="aspect-[4/3] overflow-hidden bg-black/30">
                  <img
                    src={artist.imageUrl}
                    alt=""
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                </div>
                <div className="flex h-full flex-col justify-between gap-5 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-[var(--showman-bone)] transition-colors group-hover:text-[#ffb06a]">
                        {artist.stageName}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={badgeStyles("muted")}>
                          {artist.primaryGenre ?? "Profile"}
                        </span>
                        <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#ffb06a]">
                          View profile
                        </span>
                      </div>
                    </div>
                    {artist.homeMarket && (
                      <p className="text-right text-sm text-[var(--showman-muted)]">{artist.homeMarket}</p>
                    )}
                  </div>

                  {artist.genres && artist.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {artist.genres.map((genre: string) => (
                        <span key={genre} className={badgeStyles("muted")}>
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
