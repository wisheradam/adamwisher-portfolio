import Link from "next/link";
import { ProjectFolders } from "@/components/work/project-folders";
import { publicProjects } from "@/lib/public-projects";

export async function SelectedWork(){
 const projects=await publicProjects();
 return <section id="selected-work" aria-labelledby="selected-work-heading" className="selected-work">
  <div className="mb-10"><h2 id="selected-work-heading" className="section-title">Selected work</h2></div>
  <ProjectFolders projects={projects}/>
  <div className="more-work"><Link href="/work" className="primary-button focus-ring">More work <span aria-hidden="true">→</span></Link></div>
 </section>;
}
