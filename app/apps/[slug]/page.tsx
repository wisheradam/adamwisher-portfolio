import { metadataForPath } from "@/lib/seo/public-pages";
import { notFound } from "next/navigation";
import { publishedRows } from "@/lib/admin/publication";
import { ProductView } from "@/components/admin/product-view";
export const dynamic="force-dynamic";export const runtime="nodejs";
async function published(slug:string){if(process.env.PUBLIC_CONTENT_SOURCE!=="database")return undefined;return (await publishedRows("products")).find(row=>row.slug===slug);}
export default async function AppPage({params}:{params:Promise<{slug:string}>}){const product=await published((await params).slug);if(!product)notFound();const publishedReleases=process.env.PUBLIC_CONTENT_SOURCE==="database"?(await publishedRows("releases")).filter(row=>row.product_id===product.id):[];return <ProductView product={product} changelogHref={publishedReleases.length?`/apps/${product.slug}/changelog`:undefined}/>;}

export async function generateMetadata({params}:{params:Promise<{slug:string}>}){return metadataForPath(`/apps/${(await params).slug}`);}
