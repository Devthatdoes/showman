export const dynamic = "force-dynamic";

import Link from "next/link";
import { listArtistProfiles } from "@/server/catalog/queries";
import { badgeStyles } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { panelStyles } from "@/components/ui/panel";

export default async function ArtistsPage() {
  const artists = await listArtistProfiles();

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

        {artists.length === 0 ? (
          <div className={`${panelStyles("subtle")} p-12 text-center`}>
            <p className="text-sm text-[var(--showman-muted)]">
              No artists yet. Put the first profile on the board.
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
                className={`${panelStyles("subtle")} group block p-5 transition-colors hover:border-[rgba(255,122,26,0.35)] hover:bg-[rgba(255,248,236,0.055)]`}
              >
                <div className="flex h-full flex-col justify-between gap-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-[var(--showman-bone)] transition-colors group-hover:text-[#ffb06a]">
                        {artist.stageName}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={badgeStyles("muted")}>Profile</span>
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
