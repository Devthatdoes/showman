import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { panelStyles } from "@/components/ui/panel";
import type { ArtistProfile } from "@/db/schema";
import type { InboundRequestListItem } from "@/server/booking/types";

export default function TeamDashboard({
  artists,
  inboundRequests,
}: {
  artists: ArtistProfile[];
  inboundRequests: InboundRequestListItem[];
}) {
  const incomplete = artists.filter((artist) => !artist.imageUrl || !artist.primaryGenre);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14">
      <section className={`${panelStyles("elevated")} p-6 sm:p-8`}>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ffb06a]">
          Team workspace
        </p>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black uppercase leading-none tracking-[-0.05em] text-[var(--showman-bone)] sm:text-6xl">
              Artist operations
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--showman-muted)]">
              Manage artist readiness, inbound requests, and the early coordination layer before booking rails deepen.
            </p>
          </div>
          <Link href="/artists/new" className={buttonStyles("primary")}>
            Add artist
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className={`${panelStyles("subtle")} p-4`}>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--showman-muted)]">
            Managed artists
          </p>
          <p className="mt-2 text-3xl font-black text-[var(--showman-bone)]">{artists.length}</p>
        </div>
        <div className={`${panelStyles("subtle")} p-4`}>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--showman-muted)]">
            Profile repairs
          </p>
          <p className="mt-2 text-3xl font-black text-[var(--showman-bone)]">{incomplete.length}</p>
        </div>
        <div className={`${panelStyles("subtle")} p-4`}>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--showman-muted)]">
            Inbound requests
          </p>
          <p className="mt-2 text-3xl font-black text-[var(--showman-bone)]">{inboundRequests.length}</p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className={`${panelStyles("subtle")} p-5`}>
          <h2 className="text-xl font-black uppercase tracking-[-0.04em] text-[var(--showman-bone)]">
            Roster
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {artists.length === 0 ? (
              <p className="text-sm leading-6 text-[var(--showman-muted)]">
                No artist profiles yet. Create the first one with image, genre, and public bio.
              </p>
            ) : (
              artists.map((artist) => (
                <article key={artist.id} className="border-t border-[var(--showman-line)] pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-[var(--showman-bone)]">{artist.stageName}</h3>
                      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--showman-muted)]">
                        {[artist.primaryGenre, artist.homeMarket].filter(Boolean).join(" · ") || "Profile setup"}
                      </p>
                    </div>
                    <Link href={`/artists/${artist.slug}/edit`} className="text-xs font-black uppercase tracking-[0.14em] text-[#ffb06a]">
                      Edit
                    </Link>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>

        <div className={`${panelStyles("subtle")} p-5`}>
          <h2 className="text-xl font-black uppercase tracking-[-0.04em] text-[var(--showman-bone)]">
            Inbound queue
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {inboundRequests.length === 0 ? (
              <p className="text-sm leading-6 text-[var(--showman-muted)]">
                No inbound requests yet. When bookers send structured asks, they will land here.
              </p>
            ) : (
              inboundRequests.map((request) => (
                <article key={request.id} className="border-t border-[var(--showman-line)] pt-4">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#ffb06a]">
                    {request.status.replace("_", " ")} · {request.artistStageName}
                  </p>
                  <h3 className="mt-1 font-bold text-[var(--showman-bone)]">{request.eventName}</h3>
                  <p className="mt-1 text-sm leading-6 text-[var(--showman-muted)]">
                    {request.bookerDisplayName}
                    {request.bookerRoleTitle ? ` · ${request.bookerRoleTitle}` : ""}
                    {request.market ? ` · ${request.market}` : ""}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--showman-muted)]">
                    {request.pitch}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
