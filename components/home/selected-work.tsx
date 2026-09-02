import { ProjectCard } from "@/components/work/project-card";

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
    </section>
  );
}
