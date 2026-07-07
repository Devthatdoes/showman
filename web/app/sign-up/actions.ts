"use server";

import { getCurrentUser } from "@/lib/session";
import { setOnboardingIntentForUser } from "@/server/identity/mutations";
import type { OnboardingIntent } from "@/server/identity/types";

// This runs with client-supplied input right after sign-up, so the raw string
// must be narrowed before it can touch the user row.
function asOnboardingIntent(intent: string): OnboardingIntent | null {
  return intent === "artist" || intent === "booker" ? intent : null;
}

export async function saveOnboardingIntent(intent: string): Promise<void> {
  const validIntent = asOnboardingIntent(intent);
  if (!validIntent) return;

  const currentUser = await getCurrentUser();
  if (!currentUser) return;

  await setOnboardingIntentForUser(currentUser.id, validIntent);
}
