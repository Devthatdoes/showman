import Link from "next/link";
import LivingBookingBrief from "@/components/landing/living-booking-brief";
import { buttonStyles } from "@/components/ui/button";
import {
  audienceDoors,
  sceneCards,
  trustPromises,
  workflowSteps,
} from "@/lib/landing-content";

export default function Home() {
  return (
    <main className="overflow-hidden">
      <section className="relative min-h-[calc(100vh-65px)] px-4 py-10 sm:px-6 lg:py-14">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-end">
          <div className="max-w-xl pb-2 lg:pb-10">
            <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.24em] text-[#ffb06a]">
              Booking infrastructure for live culture
            </p>
            <h1 className="text-5xl font-black uppercase leading-[0.88] tracking-normal text-[var(--showman-bone)] sm:text-7xl lg:text-8xl">
              Bring the brief. Reach the real team.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[var(--showman-muted)] sm:text-lg">
              Showman turns rough booking intent into clear terms, controlled artist access, and request flow for the people putting new scenes on.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/sign-up" className={buttonStyles("primary")}>
                Start a request
              </Link>
              <Link href="/artists/new" className={buttonStyles("secondary")}>
                Set up artist workspace
              </Link>
            </div>
            <p className="mt-5 max-w-md text-sm leading-6 text-[var(--showman-muted)]">
              Public pages create context. Availability, travel terms, fees, and team details stay behind verified access.
            </p>
          </div>
          <LivingBookingBrief />
        </div>
      </section>

      <section className="landing-section landing-section--scene">
        <div className="landing-section__inner">
          <div className="landing-section__head">
            <p>Scene strip</p>
            <h2>Public energy, private booking data.</h2>
          </div>
          <div className="landing-scene-grid">
            {sceneCards.map((card, index) => (
              <article className="landing-scene-card" key={card.name}>
                <div className={`landing-scene-card__media bg-gradient-to-br ${card.palette}`}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div>
                  <p>{card.role}</p>
                  <h3>{card.name}</h3>
                  <span>{card.caption}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__inner landing-workflow">
          <div className="landing-section__head">
            <p>How it moves</p>
            <h2>From a rough ask to a request a real team can answer.</h2>
          </div>
          <div className="landing-workflow__steps">
            {workflowSteps.map((step) => (
              <article key={step.title}>
                <span>{step.kicker}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__inner">
          <div className="landing-doors">
            {audienceDoors.map((door) => (
              <Link key={door.eyebrow} href={door.href} className="landing-door">
                <span>{door.eyebrow}</span>
                <h2>{door.title}</h2>
                <p>{door.body}</p>
                <strong>{door.label}</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--trust">
        <div className="landing-section__inner landing-trust">
          <div className="landing-section__head">
            <p>Trust without sterile walls</p>
            <h2>Raw enough for the scene. Concrete enough for the booking table.</h2>
          </div>
          <ul>
            {trustPromises.map((promise) => (
              <li key={promise}>{promise}</li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
