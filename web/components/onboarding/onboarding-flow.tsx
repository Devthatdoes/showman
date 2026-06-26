import Link from "next/link";
import { completeArtistOnboarding, completeBookerOnboarding } from "@/app/onboarding/actions";
import { buttonStyles } from "@/components/ui/button";
import { fieldClassName, labelClassName } from "@/components/ui/form";
import { panelStyles } from "@/components/ui/panel";
import type { BookerProfile, Org } from "@/db/schema";

type OnboardingFlowProps = {
  intent: "artist" | "booker";
  userName: string;
  requestedArtist?: string;
  existingOrg?: Org | null;
  existingBookerProfile?: BookerProfile | null;
};

export default function OnboardingFlow({
  intent,
  userName,
  requestedArtist,
  existingOrg,
  existingBookerProfile,
}: OnboardingFlowProps) {
  const isBooker = intent === "booker";

  return (
    <div className="min-h-screen px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <section className={`${panelStyles("subtle")} p-6 sm:p-8`}>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#ffb06a]">
            Onboarding
          </p>
          <h1 className="mt-4 text-4xl font-black uppercase leading-none tracking-[-0.05em] text-[var(--showman-bone)] sm:text-6xl">
            {isBooker ? "Set up the demand side." : "Set up the artist side."}
          </h1>
          <p className="mt-5 text-sm leading-6 text-[var(--showman-muted)]">
            {isBooker
              ? "Bookers need a clear dossier and event workspace so requests become trackable work, not loose emails."
              : "Artist teams need a workspace that can grow into roster, membership, and on-behalf-of authority."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/team" className={buttonStyles("secondary")}>
              Team dashboard
            </Link>
            <Link href="/booker" className={buttonStyles("secondary")}>
              Booker dashboard
            </Link>
          </div>
        </section>

        {isBooker ? (
          <form action={completeBookerOnboarding} className={`${panelStyles("elevated")} p-6 sm:p-8`}>
            <input type="hidden" name="requestedArtist" value={requestedArtist ?? ""} />
            <h2 className="text-2xl font-black uppercase tracking-[-0.04em] text-[var(--showman-bone)]">
              Booker profile
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--showman-muted)]">
              This is what artist teams see when sizing up a request.
            </p>
            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className={labelClassName}>Display name</span>
                <input
                  name="displayName"
                  required
                  defaultValue={existingBookerProfile?.displayName ?? userName}
                  className={fieldClassName}
                />
              </label>
              <label className="grid gap-2">
                <span className={labelClassName}>Role / title</span>
                <input
                  name="roleTitle"
                  placeholder="Talent buyer, promoter, venue programmer"
                  defaultValue={existingBookerProfile?.roleTitle ?? ""}
                  className={fieldClassName}
                />
              </label>
              <label className="grid gap-2">
                <span className={labelClassName}>Home market</span>
                <input
                  name="homeMarket"
                  placeholder="New York, NY"
                  defaultValue={existingBookerProfile?.homeMarket ?? ""}
                  className={fieldClassName}
                />
              </label>
              <label className="grid gap-2">
                <span className={labelClassName}>Short descriptor</span>
                <input
                  name="shortDescriptor"
                  placeholder="Independent promoter focused on new club scenes"
                  defaultValue={existingBookerProfile?.shortDescriptor ?? ""}
                  className={fieldClassName}
                />
              </label>
              <label className="grid gap-2">
                <span className={labelClassName}>Credibility summary</span>
                <textarea
                  name="credibilitySummary"
                  rows={4}
                  placeholder="Venues, event series, markets, or booking context artists should know."
                  defaultValue={existingBookerProfile?.credibilitySummary ?? ""}
                  className={fieldClassName}
                />
              </label>
            </div>
            <button className={`${buttonStyles("primary")} mt-6`} type="submit">
              Continue to booker dashboard
            </button>
          </form>
        ) : (
          <form action={completeArtistOnboarding} className={`${panelStyles("elevated")} p-6 sm:p-8`}>
            <h2 className="text-2xl font-black uppercase tracking-[-0.04em] text-[var(--showman-bone)]">
              Team workspace
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--showman-muted)]">
              This workspace is the future home for roster, members, authority, and artist-side requests.
            </p>
            <div className="mt-6 grid gap-4">
              <label className="grid gap-2">
                <span className={labelClassName}>Workspace name</span>
                <input
                  name="workspaceName"
                  required
                  defaultValue={existingOrg?.name ?? `${userName || "Artist"} workspace`}
                  className={fieldClassName}
                />
              </label>
            </div>
            <button className={`${buttonStyles("primary")} mt-6`} type="submit">
              Continue to team dashboard
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
