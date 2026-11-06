import { ProjectCard } from "@/components/work/project-card";
import Link from "next/link";

export function SelectedWork() {
  return (
    <section
      aria-labelledby="selected-work-heading"
      className="mx-auto max-w-7xl px-6 py-16 lg:px-12 lg:py-24"
    >
      <div className="mb-10">
        <h2
          id="selected-work-heading"
          className="font-display text-2xl font-medium tracking-tight"
        >
          Selected work
        </h2>
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
      <div className="mt-10 flex justify-center">
        <Link href="/work" className="focus-ring inline-flex min-h-12 items-center gap-3 rounded-md border border-border bg-surface px-6 py-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent">More work <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}
