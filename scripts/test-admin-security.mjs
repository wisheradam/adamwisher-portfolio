import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { randomBytes,scryptSync,createHash } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { spawn } from 'node:child_process';
import { strict as assert } from 'node:assert';
const temp=await mkdtemp(path.join(tmpdir(),'adam-security-')),port=34792,base=`http://127.0.0.1:${port}`;
const password=randomBytes(18).toString('hex'),salt=randomBytes(16).toString('hex');
const env={...process.env,ADMIN_DATABASE_DRIVER:'pglite',ADMIN_DB_PATH:path.join(temp,'db'),ADMIN_BOOTSTRAP_EMAIL:'owner@example.test',ADMIN_PASSWORD_HASH:`scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`};
let server;const req=(p,o={})=>fetch(base+p,o),json={'content-type':'application/json',origin:base};
async function child(args){await new Promise((resolve,reject)=>{const p=spawn(process.execPath,args,{env,stdio:'ignore'});p.on('exit',c=>c===0?resolve():reject(new Error(`Child exited ${c}`)));});}
async function start(){server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{env,stdio:'ignore'});for(let n=0;n<100;n++){try{await req('/admin/login');return;}catch{await new Promise(r=>setTimeout(r,100));}}throw new Error('Server not ready');}
async function stop(){if(server?.exitCode===null){server.kill('SIGTERM');await new Promise(r=>server.once('exit',r));}}
async function login(email,pass){return req('/api/admin/login',{method:'POST',headers:json,body:JSON.stringify({email,password:pass})});}
try{
 await child(['scripts/admin-migrate.mjs']);await child(['scripts/admin-bootstrap.mjs']);await child(['scripts/admin-bootstrap.mjs']);
 const pg=await PGlite.create(env.ADMIN_DB_PATH);const user=(await pg.query('SELECT id FROM admin_users LIMIT 1')).rows[0];const expired=randomBytes(32).toString('hex');await pg.query('INSERT INTO admin_sessions(token_hash,user_id,session_version,expires_at,created_at) VALUES($1,$2,1,$3,$3)',[createHash('sha256').update(expired).digest('hex'),user.id,'2000-01-01T00:00:00.000Z']);await pg.close();
 await start();
 assert.equal((await req('/api/admin/users')).status,401);
 assert.equal((await req('/api/admin/users',{headers:{cookie:`adam_admin_session=${expired}`}})).status,401);
 const owner=await login('owner@example.test',password);assert.equal(owner.status,200);const ownerCookie=owner.headers.get('set-cookie').split(';')[0];
 const ownerHeaders={...json,cookie:ownerCookie};
 const create=async(email,role)=>{const pass=randomBytes(18).toString('hex');const r=await req('/api/admin/users',{method:'POST',headers:ownerHeaders,body:JSON.stringify({email,password:pass,role})});assert.equal(r.status,201,await r.clone().text());return {...await r.json(),password:pass};};
 const editor=await create('editor@example.test','EDITOR'),viewer=await create('viewer@example.test','READ_ONLY');
 const editorLogin=await login(editor.email,editor.password),viewerLogin=await login(viewer.email,viewer.password);assert.equal(editorLogin.status,200);assert.equal(viewerLogin.status,200);
 const editorCookie=editorLogin.headers.get('set-cookie').split(';')[0],viewerCookie=viewerLogin.headers.get('set-cookie').split(';')[0];
 const editorHeaders={...json,cookie:editorCookie},viewerHeaders={...json,cookie:viewerCookie};
 assert.equal((await req('/api/admin/users',{headers:{cookie:editorCookie}})).status,403);
 assert.equal((await req('/api/admin/audit',{headers:{cookie:viewerCookie}})).status,403);
 assert.equal((await req('/api/admin/records/projects',{method:'POST',headers:viewerHeaders,body:JSON.stringify({slug:'viewer-denied',title:'Denied'})})).status,403);
 const draft=await req('/api/admin/records/projects',{method:'POST',headers:editorHeaders,body:JSON.stringify({slug:'editor-draft',title:'Editor Draft',status:'DRAFT'})});assert.equal(draft.status,201,await draft.clone().text());const record=await draft.json();
 assert.equal((await req('/api/admin/records/projects/'+record.id,{method:'PATCH',headers:editorHeaders,body:JSON.stringify({status:'PUBLISHED'})})).status,403);
 assert.equal((await req('/admin/preview/'+record.id,{headers:{cookie:viewerCookie},redirect:'manual'})).status,404);
 assert.equal((await req('/admin/preview/'+record.id,{headers:{cookie:editorCookie}})).status,200);
 const appDraft=await req('/api/admin/records/products',{method:'POST',headers:editorHeaders,body:JSON.stringify({slug:'stage-five-app',title:'Stage Five App',type:'WEB_APP',status:'DRAFT',visibility:'PUBLIC'})});assert.equal(appDraft.status,201);const app=await appDraft.json();
 assert.equal((await req('/apps/stage-five-app')).status,404);
 assert.equal((await req('/admin/preview/apps/'+app.id,{headers:{cookie:editorCookie}})).status,200);
 assert.equal((await req('/admin/preview/apps/'+app.id,{headers:{cookie:viewerCookie},redirect:'manual'})).status,404);
 assert.equal((await req('/api/admin/records/products/'+app.id,{method:'PATCH',headers:editorHeaders,body:JSON.stringify({status:'PUBLISHED'})})).status,403);
 assert.equal((await req('/api/admin/records/products/'+app.id,{method:'PATCH',headers:ownerHeaders,body:JSON.stringify({status:'PUBLISHED'})})).status,200);
 assert.equal((await req('/apps/stage-five-app')).status,200);
 assert.equal((await req('/api/admin/records/products/'+app.id,{method:'PATCH',headers:ownerHeaders,body:JSON.stringify({status:'DRAFT'})})).status,200);
 assert.equal((await req('/apps/stage-five-app')).status,404);
 assert.equal((await req('/api/admin/users/'+ownerCookie,{method:'PATCH',headers:editorHeaders,body:'{}'})).status,403);
 const users=await (await req('/api/admin/users',{headers:{cookie:ownerCookie}})).json();const ownerId=users.users.find(u=>u.role==='SUPER_ADMIN').id;
 assert.equal((await req('/api/admin/users/'+ownerId,{method:'PATCH',headers:ownerHeaders,body:JSON.stringify({role:'EDITOR',active:true})})).status,409);
 assert.equal((await req('/api/admin/users/'+viewer.id,{method:'PATCH',headers:ownerHeaders,body:JSON.stringify({role:'READ_ONLY',active:false})})).status,200);
 assert.equal((await req('/api/admin/records/projects',{headers:{cookie:viewerCookie}})).status,401);
 for(let n=0;n<5;n++)assert.equal((await login('target@example.test','wrong')).status,401);
 assert.equal((await login('target@example.test','wrong')).status,429);
 assert.equal((await req('/api/admin/logout',{method:'POST',headers:ownerHeaders})).status,200);
 assert.equal((await req('/api/admin/users',{headers:{cookie:ownerCookie}})).status,401);
 console.log('Admin security integration passed: roles, API boundaries, last admin, deactivation, revocation, rate limit');
}finally{await stop();await rm(temp,{recursive:true,force:true});}
