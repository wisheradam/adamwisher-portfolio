import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { randomBytes,scryptSync } from 'node:crypto';
import { strict as assert } from 'node:assert';
import { PGlite } from '@electric-sql/pglite';
const temp=await mkdtemp(path.join(tmpdir(),'adam-knowledge-')),salt=randomBytes(16).toString('hex');
const env={...process.env,ADMIN_DATABASE_DRIVER:'pglite',ADMIN_DB_PATH:path.join(temp,'db'),ADMIN_BOOTSTRAP_EMAIL:'test@example.test',ADMIN_PASSWORD_HASH:`scrypt:${salt}:${scryptSync(randomBytes(24),salt,64).toString('hex')}`};
function run(script,expected=0){const p=spawnSync(process.execPath,[script],{env,encoding:'utf8'});assert.equal(p.status,expected,p.stderr?.slice(-1000));return p.stdout;}
try{
 run('scripts/admin-migrate.mjs');run('scripts/admin-bootstrap.mjs');
 const first=JSON.parse(run('scripts/admin-import-knowledge.mjs'));assert.deepEqual(first.report.map(r=>r.source),[9,2,48]);assert.equal(first.differences,0);
 const second=JSON.parse(run('scripts/admin-import-knowledge.mjs'));assert.deepEqual(second.report.map(r=>r.created),[0,0,0]);
 const db=await PGlite.create(env.ADMIN_DB_PATH);const before=(await db.query("SELECT id,start_date FROM experience WHERE company='INNOVA' ORDER BY sort_order LIMIT 1")).rows[0];assert.equal(before.start_date,'2026-03');await db.query('UPDATE experience SET title=$1 WHERE id=$2',['Owner edited title',before.id]);await db.close();
 const third=JSON.parse(run('scripts/admin-import-knowledge.mjs',1));assert.deepEqual(third.report.map(r=>r.created),[0,0,0]);assert.ok(third.differences>0);
 const check=await PGlite.create(env.ADMIN_DB_PATH);assert.equal((await check.query('SELECT title FROM experience WHERE id=$1',[before.id])).rows[0].title,'Owner edited title');await check.close();
 console.log('Knowledge import passed: 9 experience, 2 education, 48 courses; rerun preserves edits and month precision');
}finally{await rm(temp,{recursive:true,force:true});}
