"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { createBookerEventForUser } from "@/server/booking/mutations";

export async function createBookerEvent(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  await createBookerEventForUser(user.id, formData);
  revalidatePath("/booker");
  redirect("/booker");
}
