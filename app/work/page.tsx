import { metadataForPath } from "@/lib/seo/public-pages";
import { publicProjects } from "@/lib/public-projects";
import { SiteHeader } from "@/components/site-header";
import { ProjectFolders } from "@/components/work/project-folders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function WorkPage() {
  const projects = await publicProjects();
  return (
    <main className="page-shell route-page">
      <SiteHeader />

      <section className="py-16 lg:py-24" aria-labelledby="work-heading">
        <div className="mb-12 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
            Selected work
          </p>
          <h1
            id="work-heading"
            className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-5xl"
          >
            Work
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            Products and systems built to connect the work.
          </p>
        </div>

        <ProjectFolders projects={projects}/>
      </section>
    </main>
  );
}

export async function generateMetadata(){return metadataForPath("/work");}
