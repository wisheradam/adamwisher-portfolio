import {strict as assert} from 'node:assert';
import {createNeonStore,neonUrl,databaseMode} from '../lib/admin/neon-store.mjs';
let checks=0;const ok=fn=>{fn();checks++;};
const env={ADMIN_DATABASE_URL:'postgresql://test:synthetic@ep-test-pooler.eu-central-1.aws.neon.tech/review?sslmode=require'};
for(const bad of [undefined,'postgresql://a:b@example.com/db?sslmode=require','postgresql://a:b@ep-test.neon.tech/db?sslmode=disable','secret-sentinel'])ok(()=>assert.throws(()=>neonUrl({ADMIN_DATABASE_URL:bad}),e=>!e.message.includes('secret-sentinel')));
ok(()=>assert.throws(()=>databaseMode({NODE_ENV:'production'})));
ok(()=>assert.equal(databaseMode({}),'pglite'));
ok(()=>assert.equal(databaseMode({ADMIN_DATABASE_DRIVER:'aurora-data-api'}),'aurora-data-api'));
ok(()=>assert.throws(()=>databaseMode({ADMIN_DATABASE_DRIVER:'typo'})));
ok(()=>assert.throws(()=>neonUrl({ADMIN_DATABASE_DIRECT_URL:env.ADMIN_DATABASE_URL},true)));
for(const failure of [null,'connect','BEGIN','INSERT','COMMIT','ROLLBACK']){
 const calls=[];let clients=0;
 const store=createNeonStore({env,makeClient:config=>{
  clients++;assert.equal(config.connectionTimeoutMillis,15000);
  return {connect:async()=>{calls.push('connect');if(failure==='connect')throw Error('connect');},end:async()=>{calls.push('end');},query:async(sql,values)=>{calls.push(sql);if(sql===failure||failure==='ROLLBACK'&&sql==='INSERT')throw Error(sql);return {rows:[{sql,values}]};}};
 }});
 if(failure)await assert.rejects(store.transaction(async query=>{await query('INSERT',["'); DROP TABLE projects;--"]);return 'saved';}));
 else {assert.equal(await store.transaction(async query=>{const r=await query('INSERT',['value']);assert.deepEqual(r[0].values,['value']);return 'saved';}),'saved');checks++;}
 ok(()=>assert.equal(clients,1));ok(()=>assert.equal(calls.at(-1),'end'));
 if(failure==='INSERT'||failure==='COMMIT'||failure==='ROLLBACK')ok(()=>assert.ok(calls.includes('ROLLBACK')));
 if(failure==='INSERT')ok(()=>assert.ok(!calls.includes('COMMIT')));
}
console.log(`Neon adapter: ${checks} checks passed (configuration, TLS, parameter forwarding, transaction affinity, rollback and cleanup; mocked transport, not live Neon)`);
