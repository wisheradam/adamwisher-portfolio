import { SiteHeader } from "@/components/site-header";
import { ProjectCard } from "@/components/work/project-card";
import Link from "next/link";
import { store } from "@/lib/admin/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function WorkPage() {
  const managed = await store.query("SELECT slug,title,summary,category,role FROM projects WHERE status='PUBLISHED' AND visibility='PUBLIC' AND deleted_at IS NULL ORDER BY sort_order,title LIMIT 100");
  return (
    <main className="page-shell route-page">
      <SiteHeader />

      <section className="py-16 lg:py-24" aria-labelledby="work-heading">
        <div className="mb-12 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
            Selected work
          </p>
          <h1
            id="work-heading"
            className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl"
          >
            Work
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            Products and systems built to connect the work.
          </p>
        </div>

        <div className="project-grid">
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
          <ProjectCard
            title="Healthcare Marketplace: Prescription Medication Sales & Delivery"
            category="Healthcare · Marketplace · NDA"
            summary="A full-cycle product case for prescription search, verification, checkout, secure delivery, repeat medication management, and scalable automation."
            role="Product Manager · End-to-end"
            href="/work/prescription-medication-marketplace"
            visualSrc="/project-06-rx.svg"
          />
        </div>
        {managed.length>0&&<section aria-label="More projects" className="mt-12"><h2 className="section-title">More projects</h2><div className="project-grid">{managed.map(project=><article key={String(project.slug)} className="project-card project-copy"><p>{project.category}</p><h3>{project.title}</h3><p>{project.summary}</p><p>{project.role}</p><Link href={`/work/${project.slug}`}>View case study</Link></article>)}</div></section>}
      </section>
    </main>
  );
}
