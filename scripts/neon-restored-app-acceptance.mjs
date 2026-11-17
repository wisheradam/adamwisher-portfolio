// Approved EC2 restored-target acceptance only. Never prints credentials, cookies or bodies.
import {strict as assert} from 'node:assert';
import {randomBytes,scryptSync,randomUUID,createHash} from 'node:crypto';
import {readFileSync,readdirSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {createNeonStore} from '../lib/admin/neon-store.mjs';
if(process.env.RECOVERY_CONFIGURATION){const config=JSON.parse(process.env.RECOVERY_CONFIGURATION);process.env.ADMIN_DATABASE_URL=config.app_database_url;delete process.env.RECOVERY_CONFIGURATION;delete process.env.RECOVERY_IDENTITY;}
const url=new URL(process.env.ADMIN_DATABASE_URL??'');
assert.equal(process.env.RECOVERY_APPLICATION_APPROVED,'1');
assert.equal(url.hostname,process.env.RECOVERY_TARGET_ENDPOINT);
assert.ok(process.env.RECOVERY_TARGET_BRANCH?.startsWith('br-'));
assert.ok(!['br-wispy-darkness-b91vydbj','br-summer-bird-b915xsws'].includes(process.env.RECOVERY_TARGET_BRANCH));
assert.notEqual(url.hostname.replace('-pooler.','.'),'ep-gentle-firefly-b9rgczs1.c-7.eu-central-1.aws.neon.tech');
assert.notEqual(url.hostname.replace('-pooler.','.'),'ep-morning-dew-b97in9dm.c-7.eu-central-1.aws.neon.tech');
assert.equal(process.env.RECOVERY_TARGET_ISOLATED,'1');
const store=createNeonStore(),stamp=new Date().toISOString(),runId=randomUUID(),port=34917,base=`http://127.0.0.1:${port}`;
const users=[],server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-H','127.0.0.1','-p',String(port)],{env:{...process.env,PUBLIC_CONTENT_SOURCE:'database'},stdio:'ignore'});
let checks=0;const eq=(x,y)=>{assert.equal(x,y);checks++;};
try{
 const ledger=await store.query('SELECT version,checksum FROM admin_schema_migrations');
 for(const file of readdirSync('lib/admin/migrations').filter(f=>f.endsWith('.sql'))){const row=ledger.find(r=>r.version===file.slice(0,-4));assert.ok(row);eq(row.checksum,createHash('sha256').update(readFileSync('lib/admin/migrations/'+file)).digest('hex'));}
 for(const role of ['SUPER_ADMIN','EDITOR','READ_ONLY']){
  const id=randomUUID(),password=randomBytes(32).toString('hex'),salt=randomBytes(16).toString('hex'),email=`${runId}-${role.toLowerCase()}@example.test`;
  await store.query('INSERT INTO admin_users(id,email,password_hash,role,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$5)',[id,email,`scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}`,role,stamp]);users.push({id,email,password,role});
 }
 for(let n=0;n<100;n++){try{await fetch(base+'/admin/login');break;}catch{await new Promise(r=>setTimeout(r,100));}}
 const headers={'content-type':'application/json',origin:base};
 for(const u of users){const r=await fetch(base+'/api/admin/login',{method:'POST',headers,body:JSON.stringify({email:u.email,password:u.password})});eq(r.status,200);u.cookie=r.headers.get('set-cookie').split(';')[0];}
 eq((await fetch(base+'/api/admin/users')).status,401);
 for(const u of users.slice(1))eq((await fetch(base+'/api/admin/users',{headers:{cookie:u.cookie}})).status,403);
 const owner=users[0],editor=users[1],viewer=users[2],slug='recovery-'+runId;
 const request=(u,path,method,body)=>fetch(base+path,{method,headers:{...headers,cookie:u.cookie},body:body?JSON.stringify(body):undefined});
 eq((await request(viewer,'/api/admin/records/products','POST',{slug,title:'Synthetic',type:'WEB_APP'})).status,403);
 const made=await request(editor,'/api/admin/records/products','POST',{slug,title:'Synthetic v1',type:'WEB_APP',status:'DRAFT',visibility:'PUBLIC'});eq(made.status,201);const app=await made.json();
 eq((await fetch(base+'/apps/'+slug)).status,404);
 eq((await request(editor,'/api/admin/records/products/'+app.id,'PATCH',{status:'PUBLISHED'})).status,403);
 eq((await request(owner,'/api/admin/records/products/'+app.id,'PATCH',{status:'PUBLISHED'})).status,200);
 let html=await (await fetch(base+'/apps/'+slug)).text();assert.ok(html.includes('Synthetic v1'));checks++;
 eq((await request(editor,'/api/admin/records/products/'+app.id,'PATCH',{title:'Synthetic v2',status:'DRAFT'})).status,200);
 html=await (await fetch(base+'/apps/'+slug)).text();assert.ok(html.includes('Synthetic v1')&&!html.includes('Synthetic v2'));checks++;
 assert.ok(Number((await store.query('SELECT count(*) AS n FROM audit_events WHERE entity_id=$1',[app.id]))[0].n)>0);checks++;
 await assert.rejects(store.transaction(async q=>{await q('UPDATE products SET title=$1 WHERE id=$2',['must-roll-back',app.id]);await q('SELECT * FROM recovery_deliberately_absent_relation');}));checks++;
 eq((await store.query('SELECT title FROM products WHERE id=$1',[app.id]))[0].title,'Synthetic v2');
 eq((await request(owner,'/api/admin/records/products/'+app.id,'PATCH',{status:'ARCHIVED'})).status,200);eq((await fetch(base+'/apps/'+slug)).status,404);
 for(const u of users){eq((await request(u,'/api/admin/logout','POST')).status,200);eq((await fetch(base+'/api/admin/records/projects',{headers:{cookie:u.cookie}})).status,401);}
 console.log(JSON.stringify({restored_application_checks:checks,status:'PASS',synthetic_fixtures_retained:true}));
}catch{console.error('STOP: restored application acceptance failed; private diagnostics suppressed.');process.exitCode=1;}
finally{server.kill('SIGTERM');if(server.exitCode===null)await new Promise(r=>server.once('exit',r));}
