import "server-only";
import type { Metadata } from "next";
import { store } from "./db";
export async function publicSeo(path:string,defaults:Metadata):Promise<Metadata>{
 if(process.env.PUBLIC_CONTENT_SOURCE!=="database")return defaults;
 const row=(await store.query("SELECT seo_title,meta_description,canonical_url,og_title,og_description,indexable,followable FROM seo_metadata WHERE path=$1 AND deleted_at IS NULL",[path]))[0];
 if(!row)return defaults;
 const canonical=row.canonical_url?String(row.canonical_url):`https://adamwisher.com${path}`;
 return {...defaults,title:row.seo_title?String(row.seo_title):defaults.title,description:row.meta_description?String(row.meta_description):defaults.description,alternates:{...defaults.alternates,canonical},openGraph:{...defaults.openGraph,title:row.og_title?String(row.og_title):row.seo_title?String(row.seo_title):undefined,description:row.og_description?String(row.og_description):row.meta_description?String(row.meta_description):undefined},robots:{index:row.indexable===true,follow:row.followable===true}};
}
