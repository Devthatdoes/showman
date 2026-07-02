import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { panelStyles } from "@/components/ui/panel";
import type { BookerDashboardData } from "@/server/booking/types";

export default function BookerDashboard({ data }: { data: BookerDashboardData }) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14">
      <section className={`${panelStyles("elevated")} p-6 sm:p-8`}>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ffb06a]">
          Booker workspace
        </p>
        <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black uppercase leading-none tracking-[-0.05em] text-[var(--showman-bone)] sm:text-6xl">
              {data.profile.displayName}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--showman-muted)]">
              {data.profile.shortDescriptor ??
                "Build event briefs, send structured requests, and keep the booking side organized."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/booker/events/new" className={buttonStyles("secondary")}>
              Add event
            </Link>
            <Link href="/artists" className={buttonStyles("primary")}>
              Find artists
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        {Object.entries(data.statusCounts).map(([status, count]) => (
          <div key={status} className={`${panelStyles("subtle")} p-4`}>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--showman-muted)]">
              {status.replace("_", " ")}
            </p>
            <p className="mt-2 text-3xl font-black text-[var(--showman-bone)]">{count}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className={`${panelStyles("subtle")} p-5`}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black uppercase tracking-[-0.04em] text-[var(--showman-bone)]">
              Events
            </h2>
            <Link href="/booker/events/new" className="text-xs font-black uppercase tracking-[0.14em] text-[#ffb06a]">
              New
            </Link>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {data.events.length === 0 ? (
              <p className="text-sm leading-6 text-[var(--showman-muted)]">
                No event briefs yet. Start one before sending serious artist requests.
              </p>
            ) : (
              data.events.map((event) => (
                <article key={event.id} className="border-t border-[var(--showman-line)] pt-3">
                  <h3 className="font-bold text-[var(--showman-bone)]">{event.name}</h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[var(--showman-muted)]">
                    {[event.eventType, event.market, event.targetDate].filter(Boolean).join(" · ")}
                  </p>
                </article>
              ))
            )}
          </div>
        </div>

        <div className={`${panelStyles("subtle")} p-5`}>
          <h2 className="text-xl font-black uppercase tracking-[-0.04em] text-[var(--showman-bone)]">
            Requests
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {data.requests.length === 0 ? (
              <p className="text-sm leading-6 text-[var(--showman-muted)]">
                No requests yet. Browse artists and turn a show idea into a structured pitch.
              </p>
            ) : (
              data.requests.map((request) => (
                <article
                  key={request.id}
                  className="grid gap-3 border-t border-[var(--showman-line)] pt-4 sm:grid-cols-[5rem_1fr]"
                >
                  <div className="overflow-hidden rounded-lg bg-black/30">
                    {request.artistImageUrl ? (
                      <img
                        src={request.artistImageUrl}
                        alt=""
                        className="aspect-square h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.14em] text-[#ffb06a]">
                      {request.status.replace("_", " ")}
                    </p>
                    <h3 className="mt-1 font-bold text-[var(--showman-bone)]">
                      {request.eventName} → {request.artistStageName}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--showman-muted)]">
                      {[request.market, request.targetDate, request.budgetBand].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
