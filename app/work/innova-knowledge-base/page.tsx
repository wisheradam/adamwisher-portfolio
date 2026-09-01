import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Project №3 · INNOVA Knowledge & Training Ecosystem — Adam Wisher",
  description:
    "A governed company knowledge ecosystem connecting support, onboarding, partner training, certification, and document standards.",
};

const missions = [
  ["01", "Support", "A trusted answer layer for Technical Support and VIP Service, organized by product, generation, symptom, and task."],
  ["02", "Employee lifecycle", "Role-based onboarding, guided learning paths, and offboarding checklists that retain operational knowledge."],
  ["03", "Partner enablement", "Product and sales training for representatives and managers, plus structured certification for installers and repair companies."],
  ["04", "Company standards", "One governed library for approved templates, procedures, naming conventions, and controlled company files."],
];

const layers = [
  ["Product truth", "ERP · CRM · PDM"],
  ["Knowledge layer", "Articles · Media · Files"],
  ["Governance", "Owners · Review · Versions"],
  ["Delivery", "Web · AI · Support · Training"],
];

const outcomes = [
  "Faster and more consistent support answers",
  "Shorter onboarding for employees and partners",
  "Traceable installer and service-company certification",
  "Fewer duplicated, outdated, or locally stored files",
  "A machine-readable foundation for an AI assistant",
  "A repeatable publishing and review process",
];

export default function InnovaKnowledgeBasePage() {
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
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Project №3 · INNOVA · Knowledge Operations</p>
              <h1 className="mt-5 max-w-5xl font-display text-5xl font-medium leading-[0.94] tracking-[-0.05em] sm:text-7xl lg:text-8xl">Knowledge & Training Ecosystem</h1>
            </div>
            <div className="flex flex-col justify-end gap-6">
              <p className="max-w-xl text-xl leading-relaxed text-muted-foreground">A governed knowledge system connecting product truth, support, training, certification, and company-wide operating standards.</p>
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>Role<br /><strong className="mt-1 block font-normal text-foreground">Product Lead</strong></span>
                <span>Scope<br /><strong className="mt-1 block font-normal text-foreground">Company-wide</strong></span>
              </div>
            </div>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">The challenge</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">Critical knowledge was scattered.</h2>
            </div>
            <div className="max-w-3xl space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>Support teams needed speed, new hires needed context, external installers needed proof of competence, and every department needed the same approved documents.</p>
              <p>I reframed the knowledge base as an operating capability—not a folder of articles. The system is structured, owned, versioned, searchable, and designed for both human and AI retrieval.</p>
            </div>
          </section>

          <section className="border-b border-border py-14 lg:py-20">
            <div className="mb-10 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
              <h2 className="font-display text-3xl font-medium tracking-tight">Four connected missions</h2>
              <p className="max-w-2xl text-muted-foreground">One platform serving employees, customers, partners, installers, and service companies through real workflows.</p>
            </div>
            <ol className="grid gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
              {missions.map(([number, title, text]) => (
                <li key={number} className="min-h-72 bg-surface p-5">
                  <span className="font-mono text-[10px] text-accent">{number}</span>
                  <h3 className="mt-14 font-display text-xl font-medium">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">System architecture</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">From product truth to usable knowledge.</h2>
            </div>
            <ol className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
              {layers.map(([title, detail], index) => (
                <li key={title} className="min-h-36 bg-background p-5">
                  <span className="font-mono text-[10px] text-accent">0{index + 1}</span>
                  <h3 className="mt-7 font-display text-lg font-medium">{title}</h3>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{detail}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Governance</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">Content is a product.</h2>
            </div>
            <div className="max-w-3xl space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>Each knowledge domain has an accountable owner. Critical content follows a controlled lifecycle: draft, expert review, approval, publication, scheduled review, and archive.</p>
              <p>Revision history, effective dates, and feedback from support cases keep the system trustworthy as products, organizations, and markets change.</p>
            </div>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Designed impact</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">Making knowledge scalable.</h2>
            </div>
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
              {outcomes.map((item, index) => <div key={item} className="min-h-28 bg-background p-5"><span className="font-mono text-[10px] text-accent">0{index + 1}</span><p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item}</p></div>)}
            </div>
          </section>

          <section className="py-20 text-center sm:py-28">
            <p className="mx-auto max-w-5xl font-display text-4xl font-medium leading-tight tracking-[-0.035em] sm:text-6xl">One trusted knowledge core.<br /><span className="text-accent">Every audience. Every workflow.</span></p>
          </section>
        </article>
      </div>
    </main>
  );
}
