import { ProjectCard } from "@/components/work/project-card";

// TODO: replace with Adam's five real Product Manager case studies.
// Each slot below is a structural placeholder only — no project names,
// summaries, roles, or metrics have been invented.
const PLACEHOLDER_PROJECTS = Array.from({ length: 5 }, (_, i) => ({
  title: `Project 0${i + 1}`,
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