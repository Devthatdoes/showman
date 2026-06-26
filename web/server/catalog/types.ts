import type { ArtistProfile, AvailabilityWindow } from "@/db/schema";

export type ArtistProfileFields = {
  stageName: string;
  bio: string | null;
  homeMarket: string | null;
  genres: string[];
};

export type ArtistProfileSummary = Pick<
  ArtistProfile,
  | "id"
  | "slug"
  | "stageName"
  | "bio"
  | "genres"
  | "homeMarket"
  | "ownerUserId"
  | "createdAt"
  | "updatedAt"
>;

export type ArtistAvailabilityWindow = AvailabilityWindow;

export function slugifyArtistName(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 72) || "artist"
  );
}

export function parseArtistProfileFormData(formData: FormData): ArtistProfileFields {
  const stageName = ((formData.get("stageName") as string | null) ?? "").trim();
  const bio = ((formData.get("bio") as string | null) ?? "").trim() || null;
  const homeMarket = ((formData.get("homeMarket") as string | null) ?? "").trim() || null;
  const genres = ((formData.get("genres") as string | null) ?? "")
    .split(",")
    .map((genre) => genre.trim())
    .filter((genre) => genre.length > 0);

  return { stageName, bio, homeMarket, genres };
}
