import type { BookerProfile, Membership, Org } from "@/db/schema";
import { slugify } from "@/lib/slugify";

export type OnboardingIntent = "artist" | "booker";

export type ActorWorkspace = {
  orgs: Array<Org & { membership: Membership }>;
  bookerProfile: BookerProfile | null;
};

export function slugifyIdentity(input: string, fallback = "workspace"): string {
  return slugify(input, { maxLength: 80, fallback });
}
