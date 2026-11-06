import type { Metadata } from "next";
import Link from "next/link";
import { education } from "@/data/knowledge/education";
import { certifications } from "@/data/knowledge/certifications";
import type { KnowledgeRecord } from "@/data/knowledge/types";

export const metadata: Metadata = {
  title: "Education & Training — Adam Wisher",
  description: "Academic education, professional retraining, completed courses, and practical training across product management, AI, technology, and leadership.",
};

function date(value?: string) {
  if (!value) return "";
  const [year, month] = value.split("-");
  return month ? new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${year}-${month}-01T00:00:00Z`)) : year;
}

function topic(record: KnowledgeRecord) {
  const text = `${record.title} ${(record.skills ?? []).join(" ")}`.toLowerCase();
  if (/generative ai|ai leadership|ai for/.test(text)) return "AI & Cloud";
  if (/aws|cloud computing/.test(text)) return "AI & Cloud";
  if (/python|sap|salesforce|erp|jira/.test(text)) return "Technology & Business Systems";
  if (/research|user data|regression|a\/b/.test(text)) return "Research & Analytics";
  if (/product management|product owner|product launch|product strategy/.test(text)) return "Product Management";
  if (/agile|scrum|kanban|lean|software project|project management/.test(text)) return "Agile & Delivery";
  return "Leadership & Communication";
}

const topics = ["Product Management", "AI & Cloud", "Research & Analytics", "Agile & Delivery", "Technology & Business Systems", "Leadership & Communication"];

export default function EducationPage() {
  const studies = education.filter((record) => record.public);
  const courses = certifications.filter((record) => record.public).sort((a, b) => (b.period?.to ?? "").localeCompare(a.period?.to ?? ""));

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8 lg:px-12 lg:py-12">
      <header className="flex items-center justify-between border-b border-border pb-6">
        <Link href="/" className="focus-ring rounded-sm font-display text-sm font-medium">Adam Wisher</Link>
        <Link href="/" className="focus-ring rounded-sm font-mono text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground">← Home</Link>
      </header>

      <section className="py-16 lg:py-24" aria-labelledby="education-heading">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Education & Training</p>
        <h1 id="education-heading" className="mt-4 max-w-3xl font-display text-4xl font-medium tracking-tight sm:text-6xl">A foundation in business.<br />A focus on product and technology.</h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">My academic background, professional retraining, and completed courses across product management, AI, systems, and leadership.</p>

        <nav aria-label="Education sections" className="mt-8 flex flex-wrap gap-3 text-sm">
          <a href="#formal-education" className="focus-ring rounded-full border border-border px-4 py-2 transition-colors hover:border-accent">Education</a>
          <a href="#courses" className="focus-ring rounded-full border border-border px-4 py-2 transition-colors hover:border-accent">Courses & Training</a>
        </nav>

        <section id="formal-education" className="scroll-mt-8 pt-16" aria-labelledby="formal-heading">
          <h2 id="formal-heading" className="font-display text-2xl font-medium tracking-tight">Education & Professional Retraining</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {studies.map((record) => (
              <article key={record.id} className="rounded-lg border border-border bg-surface p-6 sm:p-8">
                <p className="font-mono text-xs uppercase tracking-wide text-accent">{record.organization}</p>
                <h3 className="mt-4 font-display text-2xl font-medium tracking-tight">{record.title}</h3>
                <p className="mt-4 font-mono text-xs text-muted-foreground">{date(record.period?.from)} — {date(record.period?.to)}</p>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">{record.summary}</p>
                <ul className="mt-6 flex flex-wrap gap-2" aria-label="Fields of study">
                  {record.skills?.map((skill) => <li key={skill} className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">{skill}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="courses" className="scroll-mt-8 pt-16" aria-labelledby="courses-heading">
          <h2 id="courses-heading" className="font-display text-2xl font-medium tracking-tight">Completed Courses & Training</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">Professional development grouped by subject. Exam preparation courses are marked separately and do not indicate that a professional certification was awarded.</p>
          <div className="mt-8 space-y-8">
            {topics.map((group) => {
              const items = courses.filter((record) => topic(record) === group);
              if (!items.length) return null;
              return (
                <section key={group} aria-label={group} className="overflow-hidden rounded-lg border border-border bg-surface">
                  <h3 className="border-b border-border px-6 py-5 font-display text-lg font-medium">{group} <span className="ml-2 font-mono text-xs text-muted-foreground">{items.length}</span></h3>
                  <ul className="divide-y divide-border">
                    {items.map((record) => {
                      const prep = /certification preparation|certification preparation training/i.test(record.summary);
                      return (
                        <li key={record.id} className="px-6 py-5 sm:flex sm:items-start sm:justify-between sm:gap-8">
                          <div className="min-w-0">
                            <h4 className="text-sm font-medium leading-relaxed">{record.title}</h4>
                            <p className="mt-1 text-sm text-muted-foreground">{record.organization}</p>
                            {prep ? <span className="mt-2 inline-block rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-accent">Exam preparation</span> : null}
                            {record.id.startsWith("training-") ? <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{record.summary}</p> : null}
                          </div>
                          <p className="mt-3 shrink-0 font-mono text-xs text-muted-foreground sm:mt-1">{date(record.period?.to)}</p>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </section>
      </section>
    </main>
  );
}
