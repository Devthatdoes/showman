import { cache } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Deduped per request: the site header (layout) and most pages both need the
// session, and without cache() each render pays for its own Better Auth lookup.
const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** The currently signed-in user, or null. Safe to call from server components and server actions. */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}
