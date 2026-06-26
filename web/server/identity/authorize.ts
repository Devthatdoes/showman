import { db } from "@/db";
import { artistProfiles, memberships, type ArtistProfile } from "@/db/schema";
import { and, eq, inArray } from "drizzle-orm";

const MANAGE_ARTIST_ROLES = ["owner", "agent"] as const;

export async function canManageArtist(userId: string, artist: Pick<ArtistProfile, "ownerUserId" | "orgId">) {
  if (artist.ownerUserId === userId) return true;
  if (!artist.orgId) return false;

  const [membership] = await db
    .select({ id: memberships.id })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.orgId, artist.orgId),
        eq(memberships.status, "active"),
        inArray(memberships.role, MANAGE_ARTIST_ROLES),
      ),
    )
    .limit(1);

  return Boolean(membership);
}

export async function listManageableArtistProfiles(userId: string): Promise<ArtistProfile[]> {
  const owned = await db
    .select()
    .from(artistProfiles)
    .where(eq(artistProfiles.ownerUserId, userId))
    .orderBy(artistProfiles.createdAt);

  const orgRows = await db
    .select({ orgId: memberships.orgId })
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, userId),
        eq(memberships.status, "active"),
        inArray(memberships.role, MANAGE_ARTIST_ROLES),
      ),
    );

  const orgIds = orgRows.map((row) => row.orgId);
  if (orgIds.length === 0) return owned;

  const managed = await db
    .select()
    .from(artistProfiles)
    .where(inArray(artistProfiles.orgId, orgIds))
    .orderBy(artistProfiles.createdAt);

  const byId = new Map<string, ArtistProfile>();
  for (const artist of [...owned, ...managed]) byId.set(artist.id, artist);
  return Array.from(byId.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
