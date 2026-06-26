export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import {
  getArtistProfileBySlug,
  getPublicArtistProfileBySlug,
  getUpcomingOpenAvailabilityForArtist,
} from "@/server/catalog/queries";
import { canManageArtist } from "@/server/identity/authorize";
import { badgeStyles } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { panelStyles } from "@/components/ui/panel";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}

export default async function ArtistProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getCurrentUser();

  const ownedCandidate = user ? await getArtistProfileBySlug(slug) : undefined;
  const isOwner = !!user && !!ownedCandidate && (await canManageArtist(user.id, ownedCandidate));
  const artist = isOwner ? ownedCandidate : await getPublicArtistProfileBySlug(slug);

  if (!artist) {
    notFound();
  }

  const upcomingWindows = isOwner ? await getUpcomingOpenAvailabilityForArtist(artist.id) : [];

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8">
          <Link
            href="/artists"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--showman-muted)] transition-colors hover:text-[var(--showman-bone)]"
          >
            <span aria-hidden="true">&#8592;</span>
            All artists
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className={`${panelStyles("elevated")} overflow-hidden p-4 sm:p-5`}>
            {artist.imageUrl ? (
              <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-[var(--showman-line)] bg-black/30">
                <img src={artist.imageUrl} alt="" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="flex aspect-[4/5] items-center justify-center rounded-2xl border border-[var(--showman-line)] bg-black/30 p-6 text-center text-sm text-[var(--showman-muted)]">
                Image needs to be added before this profile is complete.
              </div>
            )}
          </section>

          <section className={`${panelStyles("default")} p-6 sm:p-8`}>
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="text-4xl font-black uppercase leading-[0.92] tracking-[-0.07em] text-[var(--showman-bone)] sm:text-5xl">
                  {artist.stageName}
                </h1>
                {artist.homeMarket && (
                  <p className="mt-3 text-sm font-medium uppercase tracking-[0.18em] text-[#ffb06a]">
                    {artist.homeMarket}
                  </p>
                )}
                {artist.primaryGenre && (
                  <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-[var(--showman-muted)]">
                    {artist.primaryGenre}
                  </p>
                )}
              </div>

              {artist.genres && artist.genres.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {artist.genres.map((genre) => (
                    <span key={genre} className={badgeStyles("default")}>
                      {genre}
                    </span>
                  ))}
                </div>
              )}

              {artist.bio && (
                <p className="max-w-2xl whitespace-pre-wrap text-base leading-7 text-[var(--showman-muted)]">
                  {artist.bio}
                </p>
              )}

              {isOwner && (
                <div className="flex flex-wrap gap-2">
                  <Link href={`/artists/${slug}/edit`} className={buttonStyles("secondary")}>
                    Edit profile
                  </Link>
                  <Link
                    href={`/artists/${slug}/availability`}
                    className={buttonStyles("primary")}
                  >
                    Manage availability
                  </Link>
                </div>
              )}

              {!isOwner && (
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/booker/requests/new?artist=${artist.slug}`}
                    className={buttonStyles("primary")}
                  >
                    Request access
                  </Link>
                  <Link href="/artists" className={buttonStyles("secondary")}>
                    Keep browsing
                  </Link>
                </div>
              )}

              {isOwner && (
                <div className="pt-2">
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--showman-muted)]">
                    Availability
                  </h2>
                  <div className="mt-4 space-y-3">
                    {upcomingWindows.length > 0 ? (
                      upcomingWindows.map((w) => (
                        <div
                          key={w.id}
                          className={`${panelStyles("subtle")} flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={badgeStyles("open")}>Open</span>
                            <div>
                              <p className="text-sm font-semibold text-[var(--showman-bone)]">
                                {formatDate(w.startDate)} - {formatDate(w.endDate)}
                              </p>
                              {w.market && (
                                <p className="mt-1 text-sm text-[var(--showman-muted)]">{w.market}</p>
                              )}
                            </div>
                          </div>
                          {w.note && (
                            <p className="max-w-sm text-sm text-[var(--showman-muted)]">{w.note}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[var(--showman-muted)]">
                        No upcoming availability listed.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
