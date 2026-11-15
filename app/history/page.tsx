import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { publicFlag } from "@/lib/admin/public-flags";
import { publishedRows } from "@/lib/admin/publication";
export const dynamic="force-dynamic";export const runtime="nodejs";
export default async function History(){if(process.env.PUBLIC_CONTENT_SOURCE!=="database"||!await publicFlag("show_history"))notFound();const events=(await publishedRows("timeline_events")).sort((a,b)=>String(b.event_date).localeCompare(String(a.event_date))||String(a.id).localeCompare(String(b.id)));if(!events.length)notFound();return <main className="page-shell route-page"><SiteHeader/><section className="py-16"><h1 className="font-display text-4xl">History</h1><ol className="mt-8 space-y-5">{events.map((event,i)=><li key={i} className="rounded-lg border border-border bg-surface p-6"><p className="font-mono text-xs text-muted-foreground">{event.event_date} · {String(event.event_type).replaceAll("_"," ")}</p><h2 className="mt-2 text-xl">{event.title}</h2><p className="mt-3 text-muted-foreground">{event.description}</p></li>)}</ol></section></main>;}
