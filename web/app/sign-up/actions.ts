"use server";

import { getCurrentUser } from "@/lib/session";
import { setOnboardingIntentForUser } from "@/server/identity/mutations";
import type { OnboardingIntent } from "@/server/identity/types";

// This runs with client-supplied input right after sign-up, so the raw string
// must be narrowed before it can touch the user row.
function asOnboardingIntent(intent: string): OnboardingIntent | null {
  return intent === "artist" || intent === "booker" ? intent : null;
}

export type SaveOnboardingIntentResult =
  | { saved: true }
  | { saved: false; reason: "invalid-intent" | "no-session" };

// Returns an explicit result instead of void: right after sign-up the session
// cookie may not have landed yet (getCurrentUser() → null), and the caller
// must be able to tell that from success to retry.
export async function saveOnboardingIntent(intent: string): Promise<SaveOnboardingIntentResult> {
  const validIntent = asOnboardingIntent(intent);
  if (!validIntent) return { saved: false, reason: "invalid-intent" };

  const currentUser = await getCurrentUser();
  if (!currentUser) return { saved: false, reason: "no-session" };

  await setOnboardingIntentForUser(currentUser.id, validIntent);
  return { saved: true };
}
