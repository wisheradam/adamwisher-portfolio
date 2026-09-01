import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Project №5 · AI Assistant for Technical & VIP Support — Adam Wisher",
  description: "A grounded AI assistant connecting verified company knowledge, CRM product data, CPQ compatibility logic, and expert validation.",
};

const knowledgeSources = [
  ["Knowledge base", "Governed technical and service knowledge created across the company."],
  ["Support research", "Interviews and workflow research with Technical Support and VIP Concierge teams."],
  ["Real conversations", "Thousands of minutes of recorded customer and partner conversations transcribed into searchable text."],
  ["Technical corpus", "Datasheets, manuals, service instructions, known errors, troubleshooting guidance, and internal documentation."],
];

const responseSources = [
  ["01", "Retrieve", "Search multiple approved internal sources for evidence relevant to the employee's question."],
  ["02", "Compare", "Reconcile documentation, support history, CRM records, and compatibility rules before composing an answer."],
  ["03", "Explain", "Show the sources used, their percentage contribution, and links back to the supporting material."],
  ["04", "Escalate", "Route uncertain or contradictory cases to a domain expert instead of presenting a guess as fact."],
];

const productFlow = [
  ["Identify", "Recognize the unit, generation, serial context, and installed configuration."],
  ["Diagnose", "Connect the reported issue with approved troubleshooting knowledge."],
  ["Configure", "Apply CPQ compatibility, dependency, quantity, and configuration rules."],
  ["Recommend", "Return the correct spare part or accessory with an evidence-based explanation."],
  ["Order", "Continue from the recommendation into the existing CRM ordering workflow."],
];

const validationStages = [
  ["Stage 01", "Front-line testing", "Technical Support and VIP Concierge employees tested real daily scenarios, answer quality, and usability."],
  ["Stage 02", "Expert validation", "Technical Support, Engineering, Documentation, and VIP Concierge leaders verified accuracy, currency, interpretation, and safety."],
  ["Stage 03", "CRM deployment", "Only after cross-functional approval was the assistant embedded into the existing CRM workflow."],
];

const responsibilities = [
  "Product concept and use-case definition",
  "Support and VIP Concierge workflow research",
  "Knowledge acquisition and data structuring",
  "Conversation transcription pipeline",
  "Claude Code assistant development",
  "Closed-source information architecture",
  "Multi-source attribution design",
  "CRM product catalog integration",
  "CPQ compatibility integration",
  "User testing and cross-functional validation",
  "CRM rollout coordination",
];

export default function AiSupportAssistantPage() {
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
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Project №5 · INNOVA · Applied AI</p>
              <h1 className="mt-5 max-w-5xl font-display text-5xl font-medium leading-[0.94] tracking-[-0.05em] sm:text-7xl lg:text-8xl">AI Assistant for Technical & VIP Support</h1>
            </div>
            <div className="flex flex-col justify-end gap-6">
              <p className="max-w-xl text-xl leading-relaxed text-muted-foreground">A grounded assistant that turns verified company knowledge, product data, and CPQ rules into fast, traceable answers inside CRM.</p>
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>Role<br /><strong className="mt-1 block font-normal text-foreground">Product Lead · AI Product Owner</strong></span>
                <span>Scope<br /><strong className="mt-1 block font-normal text-foreground">Research · AI · CRM · CPQ</strong></span>
              </div>
            </div>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">The opportunity</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">Make company expertise available at the moment of need.</h2>
            </div>
            <div className="max-w-3xl space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>Technical and VIP service teams worked across a large body of product documentation, troubleshooting history, support conversations, and compatibility rules. Finding the right answer quickly required knowing where to look and how to reconcile multiple sources.</p>
              <p>I led the creation of a specialized assistant using Claude and Claude Code to bring that expertise into one controlled workflow—without relying on unverified external information.</p>
            </div>
          </section>

          <section className="border-b border-border py-14 lg:py-20">
            <div className="mb-10 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Knowledge engineering</p>
                <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">Real company knowledge, prepared for AI.</h2>
              </div>
              <p className="max-w-2xl text-muted-foreground">The work began with discovery, digitization, cleaning, classification, and conversion—not with a generic chatbot prompt.</p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-2">
              {knowledgeSources.map(([title, text], index) => (
                <div key={title} className="min-h-52 bg-surface p-6">
                  <span className="font-mono text-[10px] text-accent">0{index + 1}</span>
                  <h3 className="mt-8 font-display text-xl font-medium">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Grounded by design</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">Traceable answers—not plausible guesses.</h2>
            </div>
            <div>
              <p className="mb-7 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">External retrieval was disabled to reduce hallucination risk. The assistant answers from approved internal sources, exposes the evidence behind each response, and escalates when that evidence is insufficient.</p>
              <ol className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
                {responseSources.map(([number, title, text]) => (
                  <li key={number} className="min-h-48 bg-background p-5">
                    <span className="font-mono text-[10px] text-accent">{number}</span>
                    <h3 className="mt-8 font-display text-lg font-medium">{title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="border-b border-border py-14 lg:py-20">
            <div className="mb-10 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">CRM + CPQ</p>
                <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">From a support question to the right product—and the order.</h2>
              </div>
              <p className="max-w-2xl text-muted-foreground">The assistant sees products, spare parts, accessories, generations, and configurations in CRM, then applies governed CPQ logic to determine what is compatible.</p>
            </div>
            <ol className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
              {productFlow.map(([title, text], index) => (
                <li key={title} className="min-h-64 bg-surface p-5">
                  <span className="font-mono text-[10px] text-accent">0{index + 1}</span>
                  <h3 className="mt-12 font-display text-lg font-medium">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </li>
              ))}
            </ol>
          </section>

          <section className="border-b border-border py-14 lg:py-20">
            <div className="mb-10">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Validation before deployment</p>
              <h2 className="mt-4 max-w-3xl font-display text-3xl font-medium tracking-tight">Validated by the people who own the knowledge and use it every day.</h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-3">
              {validationStages.map(([label, title, text]) => (
                <div key={label} className="min-h-64 bg-background p-6">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">{label}</span>
                  <h3 className="mt-10 font-display text-xl font-medium">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">My contribution</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">End-to-end product ownership.</h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
              {responsibilities.map((item, index) => (
                <div key={item} className="flex min-h-24 gap-4 bg-surface p-5">
                  <span className="font-mono text-[10px] text-accent">{String(index + 1).padStart(2, "0")}</span>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="py-20 text-center sm:py-28">
            <p className="mx-auto max-w-5xl font-display text-4xl font-medium leading-tight tracking-[-0.035em] sm:text-6xl">From scattered expertise to guided action.<br /><span className="text-accent">Verified knowledge, delivered inside the workflow.</span></p>
          </section>
        </article>
      </div>
    </main>
  );
}
