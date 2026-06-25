"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { availabilityWindows } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function addAvailabilityWindow(formData: FormData): Promise<void> {
  const slug = (formData.get("slug") as string | null)?.trim() ?? "";
  const startDate = (formData.get("startDate") as string | null)?.trim() ?? "";
  const rawEnd = (formData.get("endDate") as string | null)?.trim() ?? "";
  const endDate = rawEnd || startDate;
  const rawStatus = (formData.get("status") as string | null)?.trim() ?? "";
  const status: "open" | "blocked" =
    rawStatus === "blocked" ? "blocked" : "open";
  const rawMarket = (formData.get("market") as string | null)?.trim() ?? "";
  const market = rawMarket || null;
  const rawNote = (formData.get("note") as string | null)?.trim() ?? "";
  const note = rawNote || null;

  if (!startDate) {
    throw new Error("Start date is required");
  }
  if (endDate < startDate) {
    throw new Error("End date must be on or after start date");
  }

  const artist = await db.query.artistProfiles.findFirst({
    where: (a, { eq }) => eq(a.slug, slug),
  });
  if (!artist) {
    throw new Error("Artist not found");
  }

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

export async function deleteAvailabilityWindow(
  formData: FormData
): Promise<void> {
  const id = (formData.get("id") as string | null)?.trim() ?? "";
  const slug = (formData.get("slug") as string | null)?.trim() ?? "";

  if (id) {
    await db.delete(availabilityWindows).where(eq(availabilityWindows.id, id));
  }

  revalidatePath(`/artists/${slug}/availability`);
  revalidatePath(`/artists/${slug}`);
}
