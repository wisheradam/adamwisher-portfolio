import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { store } from "@/lib/admin/db";
export const dynamic="force-dynamic";export const runtime="nodejs";
export default async function AppsPage(){const products=await store.query("SELECT slug,title,type,summary FROM products WHERE status='PUBLISHED' AND visibility='PUBLIC' AND deleted_at IS NULL ORDER BY updated_at DESC LIMIT 100");return <main className="page-shell route-page"><SiteHeader/><section className="py-16"><h1 className="text-4xl font-medium">Apps & Tools</h1>{products.length?<div className="project-grid mt-10">{products.map(product=><article className="project-card project-copy" key={String(product.slug)}><p>{String(product.type).replaceAll("_"," ")}</p><h2>{product.title}</h2><p>{product.summary}</p><Link href={`/apps/${product.slug}`}>View app</Link></article>)}</div>:<p className="mt-8">No public apps yet.</p>}</section></main>;}
