import "server-only";
import { randomUUID } from "node:crypto";
import { store } from "./db";
import { publicationState,syncPublication } from "./publication";
import { fieldsFor,isModule,modules,type ModuleName } from "./module-config";
import type { Query,Row } from "./db";
export { isModule,modules };
export class InputError extends Error{constructor(message:string,public status=400){super(message);}}
const work=new Set<ModuleName>(["experience","education","certifications","releases","timeline"]);
function safePath(value:string){return /^\/(?!\/)[a-zA-Z0-9/_-]*\/?$/.test(value)&&!(/^\/(admin|api|projects|_next)(\/|$)/i.test(value));}
export function validateModule(module:ModuleName,raw:unknown):Record<string,string|number|boolean|null>{
  if(!raw||typeof raw!=="object"||Array.isArray(raw))throw new InputError("Invalid record");
  const source=raw as Record<string,unknown>,result:Record<string,string|number|boolean|null>={};
  for(const field of fieldsFor(module)){
    if(!(field.name in source))continue;const value=source[field.name];
    if(field.type==="boolean"){if(typeof value!=="boolean")throw new InputError(`Invalid ${field.label}`);result[field.name]=value;continue;}
    if(field.type==="integer"){if(!Number.isInteger(value)||Number(value)<0||Number(value)>100000)throw new InputError(`Invalid ${field.label}`);result[field.name]=Number(value);continue;}
    if(value===null||value===""){if(field.required)throw new InputError(`${field.label} is required`);result[field.name]=null;continue;}
    const normalized=field.name==="status_code"&&typeof value==="number"?String(value):value;
    if(typeof normalized!=="string"||normalized.length>(field.type==="textarea"?20000:1000))throw new InputError(`Invalid ${field.label}`);
    if(field.type==="select"&&!field.options?.includes(normalized))throw new InputError(`Invalid ${field.label}`);
    if(field.type==="date"){const full=/^\d{4}-\d{2}$/.test(normalized)?`${normalized}-01`:normalized;const date=new Date(`${full}T00:00:00.000Z`);if(!/^\d{4}-\d{2}(-\d{2})?$/.test(normalized)||Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==full)throw new InputError(`Invalid ${field.label}`);}
    if(field.type==="url"){try{if(new URL(normalized).protocol!=="https:")throw new Error();}catch{throw new InputError(`Invalid ${field.label}`);}}
    if(field.type==="reference"&&!/^[a-f0-9-]{36}$/i.test(normalized))throw new InputError(`Invalid ${field.label}`);
    result[field.name]=normalized.trim();
  }
  if(module==="redirects"){
    const src=result.source_path,dest=result.destination_path;
    if(src!==undefined&&(!src||!safePath(String(src))))throw new InputError("Invalid source path");
    if(dest!==undefined&&(!dest||!safePath(String(dest))))throw new InputError("Destination must be a safe internal path");
  }
  if(module==="seo"){
    const page=result.path,canonical=result.canonical_url;
    if(page!==undefined&&(!page||!safePath(String(page))))throw new InputError("Invalid page path");
    if(page&&canonical&&canonical!==`https://adamwisher.com${page}`)throw new InputError("Canonical URL must match the existing page path");
  }
  return result;
}
async function ensureNoLoop(query:Query,source:string,destination:string,id?:string){
  if(source===destination)throw new InputError("A redirect cannot point to itself");
  const rows=await query("SELECT id,source_path,destination_path FROM redirects WHERE enabled=TRUE AND deleted_at IS NULL");
  const edges=new Map(rows.filter(row=>row.id!==id).map(row=>[String(row.source_path),String(row.destination_path)]));edges.set(source,destination);
  let current=destination;const seen=new Set<string>([source]);
  while(edges.has(current)){if(seen.has(current))throw new InputError("Redirect loop detected");seen.add(current);current=edges.get(current)!;}
}
export async function listModule(module:ModuleName,search:string,offset:number){const {table,primary}=modules[module];return publicationState(table,await store.query(`SELECT * FROM ${table} WHERE ${module==="feature-flags"?"TRUE":"deleted_at IS NULL"} AND ${primary} ILIKE $1 ORDER BY updated_at DESC LIMIT 25 OFFSET $2`,[`%${search}%`,offset]));}
export async function getModule(module:ModuleName,id:string){return (await store.query(`SELECT * FROM ${modules[module].table} WHERE id=$1 ${module==="feature-flags"?"":"AND deleted_at IS NULL"}`,[id]))[0];}
export async function writeModule(module:ModuleName,raw:unknown,actor:string,id?:string){
  const data=validateModule(module,raw),{table}=modules[module],now=new Date().toISOString();
  return store.transaction(async query=>{
    const before=id?(await query(`SELECT * FROM ${table} WHERE id=$1 FOR UPDATE`,[id]))[0]:undefined;
    if(before&&(raw as Record<string,unknown>).updated_at!==undefined&&(raw as Record<string,unknown>).updated_at!==before.updated_at)throw new InputError("Record changed. Reload before saving.",409);
    if(id&&!before)throw new InputError("Not found",404);
    const values:Row={...before,...data,id:id??randomUUID(),created_at:before?.created_at??now,updated_at:now,updated_by:actor};
    for(const field of fieldsFor(module))if(field.required&&!values[field.name])throw new InputError(`${field.label} is required`);
    if(work.has(module)){values.status??="DRAFT";values.visibility??="PRIVATE";values.published_at=values.status==="PUBLISHED"?(before?.published_at??now):null;}
    if(module==="releases"&&!values.product_id&&!values.project_id)throw new InputError("Select an App or Project for the release");
    if(module==="redirects"){
      values.enabled??=false;values.status_code??=302;
      if(values.enabled)await ensureNoLoop(query,String(values.source_path),String(values.destination_path),id);
    }
    if(module==="feature-flags")values.enabled??=false;
    if(module==="seo"){values.indexable??=true;values.followable??=true;if(values.canonical_url&&values.canonical_url!==`https://adamwisher.com${values.path}`)throw new InputError("Canonical URL must match the page path");}
    const columns=Object.keys(values).filter(key=>["id","created_at","updated_at","updated_by",...(work.has(module)?["published_at"]:[]),...fieldsFor(module).map(f=>f.name)].includes(key));
    const after=(await query(`INSERT INTO ${table}(${columns.join(",")}) VALUES(${columns.map((_,i)=>`$${i+1}`).join(",")}) ON CONFLICT(id) DO UPDATE SET ${columns.filter(key=>key!=="id").map(key=>`${key}=excluded.${key}`).join(",")} RETURNING *`,columns.map(key=>values[key])))[0];
    const publicationAction=await syncPublication(query,table,after,data.status,actor);
    await query("INSERT INTO audit_events(id,actor_id,action,entity_type,entity_id,before_state,after_state,created_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",[randomUUID(),actor,publicationAction??(before?"UPDATED":"CREATED"),table,String(after.id),JSON.stringify(before??null),JSON.stringify(after),now]);
    return after;
  });
}
export async function deleteModule(module:ModuleName,id:string,actor:string){const table=modules[module].table;return store.transaction(async query=>{
  const before=(await query(`SELECT * FROM ${table} WHERE id=$1 FOR UPDATE`,[id]))[0];if(!before)return false;
  await query("DELETE FROM publication_snapshots WHERE entity_type=$1 AND entity_id=$2",[table,id]);
  if(module==="feature-flags")await query("DELETE FROM feature_flags WHERE id=$1",[id]);
  else await query(`UPDATE ${table} SET deleted_at=$1,updated_at=$1,updated_by=$2 WHERE id=$3`,[new Date().toISOString(),actor,id]);
  await query("INSERT INTO audit_events(id,actor_id,action,entity_type,entity_id,before_state,after_state,created_at) VALUES($1,$2,'DELETED',$3,$4,$5,NULL,$6)",[randomUUID(),actor,table,id,JSON.stringify(before),new Date().toISOString()]);return true;
 });}
