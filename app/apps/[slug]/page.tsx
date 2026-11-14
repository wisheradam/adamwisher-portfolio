import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { store } from "@/lib/admin/db";
import { ProductView } from "@/components/admin/product-view";
export const dynamic="force-dynamic";export const runtime="nodejs";
async function published(slug:string){return (await store.query("SELECT id,slug,title,type,summary,body,website_url FROM products WHERE slug=$1 AND status='PUBLISHED' AND visibility='PUBLIC' AND deleted_at IS NULL",[slug]))[0];}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const product=await published((await params).slug);if(!product)return {robots:{index:false}};return {title:`${product.title} | Adam Wisher`,description:String(product.summary).slice(0,160),alternates:{canonical:`https://adamwisher.com/apps/${product.slug}`}};}
export default async function AppPage({params}:{params:Promise<{slug:string}>}){const product=await published((await params).slug);if(!product)notFound();const publishedReleases=process.env.PUBLIC_CONTENT_SOURCE==="database"?await store.query("SELECT id FROM releases WHERE product_id=$1 AND status='PUBLISHED' AND visibility='PUBLIC' AND deleted_at IS NULL LIMIT 1",[product.id]):[];return <ProductView product={product} changelogHref={publishedReleases.length?`/apps/${product.slug}/changelog`:undefined}/>;}
