import type { MetadataRoute } from "next";
import { sitemapPages } from "@/lib/seo/public-pages";
import { canonicalUrl } from "@/lib/seo/site";
export const dynamic='force-dynamic';
export const runtime='nodejs';
export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 return (await sitemapPages()).map(page=>({url:canonicalUrl(page.path),...(page.modified&&!Number.isNaN(Date.parse(page.modified))?{lastModified:new Date(page.modified)}:{})}));
}
