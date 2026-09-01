import Link from "next/link";
import { ProjectCard } from "@/components/work/project-card";

export default function WorkPage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8 lg:px-12 lg:py-12">
      <header className="flex items-center justify-between border-b border-border pb-6">
        <Link href="/" className="focus-ring rounded-sm font-display text-sm font-medium">
          Adam Wisher
        </Link>
        <Link
          href="/"
          className="focus-ring rounded-sm font-mono text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Home
        </Link>
      </header>

      <section className="py-16 lg:py-24" aria-labelledby="work-heading">
        <div className="mb-12 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Selected work</p>
          <h1 id="work-heading" className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl">
            Products and systems built to connect the work.
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ProjectCard
            title="Single Source of Truth"
            category="Systems · Data · Operations"
            summary="A company-wide synchronization initiative connecting product, sales, manufacturing, logistics, and engineering data."
            role="Product leadership"
            href="/work/single-source-of-truth"
            visual="ssot"
          />
          <ProjectCard
            title="Check2Go"
            category="TravelTech · 0→1 · USA"
            summary="A travel startup led end to end—from the first concept and team build to alpha, localization, and investor readiness."
            role="Product Lead · Project Owner"
            href="/work/check2go"
            visual="check2go"
          />
          <ProjectCard
            title="INNOVA Knowledge & Training Ecosystem"
            category="Knowledge · Enablement · Governance"
            summary="A governed company knowledge system for support, onboarding, partner training, certification, and document standards."
            role="Product Lead"
            href="/work/innova-knowledge-base"
            visual="knowledge"
          />
          <ProjectCard
            title="Business Systems Transformation"
            category="Enterprise · CPQ · Architecture"
            summary="A research-led roadmap from Zoho to Salesforce, NetSuite, and Slack, with CPQ and connected operations at the center."
            role="Product Lead"
            href="/work/business-systems-transformation"
            visual="transformation"
          />
          <ProjectCard
            title="AI Assistant for Technical & VIP Support"
            category="AI · CRM · CPQ · Support"
            summary="A grounded, multi-source assistant connecting verified company knowledge with product data, compatibility logic, and ordering workflows."
            role="Product Lead · AI Product Owner"
            href="/work/ai-support-assistant"
            visual="ai-support"
          />
        </div>
      </section>
    </main>
  );
}
