type SlugifyOptions = {
  // Callers pin their own maxLength: existing rows were generated with these
  // limits, so changing one would silently produce different slugs for the
  // same input and break slug-based lookups.
  maxLength: number;
  fallback: string;
};

export function slugify(input: string, { maxLength, fallback }: SlugifyOptions): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, maxLength) || fallback
  );
}
