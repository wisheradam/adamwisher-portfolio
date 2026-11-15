import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { PGlite } from '@electric-sql/pglite';

if(process.env.ADMIN_DATABASE_DRIVER && process.env.ADMIN_DATABASE_DRIVER!=='pglite')throw new Error('Knowledge import requires an isolated local PGlite database');
if(!process.env.ADMIN_DB_PATH)throw new Error('Set ADMIN_DB_PATH to an isolated review database');
function source(name){const file=path.join(process.cwd(),'data','knowledge',`${name}.ts`);const js=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const sandbox={exports:{}};vm.runInNewContext(js,sandbox,{filename:file,timeout:1000});return sandbox.exports[name];}
function uuid(seed){const h=createHash('sha256').update(`adamwisher:knowledge:${seed}`).digest('hex');return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-a${h.slice(17,20)}-${h.slice(20,32)}`;}
function date(value){if(!value||value==='present')return null;return value;}
const specifications=[
 {name:'experience',table:'experience',records:source('experience'),fields:r=>({company:r.organization,title:r.title,location:r.location??null,start_date:date(r.period?.from),end_date:date(r.period?.to),is_current:r.period?.to==='present',description:r.summary??null,achievements:r.facts?.join('\n')??null,technologies:r.skills?.join(', ')??null})},
 {name:'education',table:'education_records',records:source('education'),fields:r=>({institution:r.organization,program:r.title,start_date:date(r.period?.from),end_date:date(r.period?.to),description:r.summary??null})},
 {name:'certifications',table:'certifications',records:source('certifications'),fields:r=>({title:r.title,issuer:r.organization,credential_type:r.learningType??'Other learning activity',completion_date:date(r.period?.to),description:r.summary??null,skills:r.skills?.join(', ')??null})},
];
const db=await PGlite.create(process.env.ADMIN_DB_PATH),now=new Date().toISOString();
try{
 const admins=(await db.query("SELECT id FROM admin_users WHERE role='SUPER_ADMIN' AND active=TRUE ORDER BY created_at LIMIT 1")).rows;
 if(!admins.length)throw new Error('Bootstrap a local Super Admin before importing');
 const actor=admins[0].id,report=[];
 await db.transaction(async tx=>{
  for(const spec of specifications){let created=0,preserved=0;for(const [index,record] of spec.records.entries()){
   if(!record.public)continue;
   const id=uuid(record.id),fields=spec.fields(record),values={id,...fields,sort_order:index,status:'PUBLISHED',visibility:'PUBLIC',published_at:now,created_at:now,updated_at:now,updated_by:actor};
   const keys=Object.keys(values);const result=await tx.query(`INSERT INTO ${spec.table}(${keys.join(',')}) VALUES(${keys.map((_,i)=>`$${i+1}`).join(',')}) ON CONFLICT(id) DO NOTHING RETURNING *`,Object.values(values));
   if(result.rows.length)await tx.query('INSERT INTO publication_snapshots(entity_type,entity_id,payload,published_at,published_by) VALUES($1,$2,$3,$4,$5)',[spec.table,id,JSON.stringify(result.rows[0]),now,actor]);
   result.rows.length?created++:preserved++;
  }report.push({entity:spec.name,source:spec.records.filter(r=>r.public).length,created,preserved});}
 });
 let differences=0;
 for(const spec of specifications){for(const record of spec.records.filter(r=>r.public)){const row=(await db.query(`SELECT * FROM ${spec.table} WHERE id=$1`,[uuid(record.id)])).rows[0];if(!row){differences++;continue;}const fields={...spec.fields(record),sort_order:spec.records.indexOf(record),visibility:'PUBLIC',status:'PUBLISHED'};if(Object.entries(fields).some(([key,value])=>row[key]!==value))differences++;}}
 const fingerprint=createHash('sha256').update(specifications.flatMap(s=>s.records.filter(r=>r.public).map(r=>r.id)).join('\n')).digest('hex');
 const unresolved=specifications.flatMap(spec=>spec.records.filter(r=>r.public).flatMap(r=>r.evidence.filter(e=>!e.locator).map(e=>({sourceId:r.id,field:'evidence.locator',reason:'Source evidence has no public URL',label:e.label}))));
 console.log(JSON.stringify({report,unresolved,differences,cutoverReady:differences===0,fingerprint},null,2));
 if(differences)process.exitCode=1;
}finally{await db.close();}
