import { db } from "@/db";
import type { ArtistProfile, AvailabilityWindow } from "@/db/schema";

export async function listArtistProfiles(): Promise<ArtistProfile[]> {
  return db.query.artistProfiles.findMany({
    orderBy: (artist, { desc }) => desc(artist.createdAt),
  });
}

export async function listArtistProfilesForOwner(ownerUserId: string): Promise<ArtistProfile[]> {
  return db.query.artistProfiles.findMany({
    where: (artist, { eq }) => eq(artist.ownerUserId, ownerUserId),
    orderBy: (artist, { desc }) => desc(artist.createdAt),
  });
}

export async function getArtistProfileBySlug(slug: string): Promise<ArtistProfile | undefined> {
  return db.query.artistProfiles.findFirst({
    where: (artist, { eq }) => eq(artist.slug, slug),
  });
}

export async function getUpcomingOpenAvailabilityForArtist(
  artistId: string,
  today = new Date().toISOString().slice(0, 10),
): Promise<AvailabilityWindow[]> {
  return db.query.availabilityWindows.findMany({
    where: (window, { and, eq, gte }) =>
      and(eq(window.artistId, artistId), eq(window.status, "open"), gte(window.endDate, today)),
    orderBy: (window, { asc }) => asc(window.startDate),
    limit: 3,
  });
}

export async function listAvailabilityForArtist(artistId: string): Promise<AvailabilityWindow[]> {
  return db.query.availabilityWindows.findMany({
    where: (window, { eq }) => eq(window.artistId, artistId),
    orderBy: (window, { asc }) => asc(window.startDate),
  });
}
