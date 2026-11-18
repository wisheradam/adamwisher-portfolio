// Explicit disposable PostgreSQL/Neon acceptance. Never uses production ADMIN_DATABASE_URL.
import {strict as assert} from 'node:assert';
import {randomUUID} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {PGlite} from '@electric-sql/pglite';
import {migrate} from './migration-engine.mjs';
import {createNeonStore} from '../lib/admin/neon-store.mjs';
const live=process.env.NEON_TEST_ISOLATED==='1';
if(!live&&!process.env.TEST_POSTGRES_URL)throw new Error('Set TEST_POSTGRES_URL for disposable PostgreSQL or NEON_TEST_ISOLATED=1 and NEON_TEST_DATABASE_URL for an isolated Neon development database');
let base;
if(live)base=createNeonStore({env:{ADMIN_DATABASE_URL:process.env.NEON_TEST_DATABASE_URL}});
else {
 const {Client}=await import('pg');
 base=createNeonStore({env:{ADMIN_DATABASE_URL:'postgresql://synthetic:synthetic@ep-test.neon.tech/test?sslmode=require'},makeClient:()=>new Client({connectionString:process.env.TEST_POSTGRES_URL})});
}
const schema='neon_test_'+randomUUID().replaceAll('-','');
const store={transaction:fn=>base.transaction(async query=>{await query(`SET LOCAL search_path TO "${schema}"`);return fn(query);}),query:(sql,v)=>store.transaction(q=>q(sql,v))};
const migrations=readdirSync('lib/admin/migrations').sort().map(f=>({version:f.slice(0,-4),sql:readFileSync('lib/admin/migrations/'+f,'utf8')}));
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
try{
 await base.query(`CREATE SCHEMA "${schema}"`);
 eq((await migrate(store,migrations)).applied.length,5);
 eq((await migrate(store,migrations)).skipped.length,5);
 await store.query("INSERT INTO projects(id,slug,title,created_at,updated_at,updated_by) VALUES($1,$2,$3,$4,$4,$5)",['retained','retained','Draft',new Date().toISOString(),'fixture']);
 await assert.rejects(store.transaction(async q=>{await q("UPDATE projects SET title='lost' WHERE id='retained'");await q("INSERT INTO missing_relation VALUES(1)");}));n++;
 eq((await store.query("SELECT title FROM projects WHERE id='retained'"))[0].title,'Draft');
 const data=await store.transaction(async q=>{
  const tables=(await q("SELECT tablename FROM pg_tables WHERE schemaname=$1 ORDER BY tablename",[schema])).map(r=>r.tablename);
  return Promise.all(tables.map(async table=>({table,rows:await q(`SELECT * FROM "${table}"`)})));
 });
 // Restore a consistent logical export to a separate disposable PostgreSQL-compatible engine.
 const restore=new PGlite();
 try {
  await migrate({transaction:fn=>restore.transaction(tx=>fn(async(s,v=[]) => (await tx.query(s,v)).rows))},migrations);
  await restore.transaction(async tx=>{
   for(const {table,rows} of data){if(table==='admin_schema_migrations')continue;for(const row of rows){const cols=Object.keys(row);await tx.query(`INSERT INTO "${table}"(${cols.map(c=>'"'+c+'"').join(',')}) VALUES(${cols.map((_,i)=>'$'+(i+1)).join(',')})`,cols.map(k=>row[k] instanceof Date?row[k].toISOString():row[k]));}}
  });
  eq((await restore.query("SELECT title FROM projects WHERE id='retained'")).rows[0].title,'Draft');
 }finally{await restore.close();}
 console.log(`${live?'Live isolated Neon':'Disposable PostgreSQL'} integration: ${n} checks passed (all five SQL migrations, ledger skip, bound parameters, transaction rollback, logical export and isolated restore)`);
}finally{await base.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);}
