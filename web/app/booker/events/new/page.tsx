import { redirect } from "next/navigation";
import { createBookerEvent } from "@/app/booker/events/actions";
import { buttonStyles } from "@/components/ui/button";
import { fieldClassName, labelClassName } from "@/components/ui/form";
import { panelStyles } from "@/components/ui/panel";
import { CAPACITY_BAND_OPTIONS, EVENT_TYPE_OPTIONS } from "@/lib/event-options";
import { getCurrentUser } from "@/lib/session";
import { getBookerProfileForUser } from "@/server/identity/queries";

export const dynamic = "force-dynamic";

export default async function NewBookerEventPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const profile = await getBookerProfileForUser(user.id);
  if (!profile) redirect("/onboarding?role=booker");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <form action={createBookerEvent} className={`${panelStyles("elevated")} p-6 sm:p-8`}>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ffb06a]">
          Event brief
        </p>
        <h1 className="mt-4 text-4xl font-black uppercase leading-none tracking-[-0.05em] text-[var(--showman-bone)] sm:text-6xl">
          New event
        </h1>
        <div className="mt-6 grid gap-4">
          <label className="grid gap-2">
            <span className={labelClassName}>Event name</span>
            <input name="eventName" required className={fieldClassName} />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={labelClassName}>Event type</span>
              <select name="eventType" defaultValue="show" className={fieldClassName}>
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
              <input name="market" className={fieldClassName} />
            </label>
          </div>
          <label className="grid gap-2">
            <span className={labelClassName}>Capacity</span>
            <select name="capacityBand" defaultValue="" className={fieldClassName}>
              <option value="">Select capacity</option>
              {CAPACITY_BAND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button className={`${buttonStyles("primary")} mt-6`} type="submit">
          Save event
        </button>
      </form>
    </div>
  );
}
