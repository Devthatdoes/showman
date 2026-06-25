"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { availabilityWindows } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { and, eq } from "drizzle-orm";

/** Resolve the artist by slug and assert the current user owns it. Throws otherwise. */
async function requireOwnedArtist(slug: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("You must be signed in");
  const artist = await db.query.artistProfiles.findFirst({
    where: (a, { eq }) => eq(a.slug, slug),
  });
  if (!artist) throw new Error("Artist not found");
  if (artist.ownerUserId !== user.id) throw new Error("Not authorized");
  return artist;
}

export async function addAvailabilityWindow(formData: FormData): Promise<void> {
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

  const artist = await requireOwnedArtist(slug);

  await db.insert(availabilityWindows).values({
    artistId: artist.id,
    startDate,
    endDate,
    status,
    market,
    note,
  });

  revalidatePath(`/artists/${slug}/availability`);
  revalidatePath(`/artists/${slug}`);
}

export async function deleteAvailabilityWindow(formData: FormData): Promise<void> {
  const id = (formData.get("id") as string | null)?.trim() ?? "";
  const slug = (formData.get("slug") as string | null)?.trim() ?? "";

  const artist = await requireOwnedArtist(slug);

  if (id) {
    await db
      .delete(availabilityWindows)
      .where(and(eq(availabilityWindows.id, id), eq(availabilityWindows.artistId, artist.id)));
  }

  revalidatePath(`/artists/${slug}/availability`);
  revalidatePath(`/artists/${slug}`);
}
