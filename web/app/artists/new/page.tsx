import Link from "next/link";
import { redirect } from "next/navigation";
import { createArtistProfile } from "@/app/artists/actions";
import { getCurrentUser } from "@/lib/session";
import ArtistImageInput from "@/components/artist-image-input";
import { buttonStyles } from "@/components/ui/button";
import { PRIMARY_GENRE_OPTIONS } from "@/lib/artist-genres";
import {
  fieldClassName,
  helpTextClassName,
  labelClassName,
} from "@/components/ui/form";
import { panelStyles } from "@/components/ui/panel";

export const dynamic = "force-dynamic";

export default async function NewArtistPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ffb06a]">
          Artist profile
        </p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em] text-[var(--showman-bone)] sm:text-4xl">
          New profile
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--showman-muted)]">
          Create the profile that helps real bookers understand your sound, market, and next open dates.
        </p>

        <div className={`${panelStyles("elevated")} mt-8 p-6 sm:p-8`}>
          <form action={createArtistProfile} className="flex flex-col gap-6">
            <ArtistImageInput required />

            <div className="flex flex-col gap-2">
              <label htmlFor="stageName" className={labelClassName}>
                Stage name <span className="text-[var(--showman-danger)]">*</span>
              </label>
              <input
                id="stageName"
                name="stageName"
                type="text"
                required
                className={fieldClassName}
                placeholder="Your artist name"
              />
              <p className={helpTextClassName}>Use the name people already book and search for.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="homeMarket" className={labelClassName}>
                Home market
              </label>
              <input
                id="homeMarket"
                name="homeMarket"
                type="text"
                className={fieldClassName}
                placeholder="e.g. Berlin, London, New York"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="primaryGenre" className={labelClassName}>
                Broad genre <span className="text-[var(--showman-danger)]">*</span>
              </label>
              <select id="primaryGenre" name="primaryGenre" required className={fieldClassName}>
                <option value="">Choose the booking category</option>
                {PRIMARY_GENRE_OPTIONS.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
              <p className={helpTextClassName}>
                This powers broad search and dropdowns, while specific sounds can stay more precise.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="genres" className={labelClassName}>
                Specific sounds
              </label>
              <input
                id="genres"
                name="genres"
                type="text"
                className={fieldClassName}
                placeholder="Rage-Rap, Rage, Underground Rap"
              />
              <p className={helpTextClassName}>
                Add comma-separated scene tags, subgenres, and sounds that describe the artist.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="bio" className={labelClassName}>
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={5}
                className={fieldClassName}
                placeholder="Tell us about your sound, your influences, your journey."
              />
              <p className={helpTextClassName}>Keep it practical. Bookers want context they can trust.</p>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button type="submit" className={buttonStyles("primary")}>
                Create profile
              </button>
              <Link href="/artists" className={buttonStyles("secondary")}>
                Back to artists
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
