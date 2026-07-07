import { db } from "@/db";
import { user as authUser } from "@/db/auth-schema";
import { bookerProfiles, memberships, orgs, type BookerProfile } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { ActorWorkspace, OnboardingIntent } from "./types";

export async function getBookerProfileForUser(userId: string): Promise<BookerProfile | null> {
  const [profile] = await db
    .select()
    .from(bookerProfiles)
    .where(eq(bookerProfiles.ownerUserId, userId))
    .orderBy(bookerProfiles.createdAt)
    .limit(1);

  return profile ?? null;
}

export async function getActorWorkspace(userId: string): Promise<ActorWorkspace> {
  const [orgRows, bookerProfile] = await Promise.all([
    db
      .select({ org: orgs, membership: memberships })
      .from(memberships)
      .innerJoin(orgs, eq(memberships.orgId, orgs.id))
      .where(and(eq(memberships.userId, userId), eq(memberships.status, "active")))
      .orderBy(orgs.createdAt),
    getBookerProfileForUser(userId),
  ]);

  return {
    orgs: orgRows.map((row) => ({ ...row.org, membership: row.membership })),
    bookerProfile,
  };
}

export async function getOnboardingIntentForUser(userId: string): Promise<OnboardingIntent | null> {
  const [row] = await db
    .select({ onboardingIntent: authUser.onboardingIntent })
    .from(authUser)
    .where(eq(authUser.id, userId))
    .limit(1);

  return (row?.onboardingIntent as OnboardingIntent | null) ?? null;
}
