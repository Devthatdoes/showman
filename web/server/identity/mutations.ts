import { db } from "@/db";
import { bookerProfiles, memberships, orgs, type BookerProfile, type Org } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { recordEvent } from "@/server/events/mutations";
import { getBookerProfileForUser } from "./queries";
import { slugifyIdentity } from "./types";

function uniqueSlug(base: string) {
  return `${base}-${Date.now().toString(36).slice(-5)}`;
}

export async function ensurePersonalOrgForUser(userId: string, name: string): Promise<Org> {
  const existing = await db
    .select({ org: orgs })
    .from(memberships)
    .innerJoin(orgs, eq(memberships.orgId, orgs.id))
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.role, "owner"),
        eq(memberships.status, "active"),
        eq(orgs.type, "personal"),
        eq(orgs.ownerUserId, userId),
      ),
    )
    .orderBy(orgs.createdAt)
    .limit(1);

  if (existing[0]?.org) return existing[0].org;

  const baseSlug = slugifyIdentity(name, "workspace");
  const [org] = await db
    .insert(orgs)
    .values({
      slug: uniqueSlug(baseSlug),
      name: `${name.trim() || "Showman"} workspace`,
      type: "personal",
      ownerUserId: userId,
    })
    .returning();

  await db.insert(memberships).values({
    userId,
    orgId: org.id,
    role: "owner",
    status: "active",
  });

  await recordEvent({
    actorUserId: userId,
    principalType: "org",
    principalId: org.id,
    role: "owner",
    action: "org.created",
    payload: { source: "onboarding" },
  });

  return org;
}

export type BookerProfileInput = {
  displayName: string;
  roleTitle?: string | null;
  homeMarket?: string | null;
  shortDescriptor?: string | null;
  credibilitySummary?: string | null;
};

export async function ensureBookerProfileForUser(
  userId: string,
  input: BookerProfileInput,
): Promise<BookerProfile> {
  const displayName = input.displayName.trim();
  if (!displayName) throw new Error("Booker display name is required");

  const existing = await getBookerProfileForUser(userId);
  if (existing) {
    const [updated] = await db
      .update(bookerProfiles)
      .set({
        displayName,
        roleTitle: input.roleTitle?.trim() || null,
        homeMarket: input.homeMarket?.trim() || null,
        shortDescriptor: input.shortDescriptor?.trim() || null,
        credibilitySummary: input.credibilitySummary?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(bookerProfiles.id, existing.id))
      .returning();
    return updated;
  }

  const [profile] = await db
    .insert(bookerProfiles)
    .values({
      slug: uniqueSlug(slugifyIdentity(displayName, "booker")),
      displayName,
      ownerUserId: userId,
      type: "individual",
      roleTitle: input.roleTitle?.trim() || null,
      homeMarket: input.homeMarket?.trim() || null,
      shortDescriptor: input.shortDescriptor?.trim() || null,
      credibilitySummary: input.credibilitySummary?.trim() || null,
    })
    .returning();

  await recordEvent({
    actorUserId: userId,
    principalType: "booker_profile",
    principalId: profile.id,
    role: "owner",
    action: "booker_profile.created",
    payload: { source: "onboarding" },
  });

  return profile;
}
