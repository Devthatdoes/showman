export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import {
  getArtistProfileBySlug,
  getUpcomingOpenAvailabilityForArtist,
} from "@/server/catalog/queries";
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

function getInitials(stageName: string): string {
  const parts = stageName
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "SM";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export default async function ArtistProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const artist = await getArtistProfileBySlug(slug);

  if (!artist) {
    notFound();
  }

  const user = await getCurrentUser();
  const isOwner = !!user && user.id === artist.ownerUserId;

  const upcomingWindows = await getUpcomingOpenAvailabilityForArtist(artist.id);

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
            <div className="flex aspect-[4/5] h-full flex-col justify-between rounded-2xl border border-[var(--showman-line)] bg-[radial-gradient(circle_at_70%_20%,rgba(255,122,26,0.3),transparent_32%),linear-gradient(145deg,#221f1b,#100f0d)] p-6">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-[var(--showman-muted)]">
                <span>profile frame</span>
                <span className="text-[#ffb06a]">image ready</span>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="flex h-28 w-28 items-center justify-center rounded-full border border-[rgba(255,248,236,0.16)] bg-[rgba(255,248,236,0.05)] text-4xl font-black tracking-[-0.08em] text-[var(--showman-bone)]">
                  {getInitials(artist.stageName)}
                </div>
                <p className="mt-6 max-w-[14ch] text-2xl font-black uppercase leading-[0.92] tracking-[-0.06em] text-[var(--showman-bone)]">
                  {artist.stageName}
                </p>
              </div>
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-[var(--showman-muted)]">
                Showman profile
              </div>
            </div>
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
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
