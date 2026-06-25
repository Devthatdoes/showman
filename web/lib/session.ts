import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/** The currently signed-in user, or null. Safe to call from server components and server actions. */
export async function getCurrentUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}
