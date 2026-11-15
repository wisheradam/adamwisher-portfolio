import { PGlite } from '@electric-sql/pglite';
import { readFileSync,readdirSync } from 'node:fs';
import { strict as assert } from 'node:assert';
const db=new PGlite();const dir='lib/admin/migrations/';
try{
 for(const file of readdirSync(dir).sort().filter(f=>f.endsWith('.sql')&&!f.startsWith('005_')))await db.exec(readFileSync(dir+file,'utf8'));
 const now=new Date().toISOString();
 await db.query("INSERT INTO certifications(id,title,issuer,credential_type,status,visibility,sort_order,created_at,updated_at,updated_by) VALUES('legacy','Legacy approved title','Synthetic QA','Course','PUBLISHED','PUBLIC',3,$1,$1,'actor')",[now]);
 const sql=readFileSync(dir+'005_publication_snapshots.sql','utf8');await db.exec(sql);
 await db.query("INSERT INTO admin_schema_migrations(version) VALUES('005_publication_snapshots')");
 const snapshot=async()=> (await db.query("SELECT payload FROM publication_snapshots WHERE entity_id='legacy'")).rows[0];
 assert.equal(JSON.parse((await snapshot()).payload).title,'Legacy approved title');
 await db.query("UPDATE certifications SET title='Unpublished edit',status='DRAFT' WHERE id='legacy'");
 assert.equal(JSON.parse((await snapshot()).payload).title,'Legacy approved title');await db.exec(sql);assert.equal(JSON.parse((await snapshot()).payload).title,'Legacy approved title');
 await db.query("DELETE FROM publication_snapshots WHERE entity_id='legacy'");await db.query("UPDATE certifications SET status='PUBLISHED' WHERE id='legacy'");await db.exec(sql);assert.equal(await snapshot(),undefined,'Migration rerun must not resurrect an unpublished snapshot');
 assert.equal((await db.query("SELECT title FROM certifications WHERE id='legacy'")).rows[0].title,'Unpublished edit');
 console.log('Publication migration: 5 assertions passed (legacy preservation, working isolation, rerun, no resurrection, working retention)');
}finally{await db.close();}
