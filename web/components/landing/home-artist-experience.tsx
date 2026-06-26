"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type HomeArtist = {
  slug: string;
  stageName: string;
  bio: string | null;
  imageUrl: string | null;
  primaryGenre: string | null;
  genres: string[];
  homeMarket: string | null;
};

function getSpecificGenres(artist: HomeArtist): string[] {
  return artist.genres.filter((genre) => genre !== artist.primaryGenre);
}

export default function HomeArtistExperience({ artists }: { artists: HomeArtist[] }) {
  const [activeGenre, setActiveGenre] = useState("All");
  const [selectedArtist, setSelectedArtist] = useState<HomeArtist | null>(null);

  const visualArtists = useMemo(
    () => artists.filter((artist) => Boolean(artist.imageUrl)),
    [artists],
  );

  const filterGenres = useMemo(() => {
    const genres = visualArtists
      .map((artist) => artist.primaryGenre)
      .filter((genre): genre is string => Boolean(genre));
    return ["All", ...Array.from(new Set(genres))];
  }, [visualArtists]);

  const filteredArtists = useMemo(() => {
    if (activeGenre === "All") return visualArtists;
    return visualArtists.filter(
      (artist) => artist.primaryGenre === activeGenre || artist.genres.includes(activeGenre),
    );
  }, [activeGenre, visualArtists]);

  return (
    <>
      <div className="raw-section__head raw-reveal">
        <h2>Artists</h2>
        <div aria-label="Filter artists by broad genre">
          {filterGenres.map((genre) => (
            <button
              key={genre}
              type="button"
              onClick={() => setActiveGenre(genre)}
              className="raw-filter-button"
              aria-pressed={activeGenre === genre}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {filteredArtists.length > 0 ? (
        <div className="raw-artist-grid">
          {filteredArtists.map((artist) => {
            const specificGenres = getSpecificGenres(artist);
            return (
              <button
                className="raw-artist-card raw-reveal"
                type="button"
                onClick={() => setSelectedArtist(artist)}
                key={artist.slug}
              >
                <span className="raw-artist-card__image">
                  <img src={artist.imageUrl ?? ""} alt="" />
                </span>
                <span>
                  <strong>{artist.stageName}</strong>
                  <small>{specificGenres[0] ?? artist.primaryGenre ?? "Artist"}</small>
                </span>
                <em>Preview -&gt;</em>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="raw-empty raw-reveal">
          <h3>No live artist profiles yet.</h3>
          <p>
            Create the first profile with an artist image, broad genre, specific sounds, market,
            and public bio. Once it exists, it feeds this page directly.
          </p>
          <Link href="/artists/new">Create artist profile</Link>
        </div>
      )}

      {selectedArtist && (
        <div className="raw-modal" role="dialog" aria-modal="true" aria-label={selectedArtist.stageName}>
          <button
            type="button"
            className="raw-modal__scrim"
            aria-label="Close artist preview"
            onClick={() => setSelectedArtist(null)}
          />
          <article className="raw-artist-preview">
            <button
              type="button"
              className="raw-artist-preview__close"
              onClick={() => setSelectedArtist(null)}
            >
              Close
            </button>
            <div className="raw-artist-preview__media">
              <img src={selectedArtist.imageUrl ?? ""} alt="" />
            </div>
            <div className="raw-artist-preview__content">
              <p>{selectedArtist.primaryGenre ?? "Artist"}</p>
              <h3>{selectedArtist.stageName}</h3>
              {selectedArtist.homeMarket && <span>{selectedArtist.homeMarket}</span>}
              {selectedArtist.genres.length > 0 && (
                <div>
                  {selectedArtist.genres.map((genre) => (
                    <em key={genre}>{genre}</em>
                  ))}
                </div>
              )}
              <p>
                {selectedArtist.bio ??
                  "Public profile preview. Booking details stay private until access is verified."}
              </p>
              <div className="raw-artist-preview__actions">
                <Link href={`/sign-up?role=booker&artist=${selectedArtist.slug}`}>Request access</Link>
                <Link href={`/artists/${selectedArtist.slug}`}>View public profile</Link>
              </div>
            </div>
          </article>
        </div>
      )}
    </>
  );
}
