"use server";

import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createArtistProfileForUser,
  deleteOwnedArtistProfile,
  updateOwnedArtistProfile,
} from "@/server/catalog/mutations";

export async function createArtistProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const slug = await createArtistProfileForUser(user.id, formData);
  revalidatePath("/artists");
  redirect(`/artists/${slug}`);
}

export async function updateArtistProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const slug = ((formData.get("slug") as string | null) ?? "").trim();
  const updatedSlug = await updateOwnedArtistProfile(user.id, slug, formData);
  revalidatePath("/artists");
  revalidatePath(`/artists/${updatedSlug}`);
  redirect(`/artists/${updatedSlug}`);
}

export async function deleteArtistProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const slug = ((formData.get("slug") as string | null) ?? "").trim();
  await deleteOwnedArtistProfile(user.id, slug);
  revalidatePath("/artists");
  redirect("/artists");
}
