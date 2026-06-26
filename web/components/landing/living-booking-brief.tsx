"use client";

import { type CSSProperties, useMemo, useState } from "react";
import { landingBrief } from "@/lib/landing-content";

const parsedTerms = [
  { pattern: /berlin/i, label: "Berlin", tone: "signal" },
  { pattern: /mid-?oct/i, label: "mid-Oct", tone: "plain" },
  { pattern: /90/i, label: "90 min", tone: "plain" },
  { pattern: /(eur|€)\s?8k|8k/i, label: "EUR8k", tone: "signal" },
  { pattern: /travel/i, label: "travel covered", tone: "plain" },
  { pattern: /dj|artist|act/i, label: "verified artist teams", tone: "signal" },
] as const;

export default function LivingBookingBrief() {
  const [brief, setBrief] = useState(landingBrief.prompt);
  const [pointer, setPointer] = useState({ x: 64, y: 42 });

  const chips = useMemo(() => {
    const matches = parsedTerms
      .filter((term) => term.pattern.test(brief))
      .map((term) => ({ label: term.label, tone: term.tone }));

    return matches.length > 0 ? matches : landingBrief.chips;
  }, [brief]);

  return (
    <section
      className="landing-brief"
      style={
        {
          "--brief-x": `${pointer.x}%`,
          "--brief-y": `${pointer.y}%`,
        } as CSSProperties
      }
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        setPointer({
          x: ((event.clientX - bounds.left) / bounds.width) * 100,
          y: ((event.clientY - bounds.top) / bounds.height) * 100,
        });
      }}
      aria-label="Living booking brief"
    >
      <div className="landing-brief__bar">
        <span>live brief</span>
        <span>private details gated</span>
      </div>

      <label className="sr-only" htmlFor="landing-brief-input">
        Describe a booking request
      </label>
      <textarea
        id="landing-brief-input"
        value={brief}
        onChange={(event) => setBrief(event.target.value)}
        className="landing-brief__input"
        rows={3}
        spellCheck={false}
      />

      <div className="landing-brief__chips" aria-label="Parsed booking terms">
        {chips.map((chip, index) => (
          <span
            key={`${chip.label}-${index}`}
            className={`landing-brief__chip landing-brief__chip--${chip.tone}`}
            style={{ "--chip-index": index } as CSSProperties}
          >
            {chip.label}
          </span>
        ))}
      </div>

      <div className="landing-brief__fragments" aria-label="Request state">
        {landingBrief.fragments.map((fragment) => (
          <span key={fragment}>{fragment}</span>
        ))}
      </div>
    </section>
  );
}
