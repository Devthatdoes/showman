import { db } from "@/db";
import { artistProfiles, availabilityWindows, type ArtistProfile } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { canManageArtist } from "@/server/identity/authorize";
import { ensurePersonalOrgForUser } from "@/server/identity/mutations";
import { getArtistProfileBySlug } from "./queries";
import { parseArtistProfileFormData, parseArtistProfileTextFields, slugifyArtistName } from "./types";
import { deleteArtistImageUpload, saveArtistImageUpload } from "./uploads";

export async function requireOwnedArtist(ownerUserId: string, slug: string): Promise<ArtistProfile> {
  const artist = await getArtistProfileBySlug(slug);
  if (!artist) throw new Error("Artist not found");
  if (!(await canManageArtist(ownerUserId, artist))) throw new Error("Not authorized");
  return artist;
}

export async function createArtistProfileForUser(
  ownerUserId: string,
  formData: FormData,
): Promise<string> {
  const parsed = parseArtistProfileTextFields(formData);
  if (!parsed.stageName) throw new Error("Stage name is required");
  if (!parsed.primaryGenre) throw new Error("Broad genre is required");

  const imageUrl = await saveArtistImageUpload(formData, { required: true });
  const { stageName, bio, primaryGenre, homeMarket, genres } = parseArtistProfileFormData(
    formData,
    imageUrl,
  );

  const base = slugifyArtistName(stageName);
  let slug = base;
  const existing = await getArtistProfileBySlug(slug);
  if (existing) slug = `${base}-${Date.now().toString(36).slice(-4)}`;
  const org = await ensurePersonalOrgForUser(ownerUserId, stageName);

  try {
    await db.insert(artistProfiles).values({
      slug,
      stageName,
      bio,
      imageUrl,
      primaryGenre,
      homeMarket,
      genres,
      orgId: org.id,
      ownerUserId,
    });
  } catch (error) {
    await deleteArtistImageUpload(imageUrl);
    throw error;
  }

  return slug;
}

export async function updateOwnedArtistProfile(
  ownerUserId: string,
  slug: string,
  formData: FormData,
): Promise<string> {
  const profile = await requireOwnedArtist(ownerUserId, slug);
  const parsed = parseArtistProfileTextFields(formData);
  if (!parsed.stageName) throw new Error("Stage name is required");
  if (!parsed.primaryGenre) throw new Error("Broad genre is required");

  const uploadedImageUrl = await saveArtistImageUpload(formData, { required: false });
  const imageUrl = uploadedImageUrl ?? profile.imageUrl;
  const { stageName, bio, primaryGenre, homeMarket, genres } = parseArtistProfileFormData(
    formData,
    imageUrl,
  );
  if (!imageUrl) throw new Error("Artist image is required");

  try {
    await db
      .update(artistProfiles)
      .set({ stageName, bio, imageUrl, primaryGenre, homeMarket, genres, updatedAt: new Date() })
      .where(eq(artistProfiles.id, profile.id));
  } catch (error) {
    await deleteArtistImageUpload(uploadedImageUrl);
    throw error;
  }

  if (uploadedImageUrl && profile.imageUrl && uploadedImageUrl !== profile.imageUrl) {
    await deleteArtistImageUpload(profile.imageUrl);
  }

  return profile.slug;
}

export async function deleteOwnedArtistProfile(ownerUserId: string, slug: string): Promise<void> {
  const profile = await requireOwnedArtist(ownerUserId, slug);
  await db.delete(artistProfiles).where(eq(artistProfiles.id, profile.id));
  await deleteArtistImageUpload(profile.imageUrl);
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
