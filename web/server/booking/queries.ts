import { db } from "@/db";
import { artistProfiles, bookerEvents, bookerProfiles, bookingRequests } from "@/db/schema";
import { getBookerProfileForUser } from "@/server/identity/queries";
import { and, desc, eq, inArray } from "drizzle-orm";

// A booker's `draft` is private, unsent intent; `cancelled` is withdrawn. The artist
// team only ever sees requests that were actually sent, plus their own responses.
const TEAM_VISIBLE_STATUSES = ["request_sent", "accepted", "declined"] as const;
import type {
  BookerDashboardData,
  BookerRequestListItem,
  InboundRequestListItem,
} from "./types";
import { emptyStatusCounts } from "./types";

export async function getBookerDashboardData(userId: string): Promise<BookerDashboardData | null> {
  const profile = await getBookerProfileForUser(userId);
  if (!profile) return null;

  const [events, requestRows] = await Promise.all([
    db
      .select()
      .from(bookerEvents)
      .where(eq(bookerEvents.bookerProfileId, profile.id))
      .orderBy(desc(bookerEvents.createdAt)),
    db
      .select({
        request: bookingRequests,
        artistSlug: artistProfiles.slug,
        artistStageName: artistProfiles.stageName,
        artistImageUrl: artistProfiles.imageUrl,
      })
      .from(bookingRequests)
      .innerJoin(artistProfiles, eq(bookingRequests.artistId, artistProfiles.id))
      .where(eq(bookingRequests.bookerProfileId, profile.id))
      .orderBy(desc(bookingRequests.createdAt)),
  ]);

  const requests: BookerRequestListItem[] = requestRows.map((row) => ({
    ...row.request,
    artistSlug: row.artistSlug,
    artistStageName: row.artistStageName,
    artistImageUrl: row.artistImageUrl,
  }));

  const statusCounts = emptyStatusCounts();
  for (const request of requests) statusCounts[request.status] += 1;

  return { profile, events, requests, statusCounts };
}

// Takes artist ids rather than a user id so callers that already fetched the
// manageable roster (the team page renders it too) don't pay for the
// owned-artists + memberships query chain a second time.
export async function listInboundRequestsForArtists(artistIds: string[]): Promise<InboundRequestListItem[]> {
  if (artistIds.length === 0) return [];

  const rows = await db
    .select({
      request: bookingRequests,
      artistSlug: artistProfiles.slug,
      artistStageName: artistProfiles.stageName,
      bookerDisplayName: bookerProfiles.displayName,
      bookerRoleTitle: bookerProfiles.roleTitle,
      bookerHomeMarket: bookerProfiles.homeMarket,
    })
    .from(bookingRequests)
    .innerJoin(artistProfiles, eq(bookingRequests.artistId, artistProfiles.id))
    .innerJoin(bookerProfiles, eq(bookingRequests.bookerProfileId, bookerProfiles.id))
    .where(
      and(
        inArray(bookingRequests.artistId, artistIds),
        inArray(bookingRequests.status, TEAM_VISIBLE_STATUSES),
      ),
    )
    .orderBy(desc(bookingRequests.createdAt));

  return rows.map((row) => ({
    ...row.request,
    artistSlug: row.artistSlug,
    artistStageName: row.artistStageName,
    bookerDisplayName: row.bookerDisplayName,
    bookerRoleTitle: row.bookerRoleTitle,
    bookerHomeMarket: row.bookerHomeMarket,
  }));
}
