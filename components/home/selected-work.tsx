import Link from "next/link";
import GlassFolder from "@/components/ui/glass-folder-cards";
import { publicProjects } from "@/lib/public-projects";

export async function SelectedWork(){
 const projects=await publicProjects();
 return <section id="selected-work" aria-labelledby="selected-work-heading" className="selected-work">
  <div className="mb-10"><h2 id="selected-work-heading" className="section-title">Selected work</h2></div>
  <div className="project-grid">{projects.map((project,index)=><article className="project-card project-folder-card" key={project.href}>
   <GlassFolder label={project.title} image={project.image} darkImage={project.darkImage} files={project.files} appearDelay={Math.min(index,5)*70}/>
   <div className="project-copy"><p className="project-category">{project.category}</p><h3 className="project-title">{project.title}</h3><p className="project-summary">{project.summary}</p><p className="project-meta">{project.role}</p><Link className="project-folder-link focus-ring" href={project.href}>View case study<span className="sr-only">: {project.title}</span><span aria-hidden="true"> ↗</span></Link></div>
  </article>)}</div>
  <div className="more-work"><Link href="/work" className="primary-button focus-ring">More work <span aria-hidden="true">→</span></Link></div>
 </section>;
}
