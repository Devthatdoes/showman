"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { createBookingRequestForUser } from "@/server/booking/mutations";

export async function createBookingRequest(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  await createBookingRequestForUser(user.id, formData);
  revalidatePath("/booker");
  revalidatePath("/team");
  redirect("/booker");
}
