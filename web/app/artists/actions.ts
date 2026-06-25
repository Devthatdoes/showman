"use server";

import { db } from "@/db";
import { artistProfiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/session";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "artist"
  );
}

function parseProfileFields(formData: FormData) {
  const stageName = ((formData.get("stageName") as string | null) ?? "").trim();
  const bio = ((formData.get("bio") as string | null) ?? "").trim() || null;
  const homeMarket = ((formData.get("homeMarket") as string | null) ?? "").trim() || null;
  const genres = ((formData.get("genres") as string | null) ?? "")
    .split(",")
    .map((g) => g.trim())
    .filter((g) => g.length > 0);
  return { stageName, bio, homeMarket, genres };
}

export async function createArtistProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const { stageName, bio, homeMarket, genres } = parseProfileFields(formData);
  if (!stageName) throw new Error("Stage name is required");

  const base = slugify(stageName);
  let slug = base;
  const existing = await db.query.artistProfiles.findFirst({
    where: (a, { eq }) => eq(a.slug, slug),
  });
  if (existing) slug = `${base}-${Date.now().toString(36).slice(-4)}`;

  await db
    .insert(artistProfiles)
    .values({ slug, stageName, bio, homeMarket, genres, ownerUserId: user.id });

  revalidatePath("/artists");
  redirect(`/artists/${slug}`);
}

export async function updateArtistProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const slug = ((formData.get("slug") as string | null) ?? "").trim();
  const profile = await db.query.artistProfiles.findFirst({
    where: (a, { eq }) => eq(a.slug, slug),
  });
  if (!profile) throw new Error("Artist not found");
  if (profile.ownerUserId !== user.id) throw new Error("Not authorized");

  const { stageName, bio, homeMarket, genres } = parseProfileFields(formData);
  if (!stageName) throw new Error("Stage name is required");

  await db
    .update(artistProfiles)
    .set({ stageName, bio, homeMarket, genres, updatedAt: new Date() })
    .where(eq(artistProfiles.id, profile.id));

  revalidatePath("/artists");
  revalidatePath(`/artists/${slug}`);
  redirect(`/artists/${slug}`);
}

export async function deleteArtistProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const slug = ((formData.get("slug") as string | null) ?? "").trim();
  const profile = await db.query.artistProfiles.findFirst({
    where: (a, { eq }) => eq(a.slug, slug),
  });
  if (!profile) throw new Error("Artist not found");
  if (profile.ownerUserId !== user.id) throw new Error("Not authorized");

  await db.delete(artistProfiles).where(eq(artistProfiles.id, profile.id));

  revalidatePath("/artists");
  redirect("/artists");
}
