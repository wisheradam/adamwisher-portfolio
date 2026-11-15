import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { publishedRows } from "@/lib/admin/publication";
import { publicSeo } from "@/lib/admin/public-seo";
import { ProductView } from "@/components/admin/product-view";
export const dynamic="force-dynamic";export const runtime="nodejs";
async function published(slug:string){return (await publishedRows("products")).find(row=>row.slug===slug);}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const product=await published((await params).slug);if(!product)return {robots:{index:false}};return publicSeo(`/apps/${product.slug}`,{title:`${product.title} | Adam Wisher`,description:String(product.summary).slice(0,160),alternates:{canonical:`https://adamwisher.com/apps/${product.slug}`}});}
export default async function AppPage({params}:{params:Promise<{slug:string}>}){const product=await published((await params).slug);if(!product)notFound();const publishedReleases=process.env.PUBLIC_CONTENT_SOURCE==="database"?(await publishedRows("releases")).filter(row=>row.product_id===product.id):[];return <ProductView product={product} changelogHref={publishedReleases.length?`/apps/${product.slug}/changelog`:undefined}/>;}
