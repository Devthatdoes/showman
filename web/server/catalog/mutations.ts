import { db } from "@/db";
import { artistProfiles, availabilityWindows, type ArtistProfile } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getArtistProfileBySlug } from "./queries";
import { parseArtistProfileFormData, slugifyArtistName } from "./types";

export async function requireOwnedArtist(ownerUserId: string, slug: string): Promise<ArtistProfile> {
  const artist = await getArtistProfileBySlug(slug);
  if (!artist) throw new Error("Artist not found");
  if (artist.ownerUserId !== ownerUserId) throw new Error("Not authorized");
  return artist;
}

export async function createArtistProfileForUser(
  ownerUserId: string,
  formData: FormData,
): Promise<string> {
  const { stageName, bio, homeMarket, genres } = parseArtistProfileFormData(formData);
  if (!stageName) throw new Error("Stage name is required");

  const base = slugifyArtistName(stageName);
  let slug = base;
  const existing = await getArtistProfileBySlug(slug);
  if (existing) slug = `${base}-${Date.now().toString(36).slice(-4)}`;

  await db.insert(artistProfiles).values({
    slug,
    stageName,
    bio,
    homeMarket,
    genres,
    ownerUserId,
  });

  return slug;
}

export async function updateOwnedArtistProfile(
  ownerUserId: string,
  slug: string,
  formData: FormData,
): Promise<string> {
  const profile = await requireOwnedArtist(ownerUserId, slug);
  const { stageName, bio, homeMarket, genres } = parseArtistProfileFormData(formData);
  if (!stageName) throw new Error("Stage name is required");

  await db
    .update(artistProfiles)
    .set({ stageName, bio, homeMarket, genres, updatedAt: new Date() })
    .where(eq(artistProfiles.id, profile.id));

  return profile.slug;
}

export async function deleteOwnedArtistProfile(ownerUserId: string, slug: string): Promise<void> {
  const profile = await requireOwnedArtist(ownerUserId, slug);
  await db.delete(artistProfiles).where(eq(artistProfiles.id, profile.id));
}

export async function addAvailabilityWindowForOwnedArtist(
  ownerUserId: string,
  formData: FormData,
): Promise<string> {
  const slug = (formData.get("slug") as string | null)?.trim() ?? "";
  const startDate = (formData.get("startDate") as string | null)?.trim() ?? "";
  const rawEnd = (formData.get("endDate") as string | null)?.trim() ?? "";
  const endDate = rawEnd || startDate;
  const rawStatus = (formData.get("status") as string | null)?.trim() ?? "";
  const status: "open" | "blocked" = rawStatus === "blocked" ? "blocked" : "open";
  const market = ((formData.get("market") as string | null)?.trim() ?? "") || null;
  const note = ((formData.get("note") as string | null)?.trim() ?? "") || null;

  if (!startDate) throw new Error("Start date is required");
  if (endDate < startDate) throw new Error("End date must be on or after start date");

  const artist = await requireOwnedArtist(ownerUserId, slug);

  await db.insert(availabilityWindows).values({
    artistId: artist.id,
    startDate,
    endDate,
    status,
    market,
    note,
  });

  return slug;
}

export async function deleteAvailabilityWindowForOwnedArtist(
  ownerUserId: string,
  formData: FormData,
): Promise<string> {
  const id = (formData.get("id") as string | null)?.trim() ?? "";
  const slug = (formData.get("slug") as string | null)?.trim() ?? "";
  const artist = await requireOwnedArtist(ownerUserId, slug);

  if (id) {
    await db
      .delete(availabilityWindows)
      .where(and(eq(availabilityWindows.id, id), eq(availabilityWindows.artistId, artist.id)));
  }

  return slug;
}
