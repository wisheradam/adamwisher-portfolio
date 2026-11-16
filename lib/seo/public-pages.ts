import "server-only";
import type { Metadata } from "next";
import { store, type Row } from "@/lib/admin/db";
import { publishedRows } from "@/lib/admin/publication";
import { publicFlag } from "@/lib/admin/public-flags";
import { publicSeo } from "@/lib/admin/public-seo";
import { STATIC_PAGES, NOINDEX } from "./site";

export type PublicPage={path:string;title:string;description:string;modified?:string};
const slugPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const description=(row:Row)=>String(row.summary??'').trim()||`Discover ${String(row.title)} on Adam Wisher's portfolio.`;
function appPage(row:Row):PublicPage{return {path:`/apps/${row.slug}`,title:`${row.title} | Adam Wisher`,description:description(row),modified:String(row.updated_at)};}
function projectPage(row:Row):PublicPage{return {path:`/work/${row.slug}`,title:String(row.seo_title||`${row.title} — Adam Wisher`),description:String(row.seo_description||description(row)),modified:String(row.updated_at)};}
function changelogPage(app:Row,releases:Row[]):PublicPage{return {path:`/apps/${app.slug}/changelog`,title:`${app.title} — Release history | Adam Wisher`,description:`Published releases and updates for ${app.title}.`,modified:[app,...releases].map(r=>String(r.updated_at)).sort().at(-1)};}
const historyPage:PublicPage={path:'/history',title:'History — Adam Wisher',description:'Published milestones across product work, education, and professional experience.'};
const appsPage:PublicPage={path:'/apps',title:'Apps & Tools — Adam Wisher',description:'Explore published apps, tools, and digital products by Adam Wisher.'};

// Route existence/visibility is resolved before looking up SEO overrides. An
// override cannot turn a private, missing or unpublished entity into a page.
export async function resolvePublicPage(path:string):Promise<PublicPage|null>{
 if(path.length>400||(path!=='/'&&!/^\/[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(path)))return null;
 if(Object.hasOwn(STATIC_PAGES,path))return {path,...STATIC_PAGES[path]};
 if(path==='/apps')return await publicFlag('show_apps')?appsPage:null;
 if(path==='/history'){
  if(process.env.PUBLIC_CONTENT_SOURCE!=='database'||!await publicFlag('show_history'))return null;
  const events=await publishedRows('timeline_events');return events.length?{...historyPage,modified:events.map(e=>String(e.updated_at)).sort().at(-1)}:null;
 }
 const match=/^\/(apps|work)\/([^/]+)(\/changelog)?$/.exec(path);
 if(!match||!slugPattern.test(match[2]))return null;
 const [,kind,slug,changelog]=match;
 if(kind==='work'){
  if(changelog||process.env.PUBLIC_CONTENT_SOURCE!=='database')return null;
  const row=(await store.query("SELECT slug,title,summary,seo_title,seo_description,updated_at FROM projects WHERE slug=$1 AND status='PUBLISHED' AND visibility='PUBLIC' AND deleted_at IS NULL",[slug]))[0];
  return row?projectPage(row):null;
 }
 if(process.env.PUBLIC_CONTENT_SOURCE!=='database'||!await publicFlag('show_apps'))return null;
 const app=(await publishedRows('products')).find(row=>row.slug===slug);
 if(!app)return null;
 if(!changelog)return appPage(app);
 if(process.env.PUBLIC_CONTENT_SOURCE!=='database')return null;
 const releases=(await publishedRows('releases')).filter(r=>r.product_id===app.id);
 return releases.length?changelogPage(app,releases):null;
}
export async function metadataForPath(path:string):Promise<Metadata>{
 const page=await resolvePublicPage(path);
 return page?publicSeo(path,{title:page.title,description:page.description}):{...NOINDEX,title:'Page unavailable — Adam Wisher'};
}

export async function sitemapPages():Promise<PublicPage[]>{
 const pages:PublicPage[]=Object.entries(STATIC_PAGES).map(([path,value])=>({path,...value}));
 // Managed route discovery is opt-in. Default static sitemap generation does
 // not initialize a database or require migrations/credentials.
 if(process.env.PUBLIC_CONTENT_SOURCE==='database'){
  if(await publicFlag('show_apps')){
   pages.push(appsPage);
   const apps=await publishedRows('products'),releases=await publishedRows('releases');
   for(const app of apps){if(!slugPattern.test(String(app.slug)))continue;pages.push(appPage(app));const related=releases.filter(r=>r.product_id===app.id);if(related.length)pages.push(changelogPage(app,related));}
  }
  const projects=await store.query("SELECT slug,title,summary,seo_title,seo_description,updated_at FROM projects WHERE status='PUBLISHED' AND visibility='PUBLIC' AND deleted_at IS NULL");
  for(const project of projects)if(slugPattern.test(String(project.slug))&&!STATIC_PAGES[`/work/${project.slug}`])pages.push(projectPage(project));
  const history=await resolvePublicPage('/history');if(history)pages.push(history);
  const excluded=new Set((await store.query('SELECT path FROM seo_metadata WHERE indexable=FALSE AND deleted_at IS NULL')).map(row=>row.path));
  return pages.filter(page=>!excluded.has(page.path));
 }
 return pages;
}
