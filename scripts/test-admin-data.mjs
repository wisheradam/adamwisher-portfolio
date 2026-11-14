import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes,scryptSync } from 'node:crypto';
import { spawn } from 'node:child_process';
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
 await child(['scripts/admin-migrate.mjs']);await child(['scripts/admin-migrate.mjs']);await start();
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
 assert.equal((await patch(project.id,'DRAFT')).status,200);assert.equal((await request('/work/stage-one-test')).status,404);
 assert.equal((await request('/api/admin/records/products/'+product.id,{method:'DELETE',headers})).status,204);
 await stop();const pg=await PGlite.create(dbPath);const audit=await pg.query('SELECT count(*)::integer AS n FROM audit_events');assert.equal(audit.rows[0].n,5);await pg.close();
 console.log('Admin data integration passed: migrations, CRUD, audit, draft, preview, publish, unpublish, restart persistence');
}finally{await stop();await rm(temp,{recursive:true,force:true});}
