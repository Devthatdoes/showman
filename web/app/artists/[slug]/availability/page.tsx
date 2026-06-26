export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import type { AvailabilityWindow } from "@/db/schema";
import { addAvailabilityWindow, deleteAvailabilityWindow } from "./actions";
import {
  getArtistProfileBySlug,
  listAvailabilityForArtist,
} from "@/server/catalog/queries";
import { buttonStyles } from "@/components/ui/button";
import { badgeStyles } from "@/components/ui/badge";
import {
  fieldClassName,
  helpTextClassName,
  labelClassName,
} from "@/components/ui/form";
import { panelStyles } from "@/components/ui/panel";

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
    <div className={`${panelStyles("subtle")} p-5 sm:p-6`}>
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--showman-muted)]">
        {title}
      </h3>
      <div className="grid grid-cols-7 gap-px text-center text-xs">
        {DAY_LABELS.map((d) => (
          <div key={d} className="pb-1 font-medium text-[var(--showman-muted)]">
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          if (!cell.day || !cell.dateStr) {
            return <div key={`blank-${i}`} />;
          }
          const coverage = isCovered(cell.dateStr, windows);
          let cls =
            "rounded border border-[var(--showman-line)] p-1 font-medium text-[var(--showman-muted)]";
          if (coverage === "blocked") {
            cls =
              "rounded border border-[rgba(255,92,122,0.35)] bg-[rgba(255,92,122,0.12)] p-1 font-medium text-[var(--showman-danger)]";
          } else if (coverage === "open") {
            cls =
              "rounded border border-[rgba(110,231,168,0.35)] bg-[rgba(110,231,168,0.12)] p-1 font-medium text-[var(--showman-success)]";
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

  const artist = await getArtistProfileBySlug(slug);
  if (!artist) notFound();

  const user = await getCurrentUser();
  if (!user || user.id !== artist.ownerUserId) redirect(`/artists/${slug}`);

  const windows = await listAvailabilityForArtist(artist.id);

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
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14 space-y-10">
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

        <div className={`${panelStyles("elevated")} p-6 sm:p-8`}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--showman-muted)]">
            Add a window
          </h2>
          <form action={addAvailabilityWindow} className="mt-5 space-y-4">
            <input type="hidden" name="slug" value={slug} />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label htmlFor="startDate" className={labelClassName}>
                  Start date <span className="text-[var(--showman-danger)]">*</span>
                </label>
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  required
                  className={fieldClassName}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="endDate" className={labelClassName}>
                  End date
                </label>
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  className={fieldClassName}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="status" className={labelClassName}>
                Status
              </label>
              <select id="status" name="status" className={fieldClassName}>
                <option value="open">Open (available)</option>
                <option value="blocked">Blocked (unavailable)</option>
              </select>
              <p className={helpTextClassName}>Blocked overrides open if the dates overlap.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="market" className={labelClassName}>
                Market
              </label>
              <input
                type="text"
                id="market"
                name="market"
                placeholder="e.g. New York, NY"
                className={fieldClassName}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="note" className={labelClassName}>
                Note
              </label>
              <input
                type="text"
                id="note"
                name="note"
                placeholder="Optional note"
                className={fieldClassName}
              />
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <p className={helpTextClassName}>
                End date optional — defaults to the start date. Phase 0: open /
                blocked only.
              </p>
              <button type="submit" className={buttonStyles("primary")}>
                Add window
              </button>
            </div>
          </form>
        </div>

        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--showman-muted)]">
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
          <div className="mt-3 flex items-center gap-3 text-xs text-[var(--showman-muted)]">
            <span className={badgeStyles("open")}>Available</span>
            <span className={badgeStyles("blocked")}>Blocked</span>
          </div>
        </div>

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
                      <span className={badgeStyles("open")}>Open</span>
                    ) : (
                      <span className={badgeStyles("blocked")}>Blocked</span>
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
