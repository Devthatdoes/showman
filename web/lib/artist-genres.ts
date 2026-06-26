export const PRIMARY_GENRE_OPTIONS = [
  "Hip-Hop/Rap",
  "Electronic",
  "Pop",
  "R&B",
  "Rock",
  "Jazz",
  "Latin",
  "Experimental",
  "Other",
] as const;

export type PrimaryGenre = (typeof PRIMARY_GENRE_OPTIONS)[number];
