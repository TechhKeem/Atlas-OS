import Link from "next/link";
import { site } from "@/config/site";
import TrackView from "@/components/TrackView";

const steps = [
  { n: "1", t: "Tell us where you stand", d: "Upload a policy, or answer a few simple questions." },
  { n: "2", t: "Get a plain-English review", d: "See what's working, what to watch, and why." },
  { n: "3", t: "Talk to a person when you're ready", d: "A licensed agent can walk through it with you. No pressure." },
];

export default function Landing() {
  return (
    <>
      <TrackView name="landing_viewed" />
      <section className="mx-auto max-w-5xl px-4 pb-16 pt-14 sm:pt-24">
        <p className="eyebrow">Free life insurance review</p>
        <h1 className="mt-4 max-w-3xl text-4xl sm:text-6xl">
          Find out if your family is <span className="text-breeze-deep">actually protected.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-breeze-navy-text">{site.heroSub}</p>
        <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Link href="/start" className="btn-primary">Get started <span aria-hidden>&rarr;</span></Link>
          <p className="text-sm text-breeze-navy-text">Takes about 3 minutes. Free.</p>
        </div>
      </section>

      <section className="bg-soft py-14">
        <div className="mx-auto grid max-w-5xl gap-5 px-4 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="card">
              <p className="eyebrow">Step {s.n}</p>
              <h2 className="mt-3 text-xl">{s.t}</h2>
              <p className="mt-2 text-breeze-navy-text">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="text-3xl">{site.tagline}</h2>
        <p className="mt-4 max-w-2xl text-lg text-breeze-navy-text">
          No scare tactics and no fake deadlines. We explain the why behind every number, and we're on your side.
        </p>
      </section>
    </>
  );
}
