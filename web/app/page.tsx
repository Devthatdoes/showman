import FluidBackground from "@/components/landing/fluid-background";
import RevealOnScroll from "@/components/landing/reveal-on-scroll";
import HomeArtistExperience from "@/components/landing/home-artist-experience";
import MagneticButton from "@/components/ui/magnetic-button";
import { listPublicArtistProfiles } from "@/server/catalog/queries";
import Link from "next/link";

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
    <main className="raw-home min-h-screen relative overflow-hidden">
      <FluidBackground />
      
      <section className="relative z-10 min-h-screen flex flex-col justify-center items-center text-center px-6 pt-20">
        <RevealOnScroll>
          <div className="space-y-8">
            <h1 className="text-7xl md:text-9xl font-bold tracking-tighter mb-6 leading-none uppercase">
              Book the <span className="font-curated italic font-normal text-red-600 lowercase">rawest</span> artists.
            </h1>
            <p className="text-xl md:text-2xl opacity-60 max-w-2xl mx-auto mb-12 font-curated italic">
              Direct access. The alternative for those who actually make the music.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <MagneticButton className="btn-raw px-12 py-5 text-lg uppercase tracking-widest font-bold">
                <Link href="#artists">Explore Gallery</Link>
              </MagneticButton>
              <Link
                href="/sign-up"
                className="text-sm uppercase tracking-widest font-bold opacity-50 hover:opacity-100 transition-all underline underline-offset-8"
              >
                Create a Profile
              </Link>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      <section className="relative z-10 py-32 px-6 max-w-7xl mx-auto" id="artists">
        <RevealOnScroll className="flex justify-between items-end mb-20">
          <h2 className="text-6xl font-bold tracking-tighter uppercase">Artists</h2>
          <div className="flex gap-6 text-xs uppercase font-bold opacity-50">
            <span className="text-red-600 cursor-pointer">All</span>
            <span className="hover:text-white cursor-pointer transition">Industrial</span>
            <span className="hover:text-white cursor-pointer transition">Atmospheric</span>
            <span className="hover:text-white cursor-pointer transition">Avant-Pop</span>
          </div>
        </RevealOnScroll>
        
        <HomeArtistExperience artists={artists} />
      </section>

      <section className="relative z-10 py-32 px-6 max-w-7xl mx-auto border-t border-white/5" id="booking">
        <RevealOnScroll className="flex flex-col items-center text-center space-y-12">
          <h2 className="text-6xl font-bold tracking-tighter uppercase">Booking</h2>
          <p className="text-lg opacity-60 max-w-xl mx-auto font-curated italic">
            Event briefs, real artist teams, and request coordination built for the people
            pushing live culture forward.
          </p>
          <div className="flex gap-4">
             <MagneticButton className="btn-raw px-8 py-4 text-sm uppercase tracking-widest font-bold">
                <Link href="/booking">Start booking</Link>
             </MagneticButton>
          </div>
        </RevealOnScroll>
      </section>
    </main>
  );
}
