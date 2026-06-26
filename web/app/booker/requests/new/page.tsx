import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import RequestBriefForm from "@/components/booker/request-brief-form";
import { buttonStyles } from "@/components/ui/button";
import { panelStyles } from "@/components/ui/panel";
import { getCurrentUser } from "@/lib/session";
import { getBookerDashboardData } from "@/server/booking/queries";
import { getPublicArtistProfileBySlug } from "@/server/catalog/queries";

export const dynamic = "force-dynamic";

export default async function NewBookingRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ artist?: string }>;
}) {
  const user = await getCurrentUser();
  const { artist: artistSlug } = await searchParams;
  if (!artistSlug) redirect("/artists");

  const artist = await getPublicArtistProfileBySlug(artistSlug);
  if (!artist) notFound();

  if (!user) redirect(`/sign-up?role=booker&artist=${encodeURIComponent(artist.slug)}`);

  const data = await getBookerDashboardData(user.id);
  if (!data) redirect(`/onboarding?role=booker&artist=${encodeURIComponent(artist.slug)}`);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/artists/${artist.slug}`} className={buttonStyles("secondary")}>
          Back to artist
        </Link>
        <Link href="/booker/events/new" className={buttonStyles("secondary")}>
          Add event first
        </Link>
      </div>
      {data.events.length === 0 && (
        <div className={`${panelStyles("subtle")} mb-5 p-4 text-sm leading-6 text-[var(--showman-muted)]`}>
          You can send this request now, but bookers will usually want event briefs for repeated coordination.
        </div>
      )}
      <RequestBriefForm artist={artist} events={data.events} />
    </div>
  );
}
