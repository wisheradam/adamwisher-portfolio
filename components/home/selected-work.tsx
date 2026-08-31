import { ProjectCard } from "@/components/work/project-card";

const PLACEHOLDER_PROJECTS = Array.from({ length: 4 }, (_, i) => ({
  title: `Project 0${i + 2}`,
  isPlaceholder: true as const,
}));

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
        {PLACEHOLDER_PROJECTS.map((project) => (
          <ProjectCard
            key={project.title}
            title={project.title}
            isPlaceholder={project.isPlaceholder}
          />
        ))}
      </div>
    </section>
  );
}
