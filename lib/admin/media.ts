import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir,writeFile,readFile,unlink } from "node:fs/promises";
import path from "node:path";
import { store,type Query } from "./db";
export class MediaError extends Error{constructor(message:string,public status=400){super(message);}}
const types:Record<string,string>={"image/png":"png","image/jpeg":"jpg","image/webp":"webp","application/pdf":"pdf"};
const max=10*1024*1024;
function root(){if(process.env.ADMIN_DATABASE_DRIVER==="aurora-data-api")throw new MediaError("Durable media storage is not configured for this environment",503);return path.resolve(process.env.ADMIN_MEDIA_PATH??path.join(process.cwd(),".data","admin-media"));}
export function inspectMedia(name:string,mime:string,bytes:Uint8Array){
 if(!name||name.length>180||name.includes("/")||name.includes("\\")||/[\x00-\x1f]/.test(name))throw new MediaError("Invalid filename");
 const ext=types[mime];if(!ext||!name.toLowerCase().endsWith(`.${ext}`)&&!(mime==="image/jpeg"&&name.toLowerCase().endsWith(".jpeg")))throw new MediaError("Unsupported file type");
 if(bytes.length<(mime==="image/png"?24:12)||bytes.length>max)throw new MediaError("File must be between 12 bytes and 10 MB");
 const magic=mime==="image/png"?bytes.slice(0,8).every((b,i)=>b===[137,80,78,71,13,10,26,10][i]):mime==="image/jpeg"?bytes[0]===255&&bytes[1]===216&&bytes[2]===255&&bytes[bytes.length-2]===255&&bytes[bytes.length-1]===217:mime==="image/webp"?Buffer.from(bytes).toString("ascii",0,4)==="RIFF"&&Buffer.from(bytes).toString("ascii",8,12)==="WEBP":Buffer.from(bytes).toString("ascii",0,5)==="%PDF-";
 if(!magic)throw new MediaError("File content does not match its type");
 return {ext,width:mime==="image/png"?Buffer.from(bytes).readUInt32BE(16):null,height:mime==="image/png"?Buffer.from(bytes).readUInt32BE(20):null};
}
const refs=["experience:company_logo_media_id","education_records:media_id","certifications:certificate_media_id","releases:media_id","timeline_events:media_id","seo_metadata:og_image_media_id"] as const;
async function usage(query:Query,id:string){const found=[];for(const entry of refs){const [table,column]=entry.split(":");const rows=await query(`SELECT COUNT(*) AS count FROM ${table} WHERE ${column}=$1 AND deleted_at IS NULL`,[id]);if(Number(rows[0].count)>0)found.push(`${table}: ${rows[0].count}`);}const published=await query("SELECT COUNT(*) AS count FROM publication_snapshots WHERE payload::jsonb->>'company_logo_media_id'=$1 OR payload::jsonb->>'media_id'=$1 OR payload::jsonb->>'certificate_media_id'=$1",[id]);if(Number(published[0].count)>0)found.push(`Published snapshots: ${published[0].count}`);return found;}
export async function mediaUsage(id:string){root();return usage(store.query,id);}
export async function listMedia(search:string,page:number){root();return store.query("SELECT id,original_filename,display_name,mime_type,file_size,width,height,alt_text,caption,created_at,updated_at FROM media_assets WHERE deleted_at IS NULL AND display_name ILIKE $1 ORDER BY created_at DESC LIMIT 25 OFFSET $2",[`%${search}%`,page*25]);}
export async function getMedia(id:string){root();return (await store.query("SELECT * FROM media_assets WHERE id=$1 AND deleted_at IS NULL",[id]))[0];}
export async function getMediaFile(id:string){const row=await getMedia(id);if(!row)throw new MediaError("Not found",404);return {row,bytes:await readFile(path.join(root(),String(row.storage_key)))};}
export async function saveMedia(file:File,actor:string,existingId?:string){const bytes=new Uint8Array(await file.arrayBuffer()),info=inspectMedia(file.name,file.type,bytes),key=`${randomUUID()}.${info.ext}`,dir=root(),now=new Date().toISOString(),id=existingId??randomUUID();await mkdir(dir,{recursive:true});await writeFile(path.join(dir,key),bytes,{flag:"wx",mode:0o600});
 try{const old=await store.transaction(async query=>{
   const before=existingId?(await query("SELECT * FROM media_assets WHERE id=$1 AND deleted_at IS NULL FOR UPDATE",[existingId]))[0]:undefined;
   if(existingId&&!before)throw new MediaError("Not found",404);
   const record=(await query("INSERT INTO media_assets(id,storage_key,original_filename,display_name,mime_type,file_size,width,height,alt_text,caption,created_at,updated_at,uploaded_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11,$12) ON CONFLICT(id) DO UPDATE SET storage_key=excluded.storage_key,original_filename=excluded.original_filename,mime_type=excluded.mime_type,file_size=excluded.file_size,width=excluded.width,height=excluded.height,updated_at=excluded.updated_at RETURNING *",[id,key,file.name,before?.display_name??file.name,file.type,bytes.length,info.width,info.height,before?.alt_text??"",before?.caption??"",now,actor]))[0];
   await query("INSERT INTO audit_events(id,actor_id,action,entity_type,entity_id,before_state,after_state,created_at) VALUES($1,$2,$3,'media_assets',$4,$5,$6,$7)",[randomUUID(),actor,before?"REPLACED":"CREATED",id,JSON.stringify(before??null),JSON.stringify(record),now]);return before;
  });
  if(old?.storage_key)await unlink(path.join(dir,String(old.storage_key))).catch(()=>{});
  return getMedia(id);
 }catch(e){await unlink(path.join(dir,key)).catch(()=>{});throw e;}
}
export async function editMedia(id:string,actor:string,raw:unknown){root();if(!raw||typeof raw!=="object")throw new MediaError("Invalid metadata");const input=raw as Record<string,unknown>,data:Record<string,string>={};for(const key of ["display_name","alt_text","caption"]){if(key in input){if(typeof input[key]!=="string"||input[key].length>1000)throw new MediaError(`Invalid ${key}`);data[key]=input[key];}}if(!Object.keys(data).length)throw new MediaError("No metadata supplied");return store.transaction(async query=>{
 const before=(await query("SELECT * FROM media_assets WHERE id=$1 AND deleted_at IS NULL FOR UPDATE",[id]))[0];if(!before)throw new MediaError("Not found",404);
 const columns=Object.keys(data),now=new Date().toISOString();const after=(await query(`UPDATE media_assets SET ${columns.map((c,i)=>`${c}=$${i+1}`).join(",")},updated_at=$${columns.length+1} WHERE id=$${columns.length+2} RETURNING *`,[...Object.values(data),now,id]))[0];
 await query("INSERT INTO audit_events(id,actor_id,action,entity_type,entity_id,before_state,after_state,created_at) VALUES($1,$2,'UPDATED','media_assets',$3,$4,$5,$6)",[randomUUID(),actor,id,JSON.stringify(before),JSON.stringify(after),now]);return after;
 });}
export async function deleteMedia(id:string,actor:string){root();return store.transaction(async query=>{const before=(await query("SELECT * FROM media_assets WHERE id=$1 AND deleted_at IS NULL FOR UPDATE",[id]))[0];if(!before)throw new MediaError("Not found",404);const references=await usage(query,id);if(references.length)throw new MediaError(`Asset is referenced by ${references.join(", ")}`,409);const now=new Date().toISOString();await query("UPDATE media_assets SET deleted_at=$1,updated_at=$1 WHERE id=$2",[now,id]);await query("INSERT INTO audit_events(id,actor_id,action,entity_type,entity_id,before_state,after_state,created_at) VALUES($1,$2,'DELETED','media_assets',$3,$4,NULL,$5)",[randomUUID(),actor,id,JSON.stringify(before),now]);return true;});}
