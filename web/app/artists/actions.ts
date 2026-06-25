"use server";

import { db } from "@/db";
import { artistProfiles } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createArtistProfile(formData: FormData) {
  const rawStageName = (formData.get("stageName") as string | null) ?? "";
  const stageName = rawStageName.trim();
  if (!stageName) {
    throw new Error("Stage name is required");
  }

  const bio = ((formData.get("bio") as string | null) ?? "").trim() || null;
  const homeMarket =
    ((formData.get("homeMarket") as string | null) ?? "").trim() || null;
  const genresRaw = (formData.get("genres") as string | null) ?? "";
  const genres = genresRaw
    .split(",")
    .map((g) => g.trim())
    .filter((g) => g.length > 0);

  const base = stageName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72) || "artist";

  let slug = base;
  const existing = await db.query.artistProfiles.findFirst({
    where: (a, { eq }) => eq(a.slug, slug),
  });
  if (existing) {
    slug = `${base}-${Date.now().toString(36).slice(-4)}`;
  }

  await db.insert(artistProfiles).values({ slug, stageName, bio, homeMarket, genres });

  revalidatePath("/artists");
  redirect(`/artists/${slug}`);
}
