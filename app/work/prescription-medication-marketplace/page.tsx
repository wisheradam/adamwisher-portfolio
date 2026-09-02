import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Project №6 · Prescription Medication Marketplace — Adam Wisher",
  description:
    "An anonymized healthcare product case study covering research, prescription verification, delivery, MVP strategy, analytics, experimentation, risk, and scaling.",
};

const researchSignals = [
  ["55%", "Forgot to buy medication on time"],
  ["50%", "Had difficulty comparing prices"],
  ["30%", "Encountered out-of-stock medication"],
  ["60%", "Ranked complete availability as a key service factor"],
  ["45%", "Considered delivery speed an important factor"],
  ["~25%", "Had been offered an alternative medication"],
];

const audiences = [
  ["01", "Chronic patients", "Need reliable repeat access to the same prescribed medication without interrupting therapy."],
  ["02", "Busy professionals", "Want to avoid visiting multiple pharmacies and reduce the time spent completing a prescription purchase."],
  ["03", "Parents & caregivers", "Manage prescriptions and purchases for children, older relatives, or several family members."],
  ["04", "Limited-mobility users", "Need a safe and predictable way to receive medication without a physically difficult pharmacy visit."],
];

const jobs = [
  ["When a doctor prescribes medication", "I want to verify the prescription and order online so I do not need to search across multiple pharmacies."],
  ["When a regular medication is running out", "I want to see availability and delivery timing quickly so I can avoid interrupting treatment."],
  ["When I buy medication for a relative", "I want to place the order remotely so I can manage care without an additional trip."],
];

const capabilities = [
  "Search by medication, active ingredient, and dosage",
  "Real-time availability and price visibility",
  "Prescription upload and verification",
  "Delivery or pickup selection",
  "Online payment and order tracking",
  "Secure recipient verification",
  "Alternative-medication approval flow",
  "Family profiles and recipient management",
  "Prescription and order history",
  "Reminders and one-click repeat ordering",
];

const phases = [
  ["01", "Concierge MVP", "Validate demand", "Registration, consent, search, price and availability, prescription upload, manual verification, checkout, payment, delivery/pickup, and feedback."],
  ["02", "MLP", "Build retention", "Personal account, richer search, prescription history, order history, repeat order, family profiles, reminders, notifications, and support."],
  ["03", "Target product", "Automate & scale", "Prescription-system integrations, pharmacy inventory integrations, OCR, automated verification, live comparison, tracking, loyalty, personalization, and AI assistance."],
];

const economics = [
  ["~8,992", "Modeled LTV"],
  ["~1,229", "Average modeled ARPU"],
  ["~2,857–4,357", "Modeled CAC range across channels"],
  ["106–215%", "Modeled ROI range across channels"],
];

const riskGroups = [
  ["Medical & personal data", "Encryption, role-based access, consent management, audit logs, and data minimization."],
  ["Prescription verification", "Manual verification in the MVP, followed by controlled automation and system integration."],
  ["Wrong recipient", "Identity controls, authorized recipients, and secure handover verification."],
  ["Fulfillment", "Double-checks, packaging controls, temperature handling, tracking, and staff procedures."],
  ["Regulatory", "Licensed partners, legal review, controlled product categories, and compliance checkpoints."],
  ["Trust & substitutions", "No automatic replacement of prescribed medication; alternatives require explanation and user confirmation."],
];

const responsibilities = [
  "Problem framing and product hypothesis",
  "Quantitative research and survey design",
  "Qualitative interview framework and CustDev plan",
  "Audience segmentation, Persona, and JTBD",
  "Customer journey and UX flow",
  "Market sizing and competitive analysis",
  "MVP, MLP, and target-product definition",
  "Product analytics, cohort analysis, and retention",
  "LTV, CAC, ROI, and monetization modeling",
  "A/B and HADI experiment design",
  "Progressive rollout strategy",
  "Risk, compliance, and secure-delivery thinking",
  "Go-to-market, roadmap, and scaling strategy",
];

