export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import type { AvailabilityWindow } from "@/db/schema";
import { addAvailabilityWindow, deleteAvailabilityWindow } from "./actions";

// ─── helpers ────────────────────────────────────────────────────────────────

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Build a YYYY-MM-DD string from local calendar values (no UTC shift). */
function localDateStr(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function formatDateRange(start: string, end: string): string {
  if (start === end) return start;
  return `${start} – ${end}`;
}

function isCovered(
  cellDate: string,
  windows: AvailabilityWindow[]
): "open" | "blocked" | null {
  // blocked takes priority over open
  let result: "open" | "blocked" | null = null;
  for (const w of windows) {
    if (cellDate >= w.startDate && cellDate <= w.endDate) {
      if (w.status === "blocked") return "blocked";
      if (w.status === "open") result = "open";
    }
  }
  return result;
}

// ─── sub-components (functions, not JSX components, for server-only clarity) ─

function MonthGrid({
  year,
  monthIndex,
  windows,
}: {
  year: number;
  monthIndex: number;
  windows: AvailabilityWindow[];
}) {
  const MONTH_NAMES = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  const firstDow = new Date(year, monthIndex, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const title = `${MONTH_NAMES[monthIndex]} ${year}`;

  const cells: { day: number | null; dateStr: string | null }[] = [];
  for (let i = 0; i < firstDow; i++) {
    cells.push({ day: null, dateStr: null });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, dateStr: localDateStr(year, monthIndex, d) });
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
      <h3 className="mb-4 text-sm font-semibold tracking-wide text-zinc-300">
        {title}
      </h3>
      <div className="grid grid-cols-7 gap-px text-center text-xs">
        {DAY_LABELS.map((d) => (
          <div key={d} className="pb-1 font-medium text-zinc-500">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell.day || !cell.dateStr) {
            return <div key={`blank-${i}`} />;
          }
          const coverage = isCovered(cell.dateStr, windows);
          let cls =
            "rounded p-1 border font-medium text-zinc-500 border-zinc-800";
          if (coverage === "blocked") {
            cls =
              "rounded p-1 border font-medium bg-rose-500/15 text-rose-300 border-rose-500/30";
          } else if (coverage === "open") {
            cls =
              "rounded p-1 border font-medium bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
          }
          return (
            <div key={cell.dateStr} className={cls}>
              {cell.day}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function AvailabilityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const artist = await db.query.artistProfiles.findFirst({
    where: (a, { eq }) => eq(a.slug, slug),
  });
  if (!artist) notFound();

  const windows = await db.query.availabilityWindows.findMany({
    where: (w, { eq, and }) => and(eq(w.artistId, artist.id)),
    orderBy: (w, { asc }) => asc(w.startDate),
  });

  // Two-month grid: current + next
  const now = new Date();
  const gridMonths = [
    { year: now.getFullYear(), monthIndex: now.getMonth() },
    {
      year: now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(),
      monthIndex: now.getMonth() === 11 ? 0 : now.getMonth() + 1,
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-3xl px-6 py-16 space-y-10">
        {/* back link */}
        <div>
          <Link
            href={`/artists/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-100"
          >
            <span aria-hidden="true">&#8592;</span>
            Back to profile
          </Link>
        </div>

        {/* heading */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Availability
          </h1>
          <p className="mt-1 text-zinc-400">{artist.stageName}</p>
        </div>

        {/* ── add window form ── */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6">
          <h2 className="mb-5 text-sm font-semibold text-zinc-300 uppercase tracking-wide">
            Add a window
          </h2>
          <form action={addAvailabilityWindow} className="space-y-4">
            <input type="hidden" name="slug" value={slug} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label
                  htmlFor="startDate"
                  className="text-xs font-medium text-zinc-400"
                >
                  Start date <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  required
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label
                  htmlFor="endDate"
                  className="text-xs font-medium text-zinc-400"
                >
                  End date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="status"
                className="text-xs font-medium text-zinc-400"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
              >
                <option value="open">Open (available)</option>
                <option value="blocked">Blocked (unavailable)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="market"
                className="text-xs font-medium text-zinc-400"
              >
                Market
              </label>
              <input
                type="text"
                id="market"
                name="market"
                placeholder="e.g. New York, NY"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label
                htmlFor="note"
                className="text-xs font-medium text-zinc-400"
              >
                Note
              </label>
              <input
                type="text"
                id="note"
                name="note"
                placeholder="Optional note"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <p className="text-xs text-zinc-500">
                End date optional — defaults to the start date. Phase 0: open /
                blocked only.
              </p>
              <button
                type="submit"
                className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-emerald-400 whitespace-nowrap"
              >
                Add window
              </button>
            </div>
          </form>
        </div>

        {/* ── two-month calendar grid ── */}
        <div>
          <h2 className="mb-4 text-sm font-semibold text-zinc-300 uppercase tracking-wide">
            Calendar
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {gridMonths.map(({ year, monthIndex }) => (
              <MonthGrid
                key={`${year}-${monthIndex}`}
                year={year}
                monthIndex={monthIndex}
                windows={windows}
              />
            ))}
          </div>
          {/* legend */}
          <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-emerald-500/30 border border-emerald-500/40" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded bg-rose-500/30 border border-rose-500/40" />
              Blocked
            </span>
          </div>
        </div>

        {/* ── windows list ── */}
        <div>
          <h2 className="mb-4 text-sm font-semibold text-zinc-300 uppercase tracking-wide">
            Windows
          </h2>

          {windows.length === 0 ? (
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 text-center text-sm text-zinc-500">
              No availability windows yet. Add one above to get started.
            </div>
          ) : (
            <ul className="space-y-2">
              {windows.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-5 py-4"
                >
                  <div className="flex flex-wrap items-center gap-3 min-w-0">
                    <span className="text-sm font-medium text-zinc-100 tabular-nums">
                      {formatDateRange(w.startDate, w.endDate)}
                    </span>

                    {w.status === "open" ? (
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs text-emerald-300">
                        open
                      </span>
                    ) : (
                      <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-xs text-rose-300">
                        blocked
                      </span>
                    )}

                    {w.market && (
                      <span className="text-xs text-zinc-400">{w.market}</span>
                    )}
                    {w.note && (
                      <span className="text-xs text-zinc-500 italic truncate max-w-xs">
                        {w.note}
                      </span>
                    )}
                  </div>

                  <form action={deleteAvailabilityWindow} className="shrink-0">
                    <input type="hidden" name="id" value={w.id} />
                    <input type="hidden" name="slug" value={slug} />
                    <button
                      type="submit"
                      className="inline-flex items-center rounded-lg border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
                    >
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
