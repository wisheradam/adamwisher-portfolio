import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import type { Row } from "@/lib/admin/db";
export function ProductView({product}:{product:Row}){
  return <main className="page-shell route-page"><SiteHeader/><article className="reading-surface my-12"><p className="font-mono text-xs uppercase tracking-widest">{String(product.type).replaceAll("_"," ")}</p><h1 className="mt-4 text-4xl font-medium">{product.title}</h1><p className="mt-6 text-lg">{product.summary}</p><div className="mt-10 whitespace-pre-wrap leading-relaxed">{product.body}</div>{product.website_url&&<p className="mt-8"><Link href={String(product.website_url)} rel="noopener noreferrer">Product website</Link></p>}</article></main>;
}
