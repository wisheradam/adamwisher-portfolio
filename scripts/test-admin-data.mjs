import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes,scryptSync } from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';
import { strict as assert } from 'node:assert';
import { PGlite } from '@electric-sql/pglite';
const temp=await mkdtemp(path.join(tmpdir(),'adam-admin-test-'));
const dbPath=path.join(temp,'database'),port=34791,base=`http://127.0.0.1:${port}`;
const password=randomBytes(24).toString('hex'),salt=randomBytes(16).toString('hex');
const env={...process.env,ADMIN_DATABASE_DRIVER:'pglite',ADMIN_DB_PATH:dbPath,ADMIN_SESSION_SECRET:randomBytes(48).toString('hex'),ADMIN_PASSWORD_HASH:`scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`};
let server;
function child(args){return new Promise((resolve,reject)=>{const p=spawn(process.execPath,args,{env,stdio:'ignore'});p.on('exit',code=>code===0?resolve():reject(new Error(`Command exited ${code}`)));});}
async function start(){server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{env,stdio:'ignore'});for(let i=0;i<80;i++){try{await fetch(base+'/admin/login');return;}catch{await new Promise(r=>setTimeout(r,100));}}throw new Error('Server did not start');}
async function stop(){if(!server)return;server.kill('SIGTERM');await new Promise(resolve=>server.once('exit',resolve));server=undefined;}
const request=(route,options={})=>fetch(base+route,options);
try{
 await child(['scripts/admin-migrate.mjs']);await child(['scripts/admin-migrate.mjs']);
 const legacy=path.join(temp,'legacy.sqlite');
 execFileSync('python3',['-c',`import sqlite3,sys
c=sqlite3.connect(sys.argv[1]);c.executescript("CREATE TABLE projects (id TEXT PRIMARY KEY,slug TEXT,title TEXT,summary TEXT,body TEXT,category TEXT,role TEXT,status TEXT,visibility TEXT,featured INTEGER,sort_order INTEGER,seo_title TEXT,seo_description TEXT,published_at TEXT,deleted_at TEXT,created_at TEXT,updated_at TEXT,updated_by TEXT);CREATE TABLE products (id TEXT PRIMARY KEY,slug TEXT,title TEXT,type TEXT,summary TEXT,body TEXT,status TEXT,visibility TEXT,version TEXT,website_url TEXT,github_url TEXT,featured INTEGER,deleted_at TEXT,created_at TEXT,updated_at TEXT,updated_by TEXT);CREATE TABLE audit_events (id TEXT PRIMARY KEY,actor_id TEXT,action TEXT,entity_type TEXT,entity_id TEXT,before_state TEXT,after_state TEXT,created_at TEXT);");c.execute("INSERT INTO projects(id,slug,title,status,visibility,created_at,updated_at,updated_by,summary,body,category,role,featured,sort_order) VALUES ('legacy','legacy-import','Legacy','DRAFT','PRIVATE','2020','2020','legacy','','','','',0,0)");c.commit()`,legacy]);
 await child(['scripts/admin-import-sqlite.mjs',legacy]);await child(['scripts/admin-import-sqlite.mjs',legacy]);
 let pg=await PGlite.create(dbPath);assert.equal((await pg.query("SELECT count(*)::integer AS n FROM projects WHERE id='legacy'")).rows[0].n,1);await pg.close();
 await start();
 assert.equal((await request('/api/admin/records/projects')).status,401);
 const login=await request('/api/admin/login',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify({password})});assert.equal(login.status,200);
 const cookie=login.headers.get('set-cookie').split(';')[0];const headers={origin:base,cookie,'content-type':'application/json'};
 assert.equal((await request('/api/admin/records/projects',{method:'POST',headers:{cookie,'content-type':'application/json'},body:'{}'})).status,403);
 const create=async(kind,data)=>{const response=await request('/api/admin/records/'+kind,{method:'POST',headers,body:JSON.stringify(data)});if(response.status!==201) throw new Error(`Create ${kind} failed: ${response.status} ${await response.text()}`);return response.json();};
 const project=await create('projects',{slug:'stage-one-test',title:'Stage One',status:'DRAFT',visibility:'PUBLIC'});
 const product=await create('products',{slug:'stage-one-app',title:'Stage App',type:'WEB_APP',status:'CONCEPT'});
 assert.equal((await request('/work/stage-one-test')).status,404);
 assert.equal((await request('/admin/preview/'+project.id,{headers:{cookie}})).status,200);
 assert.equal((await request('/api/admin/records/products/'+product.id,{headers:{cookie}})).status,200);
 const patch=async(id,status)=>request('/api/admin/records/projects/'+id,{method:'PATCH',headers,body:JSON.stringify({status})});
 assert.equal((await patch(project.id,'PUBLISHED')).status,200);assert.equal((await request('/work/stage-one-test')).status,200);
 await stop();await start();assert.equal((await request('/work/stage-one-test')).status,200);
 const edit=await request('/api/admin/records/projects/'+project.id,{method:'PATCH',headers,body:JSON.stringify({summary:'Updated after restart'})});assert.equal(edit.status,200);
 await stop();await start();const reread=await request('/api/admin/records/projects/'+project.id,{headers:{cookie}});assert.equal((await reread.json()).summary,'Updated after restart');
 assert.equal((await patch(project.id,'DRAFT')).status,200);assert.equal((await request('/work/stage-one-test')).status,404);
 assert.equal((await request('/api/admin/records/products/'+product.id,{method:'DELETE',headers})).status,204);
 await stop();pg=await PGlite.create(dbPath);const audit=await pg.query('SELECT count(*)::integer AS n FROM audit_events');assert.equal(audit.rows[0].n,6);
 await pg.exec("ALTER TABLE audit_events ADD CONSTRAINT reject_test_actor CHECK(actor_id <> 'super-admin') NOT VALID");await pg.close();
 await start();const failed=await request('/api/admin/records/projects',{method:'POST',headers,body:JSON.stringify({slug:'rolled-back',title:'Rollback test',status:'DRAFT'})});assert.equal(failed.status,500);
 const absent=await request('/api/admin/records/projects?q=rolled-back',{headers:{cookie}});assert.equal((await absent.json()).records.length,0);
 await stop();pg=await PGlite.create(dbPath);assert.equal((await pg.query("SELECT count(*)::integer AS n FROM projects WHERE slug='rolled-back'")).rows[0].n,0);await pg.close();
 console.log('Admin data integration passed: migrations, idempotent SQLite import, CRUD, audit, transaction rollback, draft, preview, publish, unpublish, restart persistence');
}finally{await stop();await rm(temp,{recursive:true,force:true});}
