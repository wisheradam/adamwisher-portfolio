import { CourseRow } from "@/components/education/course-row";
import { SiteHeader } from "@/components/site-header";
import type { Metadata } from "next";
import {
  education,
  yandexProgram,
  economicsProgram,
} from "@/data/knowledge/education";
import { certifications } from "@/data/knowledge/certifications";
import type { KnowledgeRecord } from "@/data/knowledge/types";

export const metadata: Metadata = {
  title: "Education & Training — Adam Wisher",
  description:
    "Academic education, professional retraining, completed courses, and practical training across product management, AI, technology, and leadership.",
};

function date(value?: string) {
  if (!value) return "";
  const [year, month] = value.split("-");
  return month
    ? new Intl.DateTimeFormat("en", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(`${year}-${month}-01T00:00:00Z`))
    : year;
}

function topic(record: KnowledgeRecord) {
  const text =
    `${record.title} ${(record.skills ?? []).join(" ")}`.toLowerCase();
  if (/generative ai|ai leadership|ai for/.test(text)) return "AI & Cloud";
  if (/aws|cloud computing/.test(text)) return "AI & Cloud";
  if (/python|sap|salesforce|erp|jira/.test(text))
    return "Technology & Business Systems";
  if (/research|user data|regression|a\/b/.test(text))
    return "Research & Analytics";
  if (
    /product management|product owner|product launch|product strategy/.test(
      text,
    )
  )
    return "Product Management";
  if (/agile|scrum|kanban|lean|software project|project management/.test(text))
    return "Agile & Delivery";
  return "Leadership & Communication";
}

const topics = [
  "Product Management",
  "AI & Cloud",
  "Research & Analytics",
  "Agile & Delivery",
  "Technology & Business Systems",
  "Leadership & Communication",
];

