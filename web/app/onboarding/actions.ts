"use server";

import { db } from "@/db";
import { user as authUser } from "@/db/auth-schema";
import { getCurrentUser } from "@/lib/session";
import { getPublicArtistProfileBySlug } from "@/server/catalog/queries";
import { ensureBookerProfileForUser, ensurePersonalOrgForUser } from "@/server/identity/mutations";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

function readString(formData: FormData, key: string) {
  return ((formData.get(key) as string | null) ?? "").trim();
}

export async function completeArtistOnboarding(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const workspaceName = readString(formData, "workspaceName") || user.name || "Showman";
  await ensurePersonalOrgForUser(user.id, workspaceName);
  await db.update(authUser).set({ onboardingIntent: "artist" }).where(eq(authUser.id, user.id));
  redirect("/team");
}

export async function completeBookerOnboarding(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  await ensureBookerProfileForUser(user.id, {
    displayName: readString(formData, "displayName") || user.name || "Booker",
    roleTitle: readString(formData, "roleTitle"),
    homeMarket: readString(formData, "homeMarket"),
    shortDescriptor: readString(formData, "shortDescriptor"),
    credibilitySummary: readString(formData, "credibilitySummary"),
  });
  await db.update(authUser).set({ onboardingIntent: "booker" }).where(eq(authUser.id, user.id));

  const artist = readString(formData, "requestedArtist");
  if (artist && (await getPublicArtistProfileBySlug(artist))) {
    redirect(`/booker/requests/new?artist=${encodeURIComponent(artist)}`);
  }

  redirect("/booker");
}
