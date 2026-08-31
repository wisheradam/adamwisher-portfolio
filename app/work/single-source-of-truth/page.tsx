import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Single Source of Truth — Adam Wisher",
  description:
    "A company-wide synchronization initiative connecting product, sales, manufacturing, logistics, and engineering data into one unified ecosystem.",
};

const connectedSystems = [
  "Salesforce",
  "NetSuite",
  "Business Cube ERP · Italy",
  "Manufacturing",
  "Factory warehouse",
  "3PL",
  "Sales & logistics",
  "R&D",
  "Engineering",
  "Product Development",
];

const lifecycle = ["R&D", "Product", "Manufacturing", "Inventory", "Sales", "Delivery", "Service", "Feedback"];

export default function SingleSourceOfTruthPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-12 lg:py-12">
        <header className="flex items-center justify-between border-b border-border pb-6">
          <Link href="/" className="focus-ring rounded-sm font-display text-sm font-medium">Adam Wisher</Link>
          <Link href="/work" className="focus-ring rounded-sm font-mono text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground">
            ← All work
          </Link>
        </header>

        <article>
          <section className="grid gap-10 border-b border-border py-16 lg:grid-cols-[1.25fr_0.75fr] lg:py-24">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Enterprise systems · Product data</p>
              <h1 className="mt-5 max-w-4xl font-display text-5xl font-medium leading-[0.95] tracking-[-0.04em] sm:text-7xl lg:text-8xl">
                Single Source<br />of Truth
              </h1>
            </div>
            <div className="flex items-end">
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                A company-wide synchronization initiative connecting product, sales, manufacturing, logistics, and engineering data into one unified ecosystem.
              </p>
            </div>
          </section>

          <section className="grid gap-10 border-b border-border py-14 lg:grid-cols-[0.75fr_1.25fr] lg:py-20">
            <h2 className="font-display text-2xl font-medium tracking-tight">The challenge</h2>
            <div className="max-w-3xl space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <p>Critical product and operational data lived across commercial, financial, engineering, manufacturing, warehouse, and logistics systems. Each team could see a part of the product lifecycle, but not the same current, validated picture.</p>
              <p>The initiative establishes a shared data model and full multi-directional synchronization, so a meaningful change can move through the organization without creating another disconnected version of the truth.</p>
            </div>
          </section>

          <section className="border-b border-border py-14 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
              <h2 className="font-display text-2xl font-medium tracking-tight">Connected ecosystem</h2>
              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
                {connectedSystems.map((system) => (
                  <div key={system} className="min-h-28 bg-surface p-5">
                    <span className="font-mono text-xs leading-relaxed text-muted-foreground">{system}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="border-b border-border py-14 lg:py-20">
            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Multi-directional by design</p>
                <h2 className="mt-4 font-display text-2xl font-medium tracking-tight">One connected product lifecycle</h2>
              </div>
              <ol className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
                {lifecycle.map((stage, index) => (
                  <li key={stage} className="flex items-center gap-4 bg-background p-5">
                    <span className="font-mono text-[10px] text-accent">{String(index + 1).padStart(2, "0")}</span>
                    <span className="font-display text-base">{stage}</span>
                    <span className="ml-auto text-muted-foreground" aria-hidden="true">↔</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section className="py-20 text-center sm:py-28">
            <p className="mx-auto max-w-5xl font-display text-4xl font-medium leading-tight tracking-[-0.035em] sm:text-6xl">
              One product. One data model.<br /><span className="text-accent">One source of truth.</span>
            </p>
          </section>
        </article>
      </div>
    </main>
  );
}