export default function PrescriptionMedicationMarketplacePage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-12 lg:py-12">
        <header className="flex items-center justify-between border-b border-border pb-6">
          <Link href="/" className="focus-ring rounded-sm font-display text-sm font-medium">
            Adam Wisher
          </Link>
          <Link
            href="/work"
            className="focus-ring rounded-sm font-mono text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
          >
            ← All work
          </Link>
        </header>

        <article>
          <section className="grid gap-10 border-b border-border py-16 lg:grid-cols-[1.25fr_0.75fr] lg:py-24">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
                Project №6 · Healthcare · Marketplace · NDA
              </p>
              <h1 className="mt-5 max-w-6xl font-display text-5xl font-medium leading-[0.94] tracking-[-0.05em] sm:text-7xl lg:text-8xl">
                Prescription Medication Sales & Delivery in a Marketplace
              </h1>
            </div>
            <div className="flex flex-col justify-end gap-6">
              <div className="rounded-lg border border-border bg-surface p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">Confidential case study</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Company, marketplace, partner, and competitor names are intentionally withheld. Selected implementation details are anonymized because the project is presented under NDA/confidentiality constraints.
                </p>
              </div>
              <p className="max-w-xl text-xl leading-relaxed text-muted-foreground">
                A full-cycle healthcare product concept for turning prescription search, verification, checkout, delivery, and repeat medication management into one digital journey.
              </p>
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                <span>
                  Role
                  <br />
                  <strong className="mt-1 block font-normal text-foreground">Product Manager · End-to-end ownership</strong>
                </span>
                <span>
                  Case type
                  <br />
                  <strong className="mt-1 block font-normal text-foreground">Research · Validation · Launch design</strong>
                </span>
              </div>
            </div>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">The challenge</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">
                Prescription commerce is not a standard e-commerce transaction.
              </h2>
            </div>
            <div className="max-w-3xl space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                A user must find the exact medication, understand real availability, confirm the prescription, verify dosage and product details, select fulfillment, protect sensitive data, receive the order safely, and repeat the process when treatment continues.
              </p>
              <p>
                The opportunity was to remove fragmentation and design one controlled journey: <strong className="font-medium text-foreground">prescription → verification → search → comparison → checkout → delivery → repeat purchase.</strong>
              </p>
            </div>
          </section>

          <section className="border-b border-border py-14 lg:py-20">
            <div className="mb-10 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Quantitative research</p>
                <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">Start with behavior, not features.</h2>
              </div>
              <div className="max-w-2xl space-y-3 text-muted-foreground">
                <p>
                  I ran an exploratory online survey with <strong className="font-medium text-foreground">20 respondents</strong> who had experience buying medication and using digital services.
                </p>
                <p className="text-sm">
                  The sample was used for directional discovery and hypothesis generation—not as a statistically representative market study.
                </p>
              </div>
            </div>
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {researchSignals.map(([metric, insight]) => (
                <div key={metric + insight} className="min-h-44 bg-surface p-6">
                  <p className="font-display text-4xl font-medium tracking-tight text-accent">{metric}</p>
                  <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{insight}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Family medication management</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">The buyer is often managing care for someone else.</h2>
            </div>
            <div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-surface p-6">
                  <p className="font-display text-4xl font-medium text-accent">~63%</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">of respondents had children under 18.</p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-6">
                  <p className="font-display text-4xl font-medium text-accent">~42%</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">bought medication for older relatives.</p>
                </div>
              </div>
              <p className="mt-6 max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                This research signal expanded the concept from a one-person purchase flow into a medication-management system with family profiles, authorized recipients, prescription history, reminders, and fast repeat ordering.
              </p>
            </div>
          </section>

          <section className="border-b border-border py-14 lg:py-20">
            <div className="mb-10">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Core audiences</p>
              <h2 className="mt-4 max-w-3xl font-display text-3xl font-medium tracking-tight">Four recurring contexts shaped the product.</h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {audiences.map(([number, title, text]) => (
                <div key={number} className="min-h-64 bg-background p-5">
                  <span className="font-mono text-[10px] text-accent">{number}</span>
                  <h3 className="mt-10 font-display text-xl font-medium">{title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Jobs-to-be-Done</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">Translate demographics into real jobs.</h2>
            </div>
            <div className="space-y-px overflow-hidden rounded-lg border border-border bg-border">
              {jobs.map(([context, job], index) => (
                <div key={context} className="grid gap-4 bg-surface p-5 sm:grid-cols-[52px_1fr]">
                  <span className="font-mono text-[10px] text-accent">0{index + 1}</span>
                  <div>
                    <h3 className="font-display text-lg font-medium">{context}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{job}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="border-b border-border py-14 lg:py-20">
            <div className="mb-10 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Qualitative research</p>
                <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">A research plan built around past behavior.</h2>
              </div>
              <p className="max-w-2xl text-muted-foreground">
                I designed a 3–6 user interview program for people with previous online medication or delivery experience. The guide followed the real journey: context → search → prescription → selection → checkout → payment → waiting → receiving → problems → repeat order.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {["Prescription friction", "Trust & privacy", "Delivery uncertainty", "Errors & substitutions", "Human support", "Repeat purchase", "Family scenarios", "Status transparency"].map((item) => (
                <div key={item} className="rounded-lg border border-border bg-surface p-4 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Market sizing</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">Model the opportunity before building it.</h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
              <div className="bg-surface p-6">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">TAM</span>
                <p className="mt-8 font-display text-3xl font-medium">~80.5B</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Modeled annual medication market for the broad target urban audience.</p>
              </div>
              <div className="bg-surface p-6">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">SAM</span>
                <p className="mt-8 font-display text-3xl font-medium">~16.6B</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Modeled serviceable market based on online purchasing penetration.</p>
              </div>
              <div className="bg-surface p-6">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">SOM</span>
                <p className="mt-8 font-display text-3xl font-medium">~8.3B</p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Modeled obtainable scope constrained by product resources and launch assumptions.</p>
              </div>
            </div>
          </section>

          <section className="border-b border-border py-14 lg:py-20">
            <div className="mb-10 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Product strategy</p>
                <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">From delivery feature to medication-management experience.</h2>
              </div>
              <p className="max-w-2xl text-muted-foreground">
                Competitive research showed a gap in connecting prescription verification, live availability, checkout, fulfillment, family management, and repeat purchase in one coherent flow.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
              {capabilities.map((item, index) => (
                <div key={item} className="flex min-h-24 gap-4 bg-surface p-5">
                  <span className="font-mono text-[10px] text-accent">{String(index + 1).padStart(2, "0")}</span>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border-b border-border py-14 lg:py-20">
            <div className="mb-10">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">MVP → MLP → Scale</p>
              <h2 className="mt-4 max-w-4xl font-display text-3xl font-medium tracking-tight">
                Do not automate an unvalidated behavior.
              </h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-3">
              {phases.map(([number, title, goal, text]) => (
                <div key={number} className="min-h-80 bg-background p-6">
                  <span className="font-mono text-[10px] text-accent">{number}</span>
                  <h3 className="mt-10 font-display text-2xl font-medium">{title}</h3>
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-accent">{goal}</p>
                  <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
            <p className="mt-7 max-w-4xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              The Concierge MVP deliberately kept prescription verification manual. The first goal was to prove that users would trust the marketplace with the prescription journey before investing in expensive healthcare integrations and automation.
            </p>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Secure handover</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">The last meter is part of the product.</h2>
            </div>
            <div className="max-w-3xl space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                Prescription delivery introduced a recipient-verification problem that does not exist in normal marketplace fulfillment. The concept therefore included a secure handover layer such as QR-based verification or another approved identity-control mechanism.
              </p>
              <p>
                Alternative medications were also treated as a trust-sensitive flow: the system could explain and propose an alternative, but not silently replace the medication prescribed by the clinician.
              </p>
            </div>
          </section>

          <section className="border-b border-border py-14 lg:py-20">
            <div className="mb-10 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Product analytics</p>
                <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">Connect user behavior to business viability.</h2>
              </div>
              <p className="max-w-2xl text-muted-foreground">
                I used a learning dataset to work through cohort retention, ARPU, LTV, CAC, and ROI. These values are modeled analytical outputs, not claimed production results.
              </p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
              {economics.map(([value, label]) => (
                <div key={label} className="min-h-44 bg-surface p-6">
                  <p className="font-display text-3xl font-medium tracking-tight text-accent">{value}</p>
                  <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Experimentation</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">Use small tests to protect large investments.</h2>
            </div>
            <div>
              <p className="max-w-3xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                I designed a HADI / A-B experiment model to validate expensive functionality with a limited audience before full development. In one modeled scenario, a small experiment represented roughly 5% of full development cost while protecting against a materially larger downside if the hypothesis was wrong.
              </p>
              <div className="mt-7 overflow-hidden rounded-lg border border-border bg-surface p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">Progressive rollout</p>
                <p className="mt-5 font-display text-3xl font-medium tracking-tight sm:text-4xl">10% → 30% → 50% → 70% → 99% → 100%</p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Monitor conversion, revenue behavior, errors, and user feedback at every stage before expanding exposure.</p>
              </div>
            </div>
          </section>

          <section className="border-b border-border py-14 lg:py-20">
            <div className="mb-10 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Business model</p>
                <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">Transaction revenue first. Retention economics second.</h2>
              </div>
              <p className="max-w-2xl text-muted-foreground">
                The modeled monetization layer combined a transaction commission with an optional subscription layer for frequent users. Subscription benefits focused on delivery, reminders, recurring orders, and loyalty rather than replacing transaction revenue.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-border bg-surface p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">Year 1 modeled GMV</p>
                <p className="mt-6 font-display text-4xl font-medium">~16.55M</p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Based on modeled traffic × conversion × average order value.</p>
              </div>
              <div className="rounded-lg border border-border bg-surface p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-accent">3-year modeled GMV</p>
                <p className="mt-6 font-display text-4xl font-medium">~57.7M</p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">A planning model for evaluating scale, not a production revenue claim.</p>
              </div>
            </div>
          </section>

          <section className="border-b border-border py-14 lg:py-20">
            <div className="mb-10">
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Risk management</p>
              <h2 className="mt-4 max-w-4xl font-display text-3xl font-medium tracking-tight">
                Healthcare trust depends on what happens when something goes wrong.
              </h2>
            </div>
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
              {riskGroups.map(([title, text]) => (
                <div key={title} className="min-h-60 bg-background p-6">
                  <h3 className="font-display text-xl font-medium">{title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Go-to-market</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">Use existing intent before buying new traffic.</h2>
            </div>
            <div className="max-w-3xl space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>
                Because the product lived inside an existing marketplace ecosystem, the launch strategy emphasized internal discovery points: search, relevant category surfaces, contextual banners, account recommendations, push notifications, and loyalty.
              </p>
              <p>
                The key principle was to surface prescription delivery when medication intent already existed instead of treating the feature as a generic awareness campaign.
              </p>
            </div>
          </section>

          <section className="border-b border-border py-14 lg:py-20">
            <div className="mb-10 grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Roadmap</p>
                <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">Manual validation → retention → automation.</h2>
              </div>
              <p className="max-w-2xl text-muted-foreground">The roadmap intentionally postponed complex infrastructure until after the core user behavior was validated.</p>
            </div>
            <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-3">
              <div className="bg-surface p-6">
                <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Months 1–3</span>
                <h3 className="mt-8 font-display text-xl font-medium">Concierge MVP</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Validate prescription trust, ordering behavior, and operational feasibility.</p>
              </div>
              <div className="bg-surface p-6">
                <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Months 4–6</span>
                <h3 className="mt-8 font-display text-xl font-medium">MLP</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Strengthen repeat use through account history, family profiles, reminders, and support.</p>
              </div>
              <div className="bg-surface p-6">
                <span className="font-mono text-[10px] uppercase tracking-wider text-accent">Months 7–9</span>
                <h3 className="mt-8 font-display text-xl font-medium">Target product</h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Automate prescription and inventory flows, add live comparison, personalization, and AI support.</p>
              </div>
            </div>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">My contribution</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">Full-cycle product work.</h2>
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

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Case integrity</p>
              <h2 className="mt-4 font-display text-3xl font-medium tracking-tight">What this case does—and does not—claim.</h2>
            </div>
            <div className="max-w-3xl space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                This project represents product research, validation, strategy, launch design, analytics practice, and business modeling for a regulated marketplace category.
              </p>
              <p>
                Survey findings are real research outputs from the project. Financial, cohort, LTV/CAC, ROI, experiment, and GMV figures are modeling exercises used to support product decisions. A production launch of a prescription-medication marketplace is not claimed as an outcome.
              </p>
            </div>
          </section>

          <section className="py-20 text-center sm:py-28">
            <p className="mx-auto max-w-5xl font-display text-4xl font-medium leading-tight tracking-[-0.035em] sm:text-6xl">
              Validate trust before automating complexity.
              <br />
              <span className="text-accent">Research first. Concierge MVP next. Scale only after evidence.</span>
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
