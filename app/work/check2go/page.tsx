import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Project №2 · Check2Go — Adam Wisher",
  description: "A 0→1 TravelTech startup led end to end from idea to alpha for the U.S. market.",
};

const ownership = [
  ["01", "Shape", "Product concept, market positioning, business model, and product strategy."],
  ["02", "Plan", "Product roadmap, requirements, priorities, milestones, and release planning."],
  ["03", "Build", "Hiring, onboarding, team training, UX/UI coordination, and direct product development."],
  ["04", "Launch", "Testing, analytics, localization, U.S. go-to-market, and alpha release."],
  ["05", "Fund", "Investor deck, pitching, and preparation for crowdfunding investment platforms."],
];

const delivery = [
  "Product concept & strategy",
  "U.S. market positioning",
  "Roadmap & prioritization",
  "Hiring & onboarding",
  "Team training sessions",
  "UX/UI coordination",
  "Website concept & approval",
  "Multi-stage mobile delivery",
  "Testing & analytics",
  "Product localization",
  "Go-to-market planning",
  "Investor readiness",
];

export default function Check2GoPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-12 lg:py-12">
        <header className="flex items-center justify-between border-b border-border pb-6">
          <Link href="/" className="focus-ring rounded-sm font-display text-sm font-medium">Adam Wisher</Link>
          <Link href="/work" className="focus-ring rounded-sm font-mono text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground">← All work</Link>
        </header>

        <article>
          <section className="grid gap-10 border-b border-border py-16 lg:grid-cols-[1.25fr_0.75fr] lg:py-24">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Project №2 · TravelTech · USA</p>
              <h1 className="mt-5 font-display text-6xl font-medium leading-[0.92] tracking-[-0.05em] sm:text-8xl lg:text-9xl">Check2Go</h1>
            </div>
            <div className="flex flex-col justify-end gap-6">
              <p className="max-w-xl text-xl leading-relaxed text-muted-foreground">A travel startup led end to end—from the first idea to a working alpha and investment preparation.</p>
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>Product Lead<br /><strong className="mt-1 block font-normal text-foreground">Project Owner</strong></span>
                <span>Stage<br /><strong className="mt-1 block font-normal text-foreground">Idea → Alpha</strong></span>
              </div>
            </div>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">The mandate</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">Full ownership—not a handoff.</h2>
            </div>
            <div className="max-w-3xl space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>Check2Go began as an idea for the U.S. travel market. I turned that idea into a product direction, an executable roadmap, a team, and a multi-stage development program spanning the website and mobile application.</p>
              <p>My role combined product leadership with hands-on execution: defining what to build, assembling and developing the team, coordinating design and engineering, approving customer-facing work, and staying directly involved through testing, analytics, localization, and alpha delivery.</p>
            </div>
          </section>

          <section className="border-b border-border py-14 lg:py-20">
            <div className="mb-10 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
              <h2 className="font-display text-3xl font-medium tracking-tight">0→1, end to end</h2>
              <p className="max-w-2xl text-muted-foreground">One continuous line of ownership across product, people, delivery, market, and funding.</p>
            </div>
            <ol className="grid gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-5">
              {ownership.map(([number, title, text]) => (
                <li key={number} className="min-h-60 bg-surface p-5">
                  <span className="font-mono text-[10px] text-accent">{number}</span>
                  <h3 className="mt-12 font-display text-xl font-medium">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Scope</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">From product decisions to delivery details.</h2>
            </div>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
              {delivery.map((item) => <div key={item} className="min-h-24 bg-background p-4 text-sm leading-snug text-muted-foreground">{item}</div>)}
            </div>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Applied education</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">Startup Mastery</h2>
            </div>
            <div className="max-w-3xl">
              <p className="font-display text-xl leading-snug">Innovation Professional Certificate</p>
              <p className="mt-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">MAOF · Ministry of Economy and Industry of Israel</p>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">I completed the program to deepen the startup practice applied to Check2Go: business modeling, product-market fit, go-to-market strategy, legal foundations, investor readiness, mentoring, and scaling. The curriculum combined online learning with in-person mentoring and peer collaboration.</p>
            </div>
          </section>

          <section className="py-20 text-center sm:py-28">
            <p className="mx-auto max-w-5xl font-display text-4xl font-medium leading-tight tracking-[-0.035em] sm:text-6xl">From a blank page to a product ready to be tested, pitched, and scaled.<br /><span className="text-accent">That was the job.</span></p>
          </section>
        </article>
      </div>
    </main>
  );
}
