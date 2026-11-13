import { randomUUID } from "node:crypto";
import { db } from "./db";

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
export function list(kind: Kind, search: string, offset: number) {
  return db().prepare(`SELECT * FROM ${kind} WHERE deleted_at IS NULL AND (title LIKE ? OR slug LIKE ?) ORDER BY updated_at DESC LIMIT 25 OFFSET ?`).all(`%${search}%`,`%${search}%`,offset);
}
export function get(kind: Kind, id: string) {
  return db().prepare(`SELECT * FROM ${kind} WHERE id=? AND deleted_at IS NULL`).get(id) as Record<string, unknown> | undefined;
}
export function write(kind: Kind, data: Record<string,string|number|null>, actor: string, id?: string) {
  const database = db(); const now = new Date().toISOString();
  return database.transaction(() => {
    const before = id ? get(kind,id) : undefined;
    if (id && !before) throw new Error("Not found");
    const entityId = id ?? randomUUID();
    const values: Record<string, unknown> = { ...(before ?? {}), ...data, id: entityId, created_at: before?.created_at ?? now, updated_at: now, updated_by: actor };
    if (!values.slug || !values.title || (kind === "products" && !values.type)) throw new Error("Slug, title and type are required");
    const columns = Object.keys(values).filter(k => ["id","created_at","updated_at","updated_by",...fields[kind]].includes(k));
    database.prepare(`INSERT INTO ${kind} (${columns.join(",")}) VALUES (${columns.map(()=>"?").join(",")}) ON CONFLICT(id) DO UPDATE SET ${columns.filter(k=>k!=="id").map(k=>`${k}=excluded.${k}`).join(",")}`).run(...columns.map(k=>values[k]));
    if (kind === "projects" && data.status === "PUBLISHED") database.prepare("UPDATE projects SET published_at=COALESCE(published_at,?) WHERE id=?").run(now,entityId);
    database.prepare("INSERT INTO audit_events VALUES (?,?,?,?,?,?,?,?)").run(randomUUID(),actor,before?"UPDATED":"CREATED",kind,entityId,JSON.stringify(before ?? null),JSON.stringify(get(kind,entityId)),now);
    return get(kind,entityId);
  })();
}
export function remove(kind: Kind, id: string, actor: string) {
  const database=db(); const before=get(kind,id); if (!before) return false;
  database.transaction(() => {
    database.prepare(`UPDATE ${kind} SET deleted_at=?, updated_at=?, updated_by=? WHERE id=?`).run(new Date().toISOString(),new Date().toISOString(),actor,id);
    database.prepare("INSERT INTO audit_events VALUES (?,?,?,?,?,?,?,?)").run(randomUUID(),actor,"SOFT_DELETED",kind,id,JSON.stringify(before),null,new Date().toISOString());
  })(); return true;
}
