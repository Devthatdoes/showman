import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { panelStyles } from "@/components/ui/panel";

export default function Home() {
  return (
    <main className="min-h-screen">
      <section className="mx-auto grid min-h-[calc(100vh-65px)] max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.24em] text-[#ffb06a]">
            Verified artist booking
          </p>
          <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.07em] text-[var(--showman-bone)] sm:text-7xl lg:text-8xl">
            Booking rails for the next wave of live culture.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-[var(--showman-muted)] sm:text-lg">
            Real artists, authorized teams, visible availability, and direct booking
            infrastructure for people pushing the needle and putting scenes on.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/artists" className={buttonStyles("primary")}>
              Browse artists
            </Link>
            <Link href="/artists/new" className={buttonStyles("secondary")}>
              Create artist profile
            </Link>
          </div>
        </div>

        <div className={`${panelStyles("elevated")} p-4 sm:p-5`}>
          <div className="aspect-[4/5] rounded-2xl border border-[var(--showman-line)] bg-[radial-gradient(circle_at_70%_20%,rgba(255,122,26,0.34),transparent_32%),linear-gradient(145deg,#25211c,#0f0e0d)] p-5">
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em] text-[var(--showman-muted)]">
                <span>artist profile</span>
                <span className="text-[#ffb06a]">open dates</span>
              </div>
              <div>
                <p className="text-4xl font-black uppercase leading-none tracking-[-0.06em]">
                  Find the act.
                  <br />
                  Read the room.
                  <br />
                  Make it real.
                </p>
                <p className="mt-4 max-w-xs text-sm leading-6 text-[var(--showman-muted)]">
                  Phase 0 is live with artist profiles and availability, setting the base
                  for the booking rails that come after.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