export default function EducationPage() {
  const studies = education.filter((record) => record.public);
  const courses = certifications
    .filter((record) => record.public)
    .sort((a, b) => (b.period?.to ?? "").localeCompare(a.period?.to ?? ""));

  return (
    <main className="page-shell route-page">
      <SiteHeader />

      <section className="py-16 lg:py-24" aria-labelledby="education-heading">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
          Education & Training
        </p>
        <h1
          id="education-heading"
          className="mt-4 max-w-3xl font-display text-4xl font-medium tracking-tight sm:text-6xl"
        >
          A foundation in business.
          <br />A focus on product and technology.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          My academic background, professional retraining, and completed courses
          across product management, AI, systems, and leadership.
        </p>

        <nav
          aria-label="Education sections"
          className="mt-8 flex flex-wrap gap-3 text-sm"
        >
          <a
            href="#formal-education"
            className="focus-ring rounded-full border border-border px-4 py-2 transition-colors hover:border-accent"
          >
            Education
          </a>
          <a
            href="#courses"
            className="focus-ring rounded-full border border-border px-4 py-2 transition-colors hover:border-accent"
          >
            Courses & Training
          </a>
        </nav>

        <section
          id="formal-education"
          className="scroll-mt-8 pt-16"
          aria-labelledby="formal-heading"
        >
          <h2
            id="formal-heading"
            className="font-display text-2xl font-medium tracking-tight"
          >
            Education & Professional Retraining
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {studies.map((record) => (
              <article
                key={record.id}
                className="rounded-lg border border-border bg-surface p-6 sm:p-8 md:row-span-6 md:grid md:grid-rows-subgrid"
              >
                <p className="text-2xl font-medium leading-[30px]">
                  {record.organization}
                </p>
                <h3 className="mt-4 text-base leading-[26px] text-muted-foreground">
                  {record.title}
                </h3>
                <p className="mt-4 font-mono text-xs text-muted-foreground">
                  {date(record.period?.from)} — {date(record.period?.to)}
                </p>
                <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                  {record.summary}
                </p>
                {record.id === "edu-yandex-product" ? (
                  <div className="mt-6 flex flex-col border-t border-border pt-6">
                    <details className="group">
                      <summary className="focus-ring cursor-pointer rounded-sm text-sm font-medium text-accent">
                        Curriculum & Practical Experience
                      </summary>
                      <dl className="space-y-4 text-sm">
                        {[
                          ["Duration", yandexProgram.duration],
                          ["Education Level", yandexProgram.educationLevel],
                          ["Entry Requirement", yandexProgram.entryRequirement],
                          ["Specialization", yandexProgram.specialization],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <dt className="font-medium">{label}</dt>
                            <dd className="mt-1 leading-relaxed text-muted-foreground">
                              {value}
                            </dd>
                          </div>
                        ))}
                      </dl>
                      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                        Curriculum level describes the scope of study; this is a
                        professional retraining qualification, not an academic
                        degree.
                      </p>

                      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                        {yandexProgram.overview}
                      </p>
                      <h4 className="mt-5 text-sm font-medium">
                        Key Areas of Study
                      </h4>
                      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
                        {yandexProgram.areas.map((area) => (
                          <li key={area}>{area}</li>
                        ))}
                      </ul>
                      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                        {yandexProgram.practice}
                      </p>
                      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                        {yandexProgram.outcome}
                      </p>
                    </details>
                  </div>
                ) : null}
                {record.id === "edu-minsk-economics" ? (
                  <div className="mt-6 flex flex-col border-t border-border pt-6">
                    <details className="">
                      <summary className="focus-ring cursor-pointer rounded-sm text-sm font-medium text-accent">
                        Curriculum & Professional Foundation
                      </summary>
                      <dl className="space-y-4 text-sm">
                        {[
                          [
                            "Study Period",
                            `${date(record.period?.from)} — ${date(record.period?.to)}`,
                          ],
                          ["Education Level", "Higher Education"],
                          ["Qualification", economicsProgram.qualification],
                          [
                            "Specialization",
                            "Economics and Enterprise Management",
                          ],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <dt className="font-medium">{label}</dt>
                            <dd className="mt-1 leading-relaxed text-muted-foreground">
                              {value}
                            </dd>
                          </div>
                        ))}
                      </dl>

                      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                        {economicsProgram.overview}
                      </p>
                      <h4 className="mt-5 text-sm font-medium">
                        Key Areas of Study
                      </h4>
                      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
                        {economicsProgram.areas.map((area) => (
                          <li key={area}>{area}</li>
                        ))}
                      </ul>
                      <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
                        {economicsProgram.outcome}
                      </p>
                    </details>
                  </div>
                ) : null}
                <ul
                  className="mt-6 flex flex-wrap gap-2"
                  aria-label="Fields of study"
                >
                  {record.skills?.map((skill) => (
                    <li
                      key={skill}
                      className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section
          id="courses"
          className="scroll-mt-8 pt-16"
          aria-labelledby="courses-heading"
        >
          <h2
            id="courses-heading"
            className="font-display text-2xl font-medium tracking-tight"
          >
            Completed Courses & Training
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Professional development grouped by subject. Exam preparation
            courses are marked separately and do not indicate that a
            professional certification was awarded.
          </p>
          <div className="mt-8 space-y-8">
            {topics.map((group) => {
              const items = courses.filter((record) => topic(record) === group);
              if (!items.length) return null;
              return (
                <section
                  key={group}
                  aria-label={group}
                  className="overflow-hidden rounded-lg border border-border bg-surface"
                >
                  <h3 className="border-b border-border px-6 py-5 font-display text-lg font-medium">
                    {group}{" "}
                    <span className="ml-2 font-mono text-xs text-muted-foreground">
                      {items.length}
                    </span>
                  </h3>
                  <ul className="divide-y divide-border">
                    {items.map((record) => (
                      <CourseRow
                        key={record.id}
                        record={record}
                        completedAt={date(record.period?.to)}
                      />
                    ))}
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
