export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { canManageArtist } from "@/server/identity/authorize";
import { addAvailabilityWindow, deleteAvailabilityWindow } from "./actions";
import {
  getArtistProfileBySlug,
  listAvailabilityForArtist,
} from "@/server/catalog/queries";
import AvailabilityComposer from "@/components/availability/availability-composer";
import { buttonStyles } from "@/components/ui/button";
import { badgeStyles } from "@/components/ui/badge";
import { panelStyles } from "@/components/ui/panel";

function formatDateRange(start: string, end: string): string {
  if (start === end) return start;
  return `${start} – ${end}`;
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function AvailabilityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const artist = await getArtistProfileBySlug(slug);
  if (!artist) notFound();

  const user = await getCurrentUser();
  // Mirror the mutation layer's authorization (requireOwnedArtist), not raw
  // ownership: org agents are allowed to submit these forms, so they must be
  // able to load them.
  if (!user || !(await canManageArtist(user.id, artist))) redirect(`/artists/${slug}`);

  const windows = await listAvailabilityForArtist(artist.id);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6 sm:py-14">
        <Link
          href={`/artists/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--showman-muted)] transition-colors hover:text-[var(--showman-bone)]"
        >
          <span aria-hidden="true">&#8592;</span>
          Back to profile
        </Link>

        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ffb06a]">
            Availability management
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em] text-[var(--showman-bone)] sm:text-4xl">
            Availability
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--showman-muted)]">{artist.stageName}</p>
        </div>

        <AvailabilityComposer slug={slug} windows={windows} action={addAvailabilityWindow} />

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--showman-muted)]">
            Windows
          </h2>

          {windows.length === 0 ? (
            <div className={`${panelStyles("subtle")} p-6 text-center text-sm text-[var(--showman-muted)]`}>
              No availability windows yet. Add one above to get started.
            </div>
          ) : (
            <ul className="space-y-2">
              {windows.map((w) => (
                <li
                  key={w.id}
                  className={`${panelStyles("subtle")} flex items-center justify-between gap-4 px-5 py-4`}
                >
                  <div className="flex flex-wrap items-center gap-3 min-w-0">
                    <span className="text-sm font-semibold text-[var(--showman-bone)] tabular-nums">
                      {formatDateRange(w.startDate, w.endDate)}
                    </span>

                    {w.status === "open" ? (
                      <span className={badgeStyles("open")}>Taking requests</span>
                    ) : (
                      <span className={badgeStyles("blocked")}>Not accepting</span>
                    )}

                    {w.market && (
                      <span className="text-xs text-[var(--showman-muted)]">{w.market}</span>
                    )}
                    {w.note && (
                      <span className="max-w-xs truncate text-xs italic text-[var(--showman-muted)]">
                        {w.note}
                      </span>
                    )}
                  </div>

                  <form action={deleteAvailabilityWindow} className="shrink-0">
                    <input type="hidden" name="id" value={w.id} />
                    <input type="hidden" name="slug" value={slug} />
                    <button type="submit" className={buttonStyles("ghost")}>
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
