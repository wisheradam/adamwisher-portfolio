import { metadataForPath } from "@/lib/seo/public-pages";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { publishedRows } from "@/lib/admin/publication";
export const dynamic="force-dynamic";export const runtime="nodejs";
async function records(slug:string){if(process.env.PUBLIC_CONTENT_SOURCE!=="database")return null;const product=(await publishedRows("products")).find(row=>row.slug===slug);if(!product)return null;const releases=(await publishedRows("releases")).filter(row=>row.product_id===product.id).sort((a,b)=>String(b.release_date??b.created_at).localeCompare(String(a.release_date??a.created_at)));return releases.length?{product,releases}:null;}
export default async function Changelog({params}:{params:Promise<{slug:string}>}){const data=await records((await params).slug);if(!data)notFound();return <main className="page-shell route-page"><SiteHeader/><section className="py-16"><Link href={`/apps/${data.product.slug}`}>← {data.product.title}</Link><h1 className="mt-8 font-display text-4xl">Release history</h1><div className="mt-8 space-y-5">{data.releases.map((r,i)=><article key={i} className="rounded-lg border border-border bg-surface p-6"><h2 className="text-xl">{r.title} · {r.version}</h2><p className="text-sm text-muted-foreground">{r.release_date} {r.platform}</p><p className="mt-4 whitespace-pre-wrap">{r.notes}</p></article>)}</div></section></main>;}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){return metadataForPath(`/apps/${(await params).slug}/changelog`);}
