import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Project №4 · Business Systems Transformation — Adam Wisher",
  description:
    "A strategic evaluation and transformation roadmap spanning Salesforce, NetSuite, Slack, CPQ, and factory and vendor integrations.",
};

const platforms = [
  ["CRM", "Zoho CRM → Salesforce", "Customer, sales, service, and product workflows consolidated around a scalable commercial platform."],
  ["Finance & ERP", "Zoho Books → NetSuite", "Financial and operational processes evaluated against growth, control, reporting, and integration requirements."],
  ["Collaboration", "Zoho Cliq → Slack", "Cross-functional communication redesigned for clearer ownership, faster escalation, and connected workflows."],
  ["Configuration", "CPQ as the core", "Compatibility, pricing, discounts, quantities, accessories, and commercial rules managed as governed product logic."],
];

const cpqRules = [
  "Product and accessory compatibility",
  "Quantity and dependency rules",
  "Discount levels and approval paths",
  "Market-specific pricing logic",
  "Generation and configuration constraints",
  "Quote accuracy and sales guidance",
];

const workstreams = [
  ["01", "Current-state audit", "Mapped systems, workflows, data ownership, limitations, manual work, and operational risk."],
  ["02", "Business case", "Prepared decision notes explaining expected value, trade-offs, implementation effort, and organizational impact."],
  ["03", "Scenario budgeting", "Compared platform, implementation, integration, migration, training, and ongoing operating-cost scenarios."],
  ["04", "Target architecture", "Designed the exchange of commercial, product, manufacturing, vendor, and logistics data across the future stack."],
  ["05", "Transition roadmap", "Structured the change into controlled stages with dependencies, validation gates, ownership, and adoption work."],
  ["06", "CPQ ownership", "Defined the rules and governance needed to turn complex product knowledge into reliable quoting logic."],
];

const principles = [
  ["No isolated migration", "Each platform decision was evaluated as part of one operating model, not as a standalone software replacement."],
  ["Product truth stays governed", "Factory and engineering sources remain authoritative while CRM and CPQ deliver usable commercial logic."],
  ["Value before complexity", "Capabilities were compared against total cost, implementation risk, adoption effort, and measurable operational value."],
  ["Phased change", "Data, integrations, rules, and teams move through testable stages to protect business continuity."],
];

export default function BusinessSystemsTransformationPage() {
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
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Project №4 · INNOVA · Enterprise Transformation</p>
              <h1 className="mt-5 max-w-5xl font-display text-5xl font-medium leading-[0.94] tracking-[-0.05em] sm:text-7xl lg:text-8xl">Business Systems Transformation</h1>
            </div>
            <div className="flex flex-col justify-end gap-6">
              <p className="max-w-xl text-xl leading-relaxed text-muted-foreground">A research-led roadmap for moving from a fragmented Zoho environment to Salesforce, NetSuite, and Slack—with CPQ at the center.</p>
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>Role<br /><strong className="mt-1 block font-normal text-foreground">Product Lead</strong></span>
                <span>Scope<br /><strong className="mt-1 block font-normal text-foreground">Strategy · Architecture · CPQ</strong></span>
              </div>
            </div>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">The decision</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">Change systems—or change how the company operates?</h2>
            </div>
            <div className="max-w-3xl space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>The business had reached the limits of its existing stack, especially around complex configuration and quoting. A simple tool comparison would not answer the real question: which operating model could support growth without recreating the same fragmentation in more expensive software?</p>
              <p>I led the research for ownership, translating platform capabilities, financial implications, data dependencies, and organizational change into a practical decision framework and phased roadmap.</p>
            </div>
          </section>

          <section className="border-b border-border py-14 lg:py-20">
            <div className="mb-10 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
              <h2 className="font-display text-3xl font-medium tracking-tight">One transformation, four platform decisions</h2>
              <p className="max-w-2xl text-muted-foreground">The target stack was evaluated as a connected business system spanning demand, configuration, finance, operations, and collaboration.</p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-2">
              {platforms.map(([label, title, text]) => (
                <div key={label} className="min-h-52 bg-surface p-6">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">{label}</span>
                  <h3 className="mt-8 font-display text-xl font-medium">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">The product core</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">CPQ turns product complexity into sales confidence.</h2>
            </div>
            <div>
              <p className="mb-7 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">CPQ was the decisive capability. I owned the product logic that connects what can be built, what can be sold, under which conditions, at what quantity, and with which price and discount controls.</p>
              <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
                {cpqRules.map((item, index) => (
                  <div key={item} className="min-h-28 bg-background p-5">
                    <span className="font-mono text-[10px] text-accent">0{index + 1}</span>
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border-b border-border py-14 lg:py-20">
            <div className="mb-10 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">My contribution</p>
                <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">From research to an executable roadmap.</h2>
              </div>
              <p className="max-w-2xl text-muted-foreground">The work connected executive decision-making with the operational detail required to implement the change responsibly.</p>
            </div>
            <ol className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {workstreams.map(([number, title, text]) => (
                <li key={number} className="min-h-64 bg-surface p-5">
                  <span className="font-mono text-[10px] text-accent">{number}</span>
                  <h3 className="mt-12 font-display text-xl font-medium">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Connected operations</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">The system extends beyond company walls.</h2>
            </div>
            <div className="max-w-3xl space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>The future architecture had to synchronize not only CRM and finance, but also the Italian factory, product development, external vendors, manufacturing, warehousing, and logistics.</p>
              <p>That required clear source-of-truth ownership, stable identifiers, controlled product rules, interface boundaries, validation, and an operating cadence for resolving data exceptions.</p>
            </div>
          </section>

          <section className="border-b border-border py-14 lg:py-20">
            <div className="mb-10">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Transformation principles</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">A platform strategy grounded in operations.</h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
              {principles.map(([title, text], index) => (
                <div key={title} className="min-h-60 bg-background p-5">
                  <span className="font-mono text-[10px] text-accent">0{index + 1}</span>
                  <h3 className="mt-10 font-display text-lg font-medium">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="py-20 text-center sm:py-28">
            <p className="mx-auto max-w-5xl font-display text-4xl font-medium leading-tight tracking-[-0.035em] sm:text-6xl">Not a software replacement.<br /><span className="text-accent">A scalable operating system for the business.</span></p>
          </section>
        </article>
      </div>
    </main>
  );
}
