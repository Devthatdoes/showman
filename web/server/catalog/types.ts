import type { ArtistProfile, AvailabilityWindow } from "@/db/schema";
import { slugify } from "@/lib/slugify";

export type ArtistProfileFields = {
  stageName: string;
  bio: string | null;
  imageUrl: string | null;
  primaryGenre: string | null;
  homeMarket: string | null;
  genres: string[];
};

export type PublicArtistProfile = {
  id: string;
  slug: string;
  stageName: string;
  bio: string | null;
  imageUrl: string;
  primaryGenre: string | null;
  genres: string[];
  homeMarket: string | null;
  createdAt: Date;
};

export type ArtistProfileSummary = Pick<
  ArtistProfile,
  | "id"
  | "slug"
  | "stageName"
  | "bio"
  | "imageUrl"
  | "primaryGenre"
  | "genres"
  | "homeMarket"
  | "ownerUserId"
  | "createdAt"
  | "updatedAt"
>;

export type ArtistAvailabilityWindow = AvailabilityWindow;

export function slugifyArtistName(input: string): string {
  return slugify(input, { maxLength: 72, fallback: "artist" });
}

export function parseArtistProfileTextFields(formData: FormData): Omit<ArtistProfileFields, "imageUrl"> {
  const stageName = ((formData.get("stageName") as string | null) ?? "").trim();
  const bio = ((formData.get("bio") as string | null) ?? "").trim() || null;
  const primaryGenre = ((formData.get("primaryGenre") as string | null) ?? "").trim() || null;
  const homeMarket = ((formData.get("homeMarket") as string | null) ?? "").trim() || null;
  const specificGenres = ((formData.get("genres") as string | null) ?? "")
    .split(",")
    .map((genre) => genre.trim())
    .filter((genre) => genre.length > 0);
  const genres = Array.from(new Set([primaryGenre, ...specificGenres].filter(Boolean) as string[]));

  return { stageName, bio, primaryGenre, homeMarket, genres };
}
