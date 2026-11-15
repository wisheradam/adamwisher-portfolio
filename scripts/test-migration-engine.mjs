import {PGlite} from '@electric-sql/pglite';
import {strict as assert} from 'node:assert';
import {readFileSync,readdirSync} from 'node:fs';
import {migrate} from './migration-engine.mjs';
const db=new PGlite(),store={transaction:fn=>db.transaction(tx=>fn(async(sql,values=[]) => (await tx.query(sql,values)).rows))};
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const migrations=readdirSync('lib/admin/migrations').sort().map(f=>({version:f.slice(0,-4),sql:readFileSync('lib/admin/migrations/'+f,'utf8')}));
try{
 eq((await migrate(store,migrations)).applied.length,5);
 await db.query("INSERT INTO projects(id,slug,title,created_at,updated_at,updated_by) VALUES('preserve','preserve','Retain draft','now','now','actor')");
 eq((await migrate(store,migrations)).applied,[]);
 eq((await db.query("SELECT title FROM projects WHERE id='preserve'")).rows[0].title,'Retain draft');
 await assert.rejects(migrate(store,[{version:'006_test',sql:'CREATE TABLE rollback_probe(id TEXT); INSERT INTO missing_table VALUES(1)'}]));checks++;
 eq((await db.query("SELECT to_regclass('rollback_probe') AS name")).rows[0].name,null);
 eq((await db.query("SELECT version FROM admin_schema_migrations WHERE version='006_test'")).rows.length,0);
 eq((await db.query('SELECT count(*)::integer AS n FROM admin_schema_migrations')).rows[0].n,5);
 const fix={version:'006_test',sql:'CREATE TABLE rollback_probe(id TEXT)'};
 eq((await migrate(store,[fix])).applied,['006_test']);
 eq((await migrate(store,[fix])).skipped,['006_test']);
 await assert.rejects(migrate(store,[{...fix,sql:fix.sql+'; SELECT 1'}]),/Applied migration changed/);checks++;
 await db.query("UPDATE admin_schema_migrations SET checksum=NULL WHERE version='001_init'");
 eq((await migrate(store,migrations)).applied,[]);
 eq((await db.query("SELECT length(checksum) AS n FROM admin_schema_migrations WHERE version='001_init'")).rows[0].n,64);
 console.log(`Migration engine: ${checks} checks passed (fresh schema, repeat skip, legacy ledger, checksum drift, transactional failure/recovery and retained data)`);
}finally{await db.close();}
