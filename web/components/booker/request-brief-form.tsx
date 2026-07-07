import { createBookingRequest } from "@/app/booker/requests/actions";
import { buttonStyles } from "@/components/ui/button";
import { fieldClassName, labelClassName } from "@/components/ui/form";
import { panelStyles } from "@/components/ui/panel";
import { CAPACITY_BAND_OPTIONS, EVENT_TYPE_OPTIONS } from "@/lib/event-options";
import type { PublicArtistProfile } from "@/server/catalog/types";
import type { BookerEvent } from "@/db/schema";

export default function RequestBriefForm({
  artist,
  events,
}: {
  artist: PublicArtistProfile;
  events: BookerEvent[];
}) {
  return (
    <form action={createBookingRequest} className={`${panelStyles("elevated")} p-6 sm:p-8`}>
      <input type="hidden" name="artistSlug" value={artist.slug} />
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ffb06a]">
            Request access
          </p>
          <h1 className="mt-4 text-4xl font-black uppercase leading-none tracking-[-0.05em] text-[var(--showman-bone)] sm:text-6xl">
            {artist.stageName}
          </h1>
          <p className="mt-4 text-sm leading-6 text-[var(--showman-muted)]">
            Write the event clearly. This is the beginning of a trackable request, not a loose DM.
          </p>
        </div>
        <div className="grid gap-4">
          {events.length > 0 && (
            <label className="grid gap-2">
              <span className={labelClassName}>Attach event brief</span>
              <select name="bookerEventId" className={fieldClassName} defaultValue="">
                <option value="">No existing event</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="grid gap-2">
            <span className={labelClassName}>Event name</span>
            <input name="eventName" required placeholder="Club night, festival stage, private event" className={fieldClassName} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={labelClassName}>Event type</span>
              <select name="eventType" className={fieldClassName} defaultValue="show">
                {EVENT_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className={labelClassName}>Target date</span>
              <input name="targetDate" type="date" className={fieldClassName} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={labelClassName}>Venue</span>
              <input name="venueName" className={fieldClassName} />
            </label>
            <label className="grid gap-2">
              <span className={labelClassName}>Market</span>
              <input name="market" placeholder="Atlanta, GA" className={fieldClassName} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={labelClassName}>Capacity</span>
              <select name="capacityBand" className={fieldClassName} defaultValue="">
                <option value="">Select capacity</option>
                {CAPACITY_BAND_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className={labelClassName}>Budget posture</span>
              <select name="budgetBand" className={fieldClassName} defaultValue="">
                <option value="">Select budget</option>
                <option value="under-5k">Under $5k</option>
                <option value="5k-15k">$5k-$15k</option>
                <option value="15k-50k">$15k-$50k</option>
                <option value="50k+">$50k+</option>
                <option value="by-request">By request</option>
              </select>
            </label>
          </div>
          <label className="grid gap-2">
            <span className={labelClassName}>Pitch</span>
            <textarea
              name="pitch"
              required
              rows={5}
              placeholder="What is the event, why this artist, what context should the team know?"
              className={fieldClassName}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button name="status" value="request_sent" className={buttonStyles("primary")} type="submit">
              Send request
            </button>
            <button name="status" value="draft" className={buttonStyles("secondary")} type="submit">
              Save draft
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
