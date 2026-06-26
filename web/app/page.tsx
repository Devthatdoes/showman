import FluidBackground from "@/components/landing/fluid-background";
import RevealOnScroll from "@/components/landing/reveal-on-scroll";
import HomeArtistExperience from "@/components/landing/home-artist-experience";
import { listPublicArtistProfiles } from "@/server/catalog/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const artistProfiles = await listPublicArtistProfiles({ limit: 6 });
  const artists = artistProfiles.map((artist) => ({
    slug: artist.slug,
    stageName: artist.stageName,
    bio: artist.bio,
    imageUrl: artist.imageUrl,
    primaryGenre: artist.primaryGenre,
    genres: artist.genres,
    homeMarket: artist.homeMarket,
  }));

  return (
    <main className="raw-home">
      <FluidBackground />
      <RevealOnScroll />
      <div className="raw-grain" aria-hidden="true" />

      <section className="raw-hero">
        <div className="raw-hero__inner raw-reveal">
          <h1>
            Book the <span>rawest</span> artists.
          </h1>
          <p className="raw-hero__copy">
            For the real artists and teams, Live & Direct access,
            Booking made for doers.
          </p>

          <form className="raw-search" action="/artists">
            <label className="sr-only" htmlFor="raw-search-input">
              Search artists
            </label>
            <input
              id="raw-search-input"
              name="q"
              placeholder="Find an artist by name, genre, or city"
              type="search"
            />
            <button type="submit">Search</button>
          </form>
        </div>
      </section>

      <section className="raw-section" id="artists">
        <HomeArtistExperience artists={artists} />
      </section>

      <section className="raw-section raw-bookers raw-booking-lane" id="bookers">
        <div className="raw-section__head raw-reveal">
          <h2>Bookers</h2>
          <p>Request access to real artist teams without exposing private booking details publicly.</p>
        </div>
        <div className="raw-booking-lane__body raw-reveal">
          <div>
            <h3>Booker onboarding belongs in the product flow.</h3>
            <p>
              The next foundation step is a real booker-side onboarding lane:
              venue, promoter, agency, label, budget posture, markets, and verification.
            </p>
          </div>
          <a href="/sign-up?role=booker">Join as booker</a>
        </div>
      </section>
    </main>
  );
}
