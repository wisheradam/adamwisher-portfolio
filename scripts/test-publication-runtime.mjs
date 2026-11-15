import {PGlite} from '@electric-sql/pglite';
import {strict as assert} from 'node:assert';
import {readFileSync,readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
const require=createRequire(import.meta.url),db=new PGlite(),cache={};let assertions=0;
const query=async(sql,values=[])=>{return (await db.query(sql,values)).rows;};
const store={query,transaction:fn=>db.transaction(tx=>fn(async(sql,values=[])=>{return (await tx.query(sql,values)).rows;}))};
function load(name){if(cache[name])return cache[name];const exports={};cache[name]=exports;const code=ts.transpileModule(readFileSync(`lib/admin/${name}.ts`,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInNewContext(code,{exports,process,require:id=>id==='server-only'?{}:id==='./db'?{store}:id.startsWith('./')?load(id.slice(2)):require(id)},{filename:name});return exports;}
const equal=(a,b)=>{assert.equal(a,b);assertions++;};
try{
 for(const f of readdirSync('lib/admin/migrations').sort())await db.exec(readFileSync('lib/admin/migrations/'+f,'utf8'));
 const {writeModule,deleteModule}=load('module-records'),{write,remove}=load('records'),{publishedRows,publicationState}=load('publication');
 const samples=[['experience',{company:'Synthetic',title:'v1'}],['education',{institution:'Synthetic',program:'v1'}],['certifications',{issuer:'Synthetic',title:'v1',credential_type:'Professional certification'}],['products',{slug:'synthetic-runtime',type:'WEB_APP',title:'v1'}],['releases',{title:'v1',version:'1',product_id:null}],['timeline',{title:'v1',event_type:'MILESTONE',event_date:'2025-01-01'}]];
 let product;
 for(const [module,data] of samples){
  if(module==='releases')data.product_id=product.id;
  const table={education:'education_records',timeline:'timeline_events'}[module]??module,field=module==='education'?'program':'title';
  const save=(data,id)=>module==='products'?write('products',data,'actor',id):writeModule(module,data,'actor',id);
  const row=await save({...data,status:'DRAFT',visibility:'PUBLIC'});equal((await publishedRows(table)).length,0);
  const pub=await save({status:'PUBLISHED'},row.id);equal((await publishedRows(table))[0][field],'v1');
  await save({[field]:'v2',status:'DRAFT'},row.id);equal((await publishedRows(table))[0][field],'v1');
  equal((await publicationState(table,await query(`SELECT * FROM ${table} WHERE id=$1`,[row.id])))[0].publication_state,'Published with unpublished changes');
  for(const target of ['publication_snapshots','audit_events']){
   const column=target==='audit_events'?'actor_id':'published_by';
   await db.exec(`ALTER TABLE ${target} ADD CONSTRAINT reject_publication_test CHECK(${column}<>'actor') NOT VALID`);
   await assert.rejects(save({status:'PUBLISHED'},row.id),e=>e.code==='23514');assertions++;
   await db.exec(`ALTER TABLE ${target} DROP CONSTRAINT reject_publication_test`);
   equal((await publishedRows(table))[0][field],'v1');equal((await query(`SELECT status FROM ${table} WHERE id=$1`,[row.id]))[0].status,'DRAFT');
  }
  equal((await publishedRows(table))[0][field],'v1');equal((await query(`SELECT status FROM ${table} WHERE id=$1`,[row.id]))[0].status,'DRAFT');
  await save({status:'PUBLISHED'},row.id);equal((await publishedRows(table))[0][field],'v2');
  await save({status:'PUBLISHED'},row.id);equal((await publishedRows(table)).length,1);
  await db.exec("ALTER TABLE audit_events ADD CONSTRAINT reject_unpublish_test CHECK(actor_id<>'actor') NOT VALID");
  await assert.rejects(save({status:'ARCHIVED'},row.id),e=>e.code==='23514');assertions++;
  await db.exec('ALTER TABLE audit_events DROP CONSTRAINT reject_unpublish_test');
  equal((await publishedRows(table))[0][field],'v2');
  await save({status:'ARCHIVED'},row.id);equal((await publishedRows(table)).length,0);
  await save({status:'ARCHIVED'},row.id);equal((await publishedRows(table)).length,0);equal((await query(`SELECT ${field} FROM ${table} WHERE id=$1`,[row.id]))[0][field],'v2');
  await save({status:'PUBLISHED'},row.id);equal((await publishedRows(table))[0][field],'v2');
  await assert.rejects(save({[field]:'lost',updated_at:pub.updated_at},row.id),/Record changed/);assertions++;
  const events=(await query('SELECT action FROM audit_events WHERE entity_id=$1',[row.id])).map(e=>e.action);for(const action of ['DRAFT_SAVED','PUBLISHED','PUBLICATION_UPDATED','UNPUBLISHED','REPUBLISHED']){assert.ok(events.includes(action));assertions++;}
  if(module==='products'){product=row;continue;}
  if(module==='releases'){
   await write('products',{status:'ARCHIVED'},'actor',product.id);equal((await publishedRows('releases')).length,0);await write('products',{status:'PUBLISHED'},'actor',product.id);
  }
  await deleteModule(module,row.id,'actor');equal((await publishedRows(table)).length,0);
 }
 await remove('products',product.id,'actor');equal((await publishedRows('products')).length,0);
 console.log(`Publication runtime: ${assertions} assertions passed across six modules (draft isolation, atomic audit rollback, repeated actions, republish, parent privacy, conflicts, deletion).`);
}finally{await db.close();}
