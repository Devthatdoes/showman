import { redirect } from "next/navigation";
import { db } from "@/db";
import { user as authUser } from "@/db/auth-schema";
import OnboardingFlow from "@/components/onboarding/onboarding-flow";
import { getCurrentUser } from "@/lib/session";
import { getActorWorkspace } from "@/server/identity/queries";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; artist?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const { role, artist } = await searchParams;
  const [accountUser] = await db
    .select({ onboardingIntent: authUser.onboardingIntent })
    .from(authUser)
    .where(eq(authUser.id, user.id))
    .limit(1);
  const workspace = await getActorWorkspace(user.id);
  const intent = role === "artist"
    ? "artist"
    : role === "booker" || artist || accountUser?.onboardingIntent === "booker"
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
