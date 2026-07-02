"use server";

import { db } from "@/db";
import { user as authUser } from "@/db/auth-schema";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";

const VALID_INTENTS = new Set(["artist", "booker"]);

export async function saveOnboardingIntent(intent: string): Promise<void> {
  if (!VALID_INTENTS.has(intent)) return;

  const currentUser = await getCurrentUser();
  if (!currentUser) return;

  await db
    .update(authUser)
    .set({ onboardingIntent: intent, updatedAt: new Date() })
    .where(eq(authUser.id, currentUser.id));
}
