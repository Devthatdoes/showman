import type { BookerProfile, Membership, Org } from "@/db/schema";

export type OnboardingIntent = "artist" | "booker";

export type ActorWorkspace = {
  orgs: Array<Org & { membership: Membership }>;
  bookerProfile: BookerProfile | null;
};

export function slugifyIdentity(input: string, fallback = "workspace"): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || fallback
  );
}
