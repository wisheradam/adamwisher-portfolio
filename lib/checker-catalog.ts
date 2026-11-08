import "server-only";
import {createDecipheriv} from "node:crypto";
import {gunzipSync} from "node:zlib";
import payload from "@/data/checker/catalog.enc.json";

export type Row = {id:string;sku:string;model:string;family:string;description:string;price_raw:string;currency:string;page:number;notes:string[];issues:string[]};
let catalog:Row[]|undefined;
export function readCatalog():Row[] {
  if (catalog) return catalog;
  const key=process.env.CHECKER_PRIVATE_CATALOG_KEY;
  if (!key || !/^[0-9a-f]{64}$/.test(key)) throw new Error("Catalog key unavailable");
  const packed=Buffer.from(payload,"base64");
  const c=createDecipheriv("aes-256-gcm",Buffer.from(key,"hex"),packed.subarray(0,12));
  c.setAuthTag(packed.subarray(12,28));
  catalog=JSON.parse(gunzipSync(Buffer.concat([c.update(packed.subarray(28)),c.final()])).toString("utf8")) as Row[];
  return catalog;
}
