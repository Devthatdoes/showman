import { db } from "@/db";
import { bookerProfiles, memberships, orgs, type BookerProfile } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { ActorWorkspace } from "./types";

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
  const orgRows = await db
    .select({ org: orgs, membership: memberships })
    .from(memberships)
    .innerJoin(orgs, eq(memberships.orgId, orgs.id))
    .where(and(eq(memberships.userId, userId), eq(memberships.status, "active")))
    .orderBy(orgs.createdAt);

  return {
    orgs: orgRows.map((row) => ({ ...row.org, membership: row.membership })),
    bookerProfile: await getBookerProfileForUser(userId),
  };
}
