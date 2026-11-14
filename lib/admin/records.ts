import { randomUUID } from "node:crypto";
import { store, type Query } from "./db";

export type Kind = "projects" | "products";
export const kinds: Kind[] = ["projects", "products"];
const fields: Record<Kind, string[]> = {
  projects: ["slug","title","summary","body","category","role","status","visibility","featured","sort_order","seo_title","seo_description"],
  products: ["slug","title","type","summary","body","status","visibility","version","website_url","github_url","featured"],
};
const statuses: Record<Kind, string[]> = {
  projects: ["DRAFT","REVIEW","PUBLISHED","ARCHIVED"],
  products: ["CONCEPT","DEVELOPMENT","BETA","RELEASED","PAUSED","ARCHIVED"],
};
export function isKind(value: string): value is Kind { return kinds.includes(value as Kind); }
export function validate(kind: Kind, raw: unknown): Record<string, string | number | null> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Invalid record");
  const input = raw as Record<string, unknown>;
  const output: Record<string, string | number | null> = {};
  for (const field of fields[kind]) {
    if (!(field in input)) continue;
    const value = input[field];
    if (field === "featured" || field === "sort_order") {
      if (!Number.isSafeInteger(value) || Number(value) < 0 || Number(value) > 100000) throw new Error(`Invalid ${field}`);
      output[field] = Number(value); continue;
    }
    if (value !== null && (typeof value !== "string" || value.length > (field === "body" ? 50000 : 1000))) throw new Error(`Invalid ${field}`);
    output[field] = value as string | null;
  }
  if (typeof output.slug === "string" && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(output.slug)) throw new Error("Invalid slug");
  if (kind === "projects" && typeof output.slug === "string" && ["single-source-of-truth","check2go","innova-knowledge-base","business-systems-transformation","ai-support-assistant","prescription-medication-marketplace"].includes(output.slug)) throw new Error("This route is reserved for an existing case study");
  if (typeof output.title === "string" && !output.title.trim()) throw new Error("Title is required");
  if (typeof output.status === "string" && !statuses[kind].includes(output.status)) throw new Error("Invalid status");
  if (output.visibility !== undefined && !["PUBLIC","PRIVATE"].includes(String(output.visibility))) throw new Error("Invalid visibility");
  if (output.type && !["MOBILE_APP","WEB_APP","AI_TOOL","INTERNAL_TOOL","SAAS","PROTOTYPE","EXPERIMENT"].includes(String(output.type))) throw new Error("Invalid type");
  for (const field of ["website_url","github_url"]) if (output[field]) {
    try { if (new URL(String(output[field])).protocol !== "https:") throw new Error(); }
    catch { throw new Error(`Invalid ${field}`); }
  }
  return output;
}
export async function list(kind: Kind, search: string, offset: number) {
  const columns = kind === "products" ? "id,slug,title,summary,status,visibility,updated_at,type" : "id,slug,title,summary,status,visibility,updated_at";
  return store.query(`SELECT ${columns} FROM ${kind} WHERE deleted_at IS NULL AND (title ILIKE $1 OR slug ILIKE $1) ORDER BY updated_at DESC LIMIT 25 OFFSET $2`, [`%${search}%`,offset]);
}
export async function get(kind: Kind, id: string) {
  return (await store.query(`SELECT * FROM ${kind} WHERE id=$1 AND deleted_at IS NULL`,[id]))[0];
}
export async function write(kind: Kind, data: Record<string,string|number|null>, actor: string, id?: string) {
  const now = new Date().toISOString();
  return store.transaction(async query => {
    const before = id ? (await query(`SELECT * FROM ${kind} WHERE id=$1 AND deleted_at IS NULL FOR UPDATE`,[id]))[0] : undefined;
    if (id && !before) throw new Error("Not found");
    const entityId = id ?? randomUUID();
    const values: Record<string, string|number|boolean|null> = { ...(before ?? {}), ...data, id: entityId, created_at: before?.created_at ?? now, updated_at: now, updated_by: actor };
    if (!values.slug || !values.title || (kind === "products" && !values.type)) throw new Error("Slug, title and type are required");
    const columns = Object.keys(values).filter(k => ["id","created_at","updated_at","updated_by","published_at",...fields[kind]].includes(k));
    if(kind==="projects" && data.status==="PUBLISHED" && !before?.published_at) {values.published_at=now;if(!columns.includes("published_at"))columns.push("published_at");}
    const placeholders=columns.map((_,i)=>`$${i+1}`);
    const after=(await query(`INSERT INTO ${kind} (${columns.join(",")}) VALUES (${placeholders.join(",")}) ON CONFLICT(id) DO UPDATE SET ${columns.filter(k=>k!=="id").map(k=>`${k}=excluded.${k}`).join(",")} RETURNING *`,columns.map(k=>values[k])))[0];
    await audit(query,actor,before?"UPDATED":"CREATED",kind,entityId,before??null,after);
    return after;
  });
}
async function audit(query:Query,actor:string,action:string,kind:Kind,id:string,before:unknown,after:unknown) {
  await query("INSERT INTO audit_events (id,actor_id,action,entity_type,entity_id,before_state,after_state,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)",
    [randomUUID(),actor,action,kind,id,JSON.stringify(before),JSON.stringify(after),new Date().toISOString()]);
}
export async function remove(kind: Kind, id: string, actor: string) {
  return store.transaction(async query=>{
    const before=(await query(`SELECT * FROM ${kind} WHERE id=$1 AND deleted_at IS NULL FOR UPDATE`,[id]))[0];if(!before)return false;
    const now=new Date().toISOString();
    await query(`UPDATE ${kind} SET deleted_at=$1, updated_at=$1, updated_by=$2 WHERE id=$3`,[now,actor,id]);
    await audit(query,actor,"SOFT_DELETED",kind,id,before,null);return true;
  });
}
