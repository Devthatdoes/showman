import { redirect } from "next/navigation";
import TeamDashboard from "@/components/team/team-dashboard";
import { getCurrentUser } from "@/lib/session";
import { listInboundRequestsForArtists } from "@/server/booking/queries";
import { listManageableArtistProfiles } from "@/server/identity/authorize";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const artists = await listManageableArtistProfiles(user.id);
  const inboundRequests = await listInboundRequestsForArtists(artists.map((artist) => artist.id));

  return <TeamDashboard artists={artists} inboundRequests={inboundRequests} />;
}
