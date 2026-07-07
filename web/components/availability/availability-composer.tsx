"use client";

import { useMemo, useState } from "react";
import type { AvailabilityWindow } from "@/db/schema";
import {
  BOOKING_LOCATION_GROUPS,
  TRAVEL_POLICY_OPTIONS,
  type BookingLocationOption,
  type TravelPolicyValue,
} from "@/lib/booking-locations";
import { badgeStyles } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { helpTextClassName } from "@/components/ui/form";
import { formatDate } from "@/lib/format-date";

type AvailabilityStatus = "open" | "blocked";

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

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function localDateStr(year: number, month: number, day: number): string {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function coveredBy(date: string, windows: AvailabilityWindow[]): AvailabilityStatus | null {
  let result: AvailabilityStatus | null = null;

  for (const window of windows) {
    if (date >= window.startDate && date <= window.endDate) {
      if (window.status === "blocked") return "blocked";
      if (window.status === "open") result = "open";
    }
  }

  return result;
}

function buildCells(year: number, monthIndex: number) {
  const firstDow = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells: { key: string; day: number | null; date: string | null }[] = [];

  for (let i = 0; i < firstDow; i++) {
    cells.push({ key: `blank-${year}-${monthIndex}-${i}`, day: null, date: null });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = localDateStr(year, monthIndex, day);
    cells.push({ key: date, day, date });
  }

  return cells;
}

function normaliseRange(start: string | null, end: string | null) {
  if (!start) return { startDate: "", endDate: "" };
  if (!end) return { startDate: start, endDate: start };
  return start <= end
    ? { startDate: start, endDate: end }
    : { startDate: end, endDate: start };
}

function travelPolicyLabel(value: TravelPolicyValue): string {
  return TRAVEL_POLICY_OPTIONS.find((option) => option.value === value)?.label ?? "Case by case";
}

export default function AvailabilityComposer({
  slug,
  windows,
  action,
}: {
  slug: string;
  windows: AvailabilityWindow[];
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [status, setStatus] = useState<AvailabilityStatus>("open");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<BookingLocationOption | null>(null);
  const [travelPolicy, setTravelPolicy] = useState<TravelPolicyValue>("travel-covered-required");
  const [artistNote, setArtistNote] = useState("");

  const gridMonths = useMemo(() => {
    const now = new Date();
    return [
      { year: now.getFullYear(), monthIndex: now.getMonth() },
      {
        year: now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(),
        monthIndex: now.getMonth() === 11 ? 0 : now.getMonth() + 1,
      },
    ];
  }, []);

  const filteredGroups = useMemo(() => {
    const query = locationQuery.trim().toLowerCase();
    if (!query) return BOOKING_LOCATION_GROUPS;

    return BOOKING_LOCATION_GROUPS.map((group) => ({
      ...group,
      options: group.options.filter((option) =>
        `${option.label} ${option.country} ${option.region} ${option.searchText}`
          .toLowerCase()
          .includes(query),
      ),
    })).filter((group) => group.options.length > 0);
  }, [locationQuery]);

  const range = normaliseRange(startDate, endDate);
  const hasRange = Boolean(range.startDate);
  const selectedMarket = selectedLocation?.label ?? "";
  const noteParts = [
    travelPolicyLabel(travelPolicy),
    artistNote.trim(),
  ].filter(Boolean);

  function selectDate(date: string) {
    if (!startDate || (startDate && endDate)) {
      setStartDate(date);
      setEndDate(null);
      return;
    }

    setEndDate(date);
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-[rgba(255,248,236,0.12)] bg-[rgba(16,15,13,0.82)] shadow-2xl shadow-black/30">
      <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="border-b border-[var(--showman-line)] p-5 sm:p-7 lg:border-b-0 lg:border-r">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ffb06a]">
                Paint the calendar
              </p>
              <h2 className="mt-2 text-3xl font-black uppercase leading-none tracking-[-0.05em] text-[var(--showman-bone)]">
                Dates people can request
              </h2>
            </div>
            <div className="flex gap-2">
              <span className={badgeStyles("open")}>Taking requests</span>
              <span className={badgeStyles("blocked")}>Not accepting</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {gridMonths.map(({ year, monthIndex }) => (
              <div key={`${year}-${monthIndex}`} className="rounded-3xl bg-black/18 p-4">
                <div className="mb-4 flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--showman-bone)]">
                    {MONTH_NAMES[monthIndex]}
                  </h3>
                  <span className="text-xs text-[var(--showman-muted)]">{year}</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {DAY_LABELS.map((day, index) => (
                    <div
                      key={`${day}-${index}`}
                      className="pb-1 text-[0.65rem] font-bold uppercase text-[rgba(255,248,236,0.38)]"
                    >
                      {day}
                    </div>
                  ))}
                  {buildCells(year, monthIndex).map((cell) => {
                    if (!cell.date || !cell.day) {
                      return <div key={cell.key} className="aspect-square" />;
                    }

                    const date = cell.date;
                    const coverage = coveredBy(date, windows);
                    const isSelected =
                      hasRange && date >= range.startDate && date <= range.endDate;

                    return (
                      <button
                        key={cell.key}
                        type="button"
                        onClick={() => selectDate(date)}
                        className={[
                          "aspect-square rounded-full border text-xs font-bold tabular-nums transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--showman-orange)]",
                          "cursor-pointer hover:-translate-y-0.5 hover:border-[rgba(255,122,26,0.8)] hover:bg-[rgba(255,122,26,0.18)] hover:text-[var(--showman-bone)]",
                          coverage === "open"
                            ? "border-[rgba(110,231,168,0.35)] bg-[rgba(110,231,168,0.09)] text-[var(--showman-success)]"
                            : "",
                          coverage === "blocked"
                            ? "border-[rgba(255,92,122,0.34)] bg-[rgba(255,92,122,0.09)] text-[var(--showman-danger)]"
                            : "",
                          !coverage
                            ? "border-[rgba(255,248,236,0.1)] bg-[rgba(255,248,236,0.035)] text-[var(--showman-muted)]"
                            : "",
                          isSelected
                            ? "border-[var(--showman-orange)] bg-[rgba(255,122,26,0.28)] text-[var(--showman-bone)] shadow-[0_0_18px_rgba(255,122,26,0.18)]"
                            : "",
                        ].join(" ")}
                        aria-pressed={isSelected}
                        aria-label={`Select ${formatDate(date)}`}
                      >
                        {cell.day}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <form id="availability-window-form" action={action} className="hidden">
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="startDate" value={range.startDate} />
            <input type="hidden" name="endDate" value={range.endDate} />
            <input type="hidden" name="status" value={status} />
            <input type="hidden" name="market" value={selectedMarket} />
            <input type="hidden" name="note" value={noteParts.join(" / ")} />
          </form>

          <div className="flex h-full flex-col gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ffb06a]">
                Window details
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--showman-muted)]">
                Choose a date range, where you will take requests, and what travel terms need
                to be known before a booker reaches out.
              </p>
            </div>

            <div className="rounded-3xl border border-[var(--showman-line)] bg-black/20 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--showman-muted)]">
                Selected dates
              </p>
              <p className="mt-2 text-xl font-black uppercase tracking-[-0.04em] text-[var(--showman-bone)]">
                {hasRange
                  ? `${formatDate(range.startDate)}${range.endDate !== range.startDate ? ` - ${formatDate(range.endDate)}` : ""}`
                  : "Tap the calendar"}
              </p>
              <p className={`mt-2 ${helpTextClassName}`}>
                Tap once for a single date, or tap a second date to create a range.
              </p>
            </div>

            <fieldset className="space-y-3">
              <legend className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--showman-muted)]">
                Request posture
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {[
                  ["open", "Taking requests"],
                  ["blocked", "Not accepting"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatus(value as AvailabilityStatus)}
                    className={[
                      "rounded-full border px-4 py-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--showman-orange)]",
                      status === value
                        ? "border-[var(--showman-orange)] bg-[rgba(255,122,26,0.18)] text-[var(--showman-bone)]"
                        : "border-[var(--showman-line)] bg-[rgba(255,248,236,0.03)] text-[var(--showman-muted)] hover:text-[var(--showman-bone)]",
                    ].join(" ")}
                    aria-pressed={status === value}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="space-y-3">
              <label
                htmlFor="locationSearch"
                className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--showman-muted)]"
              >
                Booking location
              </label>
              <input
                id="locationSearch"
                type="search"
                value={locationQuery}
                onChange={(event) => setLocationQuery(event.target.value)}
                placeholder="Search city, country, or region"
                className="w-full border-0 border-b border-[rgba(255,248,236,0.16)] bg-transparent px-0 py-3 text-base text-[var(--showman-bone)] outline-none transition placeholder:text-[rgba(184,173,157,0.52)] focus:border-[var(--showman-orange)]"
              />
              <div className="max-h-56 space-y-4 overflow-auto pr-1">
                {filteredGroups.map((group) => (
                  <div key={group.continent}>
                    <p className="mb-2 text-[0.66rem] font-bold uppercase tracking-[0.18em] text-[rgba(255,248,236,0.38)]">
                      {group.continent}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSelectedLocation(option)}
                          className={[
                            "rounded-full border px-3 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--showman-orange)]",
                            selectedLocation?.value === option.value
                              ? "border-[var(--showman-orange)] bg-[rgba(255,122,26,0.18)] text-[var(--showman-bone)]"
                              : "border-[var(--showman-line)] bg-transparent text-[var(--showman-muted)] hover:border-[rgba(255,122,26,0.45)] hover:text-[var(--showman-bone)]",
                          ].join(" ")}
                          title={`${option.country} / ${option.region}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <fieldset className="space-y-3">
              <legend className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--showman-muted)]">
                Travel terms
              </legend>
              <div className="space-y-2">
                {TRAVEL_POLICY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTravelPolicy(option.value)}
                    className={[
                      "w-full rounded-2xl border p-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--showman-orange)]",
                      travelPolicy === option.value
                        ? "border-[var(--showman-orange)] bg-[rgba(255,122,26,0.16)]"
                        : "border-[var(--showman-line)] bg-[rgba(255,248,236,0.03)] hover:bg-[rgba(255,248,236,0.06)]",
                    ].join(" ")}
                    aria-pressed={travelPolicy === option.value}
                  >
                    <span className="block text-sm font-bold text-[var(--showman-bone)]">
                      {option.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--showman-muted)]">
                      {option.description}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="space-y-2">
              <label
                htmlFor="artistNote"
                className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--showman-muted)]"
              >
                Internal note
              </label>
              <input
                id="artistNote"
                type="text"
                value={artistNote}
                onChange={(event) => setArtistNote(event.target.value)}
                placeholder="Routing, venue type, or terms to remember"
                className="w-full border-0 border-b border-[rgba(255,248,236,0.16)] bg-transparent px-0 py-3 text-sm text-[var(--showman-bone)] outline-none transition placeholder:text-[rgba(184,173,157,0.52)] focus:border-[var(--showman-orange)]"
              />
            </div>

            <button
              form="availability-window-form"
              type="submit"
              disabled={!hasRange || !selectedLocation}
              className={`${buttonStyles("primary")} mt-auto w-full disabled:cursor-not-allowed`}
            >
              Add window
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
