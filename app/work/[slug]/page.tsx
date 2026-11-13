import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { db } from "@/lib/admin/db";
export const dynamic="force-dynamic";
export const runtime="nodejs";
export default async function ManagedProject({params}:{params:Promise<{slug:string}>}) {
  const {slug}=await params;
  const project=db().prepare("SELECT title,summary,body,category,role FROM projects WHERE slug=? AND status='PUBLISHED' AND visibility='PUBLIC' AND deleted_at IS NULL").get(slug) as {title:string;summary:string;body:string;category:string;role:string}|undefined;
  if(!project) notFound();
  return <main className="page-shell route-page"><SiteHeader/><article className="reading-surface" style={{marginBlock:48}}><p>{project.category}</p><h1>{project.title}</h1><p>{project.summary}</p><div style={{whiteSpace:"pre-wrap",marginTop:32}}>{project.body}</div><p>{project.role}</p></article></main>;
}
