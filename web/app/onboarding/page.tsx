import { redirect } from "next/navigation";
import OnboardingFlow from "@/components/onboarding/onboarding-flow";
import { getCurrentUser } from "@/lib/session";
import { getActorWorkspace, getOnboardingIntentForUser } from "@/server/identity/queries";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; artist?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const { role, artist } = await searchParams;
  const [savedIntent, workspace] = await Promise.all([
    getOnboardingIntentForUser(user.id),
    getActorWorkspace(user.id),
  ]);
  const intent = role === "artist"
    ? "artist"
    : role === "booker" || artist || savedIntent === "booker"
      ? "booker"
      : "artist";

  return (
    <OnboardingFlow
      intent={intent}
      userName={user.name ?? ""}
      requestedArtist={artist}
      existingOrg={workspace.orgs[0] ?? null}
      existingBookerProfile={workspace.bookerProfile}
    />
  );
}
