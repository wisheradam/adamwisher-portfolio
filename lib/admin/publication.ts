import "server-only";
import { store, type Query, type Row } from "./db";

export const publicationTables = ['experience','education_records','certifications','products','releases','timeline_events'] as const;
export type PublicationTable = typeof publicationTables[number];
export function hasPublication(table:string):table is PublicationTable{return publicationTables.includes(table as PublicationTable);}
const content = (row:Row) => Object.fromEntries(Object.entries(row).filter(([key])=>!['status','published_at','updated_at','updated_by','publication_state'].includes(key)).sort(([a],[b])=>a.localeCompare(b)));
export async function publicationState(table:string,rows:Row[]):Promise<Row[]> {
 if(!hasPublication(table)||!rows.length)return rows;
 const snapshots=await store.query('SELECT entity_id,payload FROM publication_snapshots WHERE entity_type=$1',[table]);
 const byId=new Map(snapshots.map(s=>[s.entity_id,JSON.parse(String(s.payload)) as Row]));
 return rows.map(row=>{const published=byId.get(row.id);return {...row,publication_state:!published?'Unpublished':JSON.stringify(content(row))===JSON.stringify(content(published))?'Published':'Published with unpublished changes'};});
}
// Called only inside the working-row transaction, after validation and row locking.
// DRAFT/REVIEW saves leave the existing public snapshot untouched. ARCHIVED is
// the explicit unpublish command; PUBLISHED explicitly promotes submitted data.
export async function syncPublication(query:Query,table:string,row:Row,requested:unknown,actor:string):Promise<string|undefined>{
 if(!hasPublication(table))return;
 const prior=(await query('SELECT revision FROM publication_snapshots WHERE entity_type=$1 AND entity_id=$2',[table,row.id]))[0];
 if(requested==='ARCHIVED'){
  await query('DELETE FROM publication_snapshots WHERE entity_type=$1 AND entity_id=$2',[table,row.id]);return prior?'UNPUBLISHED':'UNPUBLISH_UNCHANGED';
 }
 if(requested!=='PUBLISHED')return 'DRAFT_SAVED';
 const now=new Date().toISOString();
 await query('INSERT INTO publication_snapshots(entity_type,entity_id,payload,published_at,published_by) VALUES($1,$2,$3,$4,$5) ON CONFLICT(entity_type,entity_id) DO UPDATE SET payload=excluded.payload,published_at=excluded.published_at,published_by=excluded.published_by,revision=publication_snapshots.revision+1',[table,row.id,JSON.stringify(row),now,actor]);
 const history=(await query("SELECT id FROM audit_events WHERE entity_type=$1 AND entity_id=$2 AND action IN ('PUBLISHED','PUBLICATION_UPDATED','REPUBLISHED','UNPUBLISHED') LIMIT 1",[table,row.id])).length;
 return prior?'PUBLICATION_UPDATED':history?'REPUBLISHED':'PUBLISHED';
}
// No process cache. Public routes are dynamic; the next request observes the
// committed snapshot. Parent visibility is checked against public snapshots too.
export async function publishedRows(table:PublicationTable):Promise<Row[]>{
 const result=await store.query('SELECT payload FROM publication_snapshots WHERE entity_type=$1',[table]);
 let rows=result.map(s=>JSON.parse(String(s.payload)) as Row).filter(r=>r.visibility==='PUBLIC'&&!r.deleted_at);
 if(table==='releases'||table==='timeline_events'){
  const products=new Set((await publishedRows('products')).map(r=>r.id));
  const releases=table==='timeline_events'?new Set((await publishedRows('releases')).map(r=>r.id)):undefined;
  const projects=new Set((await store.query("SELECT id FROM projects WHERE status='PUBLISHED' AND visibility='PUBLIC' AND deleted_at IS NULL")).map(r=>r.id));
  rows=rows.filter(r=>(!r.product_id||products.has(r.product_id))&&(!r.project_id||projects.has(r.project_id))&&(!r.release_id||releases?.has(r.release_id)));
 }
 return rows;
}
