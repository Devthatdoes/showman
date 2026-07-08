import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { canManageArtist } from "@/server/identity/authorize";
import { updateArtistProfile, deleteArtistProfile } from "@/app/artists/actions";
import { getArtistProfileBySlug } from "@/server/catalog/queries";
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

export default async function EditArtistPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error } = await searchParams;
  const deleteRefused = error === "has-bookings";

  const profile = await getArtistProfileBySlug(slug);

  if (!profile) notFound();

  const user = await getCurrentUser();
  // Mirror the mutation layer's authorization (requireOwnedArtist), not raw
  // ownership: org agents are allowed to submit these forms, so they must be
  // able to load them.
  if (!user || !(await canManageArtist(user.id, profile))) redirect(`/artists/${slug}`);
  const specificGenres = profile.genres.filter((genre) => genre !== profile.primaryGenre);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#ffb06a]">
          Artist profile
        </p>
        <h1 className="mt-2 text-3xl font-black uppercase tracking-[-0.05em] text-[var(--showman-bone)] sm:text-4xl">
          Edit profile
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--showman-muted)]">
          Update the details bookers see before they ask for dates.
        </p>

        <div className={`${panelStyles("elevated")} mt-8 p-6 sm:p-8`}>
          <form action={updateArtistProfile} className="flex flex-col gap-6">
            <input type="hidden" name="slug" value={profile.slug} />

            <ArtistImageInput existingImageUrl={profile.imageUrl} />

            <div className="flex flex-col gap-2">
              <label htmlFor="stageName" className={labelClassName}>
                Stage name <span className="text-[var(--showman-danger)]">*</span>
              </label>
              <input
                id="stageName"
                name="stageName"
                type="text"
                required
                defaultValue={profile.stageName}
                className={fieldClassName}
                placeholder="Your artist name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="homeMarket" className={labelClassName}>
                Home market
              </label>
              <input
                id="homeMarket"
                name="homeMarket"
                type="text"
                defaultValue={profile.homeMarket ?? ""}
                className={fieldClassName}
                placeholder="e.g. Berlin, London, New York"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="primaryGenre" className={labelClassName}>
                Broad genre <span className="text-[var(--showman-danger)]">*</span>
              </label>
              <select
                id="primaryGenre"
                name="primaryGenre"
                required
                defaultValue={profile.primaryGenre ?? ""}
                className={fieldClassName}
              >
                <option value="">Choose the booking category</option>
                {PRIMARY_GENRE_OPTIONS.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="genres" className={labelClassName}>
                Specific sounds
              </label>
              <input
                id="genres"
                name="genres"
                type="text"
                defaultValue={specificGenres.join(", ")}
                className={fieldClassName}
                placeholder="Rage-Rap, Rage, Underground Rap"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="bio" className={labelClassName}>
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={5}
                defaultValue={profile.bio ?? ""}
                className={fieldClassName}
                placeholder="Tell us about your sound, your influences, your journey."
              />
              <p className={helpTextClassName}>Shorter is usually sharper. Keep the useful details first.</p>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button type="submit" className={buttonStyles("primary")}>
                Save changes
              </button>
              <Link href={`/artists/${profile.slug}`} className={buttonStyles("secondary")}>
                Cancel
              </Link>
            </div>
          </form>
        </div>

        <div className={`${panelStyles("subtle")} mt-8 p-6`}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--showman-muted)]">
            Danger zone
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--showman-muted)]">
            Permanently delete this artist profile. This action cannot be undone.
          </p>
          {deleteRefused && (
            <p className="mt-3 text-sm leading-6 text-[var(--showman-danger)]">
              This profile can&apos;t be deleted because it has booking requests. Booking
              records are kept as business records, so a profile with any booking history
              stays on the platform.
            </p>
          )}
          <form action={deleteArtistProfile} className="mt-4">
            <input type="hidden" name="slug" value={profile.slug} />
            <button type="submit" className={buttonStyles("danger")}>
              Delete profile
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
