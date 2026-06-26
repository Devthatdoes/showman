"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import {
  addAvailabilityWindowForOwnedArtist,
  deleteAvailabilityWindowForOwnedArtist,
} from "@/server/catalog/mutations";

export async function addAvailabilityWindow(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("You must be signed in");

  const slug = await addAvailabilityWindowForOwnedArtist(user.id, formData);

  revalidatePath(`/artists/${slug}/availability`);
  revalidatePath(`/artists/${slug}`);
}

export async function deleteAvailabilityWindow(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error("You must be signed in");

  const slug = await deleteAvailabilityWindowForOwnedArtist(user.id, formData);

  revalidatePath(`/artists/${slug}/availability`);
  revalidatePath(`/artists/${slug}`);
}
