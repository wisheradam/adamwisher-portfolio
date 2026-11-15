import "server-only";
import { PUBLIC_CASE_STUDIES } from "@/data/public-projects";
import { store } from "@/lib/admin/db";

export type PublicMaterial={name:string;meta:string;href:string;image?:string};
export type PublicProject={title:string;summary:string;category:string;role:string;href:string;image:string;darkImage?:string;files:PublicMaterial[]};
const visuals:Record<string,string>={ssot:'ssot',check2go:'check2go',knowledge:'knowledge',transformation:'transformation','ai-support':'ai-support'};
export async function publicProjects():Promise<PublicProject[]>{
 const projects:PublicProject[]=PUBLIC_CASE_STUDIES.map(project=>{
  const visual=project.visual&&visuals[project.visual];
  const image=project.visualSrc??`/project-visuals/${visual}-light.svg`;
  return {title:project.title,summary:project.summary,category:project.category,role:project.role,href:project.href,image,darkImage:`/project-visuals/${visual??'healthcare'}-dark.svg`,files:[
   {name:'Case study',meta:'Read project',href:project.href},
   {name:'Cover diagram',meta:'SVG',href:image,image},
  ]};
 });
 // Match the existing managed discovery opt-in; default Home still works
 // without a database. Working bodies, private uploads and workspace URLs
 // never cross this server boundary into client props or HTML.
 if(process.env.PUBLIC_CONTENT_SOURCE!=='database')return projects;
 const rows=await store.query("SELECT slug,title,summary,category,role FROM projects WHERE status='PUBLISHED' AND visibility='PUBLIC' AND deleted_at IS NULL ORDER BY sort_order ASC,slug ASC");
 const paths=new Set(projects.map(project=>project.href));
 for(const row of rows){
  if(typeof row.slug!=='string'||!String(row.title??'').trim()||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug))continue;
  const href=`/work/${row.slug}`;if(paths.has(href))continue;paths.add(href);
  // Legacy Projects have no cover/material fields. Reuse the public SEO
  // image instead of inventing an upload or scraping potentially private body links.
  const image=`/og?path=${encodeURIComponent(href)}`;
  projects.push({title:String(row.title),summary:String(row.summary??''),category:String(row.category??''),role:String(row.role??''),href,image,files:[
   {name:'Case study',meta:'Read project',href},
   {name:'Project overview',meta:'PNG',href:image,image},
  ]});
 }
 return projects;
}
