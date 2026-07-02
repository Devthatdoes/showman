"use server";

import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { respondToBookingRequest } from "@/server/booking/mutations";

async function respond(formData: FormData, decision: "accepted" | "declined") {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  const requestId = ((formData.get("requestId") as string | null) ?? "").trim();
  if (!requestId) throw new Error("Missing request id");

  await respondToBookingRequest(user.id, requestId, decision);
  revalidatePath("/team");
  revalidatePath("/booker");
}

export async function acceptBookingRequest(formData: FormData) {
  await respond(formData, "accepted");
}

export async function declineBookingRequest(formData: FormData) {
  await respond(formData, "declined");
}
