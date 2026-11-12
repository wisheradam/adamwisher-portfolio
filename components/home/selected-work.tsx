import { ProjectCard } from "@/components/work/project-card";
import Link from "next/link";

export function SelectedWork() {
  return (
    <section
      id="selected-work" aria-labelledby="selected-work-heading"
      className="selected-work"
    >
      <div className="mb-10">
        <h2
          id="selected-work-heading"
          className="section-title"
        >
          Selected work
        </h2>
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
      <div className="more-work">
        <Link href="/work" className="primary-button focus-ring">More work <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}
