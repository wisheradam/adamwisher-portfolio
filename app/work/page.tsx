import { metadataForPath } from "@/lib/seo/public-pages";
import { PUBLIC_CASE_STUDIES } from "@/data/public-projects";
import { SiteHeader } from "@/components/site-header";
import { ProjectCard } from "@/components/work/project-card";
import Link from "next/link";
import { store } from "@/lib/admin/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function WorkPage() {
  const managed = await store.query("SELECT slug,title,summary,category,role FROM projects WHERE status='PUBLISHED' AND visibility='PUBLIC' AND deleted_at IS NULL ORDER BY sort_order,title LIMIT 100");
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

        <div className="project-grid">
          {PUBLIC_CASE_STUDIES.map(project=><ProjectCard key={project.href} {...project}/>)}
        </div>
        {managed.length>0&&<section aria-label="More projects" className="mt-12"><h2 className="section-title">More projects</h2><div className="project-grid">{managed.map(project=><article key={String(project.slug)} className="project-card project-copy"><p>{project.category}</p><h3>{project.title}</h3><p>{project.summary}</p><p>{project.role}</p><Link href={`/work/${project.slug}`}>View case study</Link></article>)}</div></section>}
      </section>
    </main>
  );
}

export async function generateMetadata(){return metadataForPath("/work");}
