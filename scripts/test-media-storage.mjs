import {strict as assert} from 'node:assert';
import {Readable} from 'node:stream';import {randomUUID} from 'node:crypto';
import {createMediaStorage} from '../lib/admin/media-storage.mjs';
import {PGlite} from '@electric-sql/pglite';import {readFileSync,readdirSync} from 'node:fs';import {createRequire} from 'node:module';import vm from 'node:vm';import ts from 'typescript';
let n=0;const eq=(a,b)=>{assert.deepEqual(a,b);n++;};
const env={ADMIN_MEDIA_DRIVER:'s3',ADMIN_MEDIA_S3_BUCKET:'synthetic-review-bucket',ADMIN_MEDIA_S3_REGION:'eu-north-1'},calls=[];
const sdk=createMediaStorage({env,send:async cmd=>{calls.push(cmd);return cmd.constructor.name==='GetObjectCommand'?{Body:Readable.from([Buffer.from('approved')])}:{};}}),key=randomUUID()+'.png';
await sdk.put(key,Buffer.from('approved'),'image/png');eq(calls[0].input.IfNoneMatch,'*');eq(calls[0].input.ServerSideEncryption,'AES256');eq(calls[0].input.CacheControl,'private, no-store');eq(calls[0].input.Key,'media/'+key);eq(Buffer.from(await sdk.read(key)).toString(),'approved');await sdk.discard(key);eq(calls.at(-1).constructor.name,'DeleteObjectCommand');
await assert.rejects(sdk.read('../secret'));n++;
assert.throws(()=>createMediaStorage({env:{ADMIN_DATABASE_DRIVER:'neon'}}).check());n++;
assert.throws(()=>createMediaStorage({env:{...env,ADMIN_MEDIA_S3_PREFIX:'../unsafe'}}).check());n++;
const broken=createMediaStorage({env,send:async()=>{throw Error('Storage down');}});await assert.rejects(broken.put(key,Buffer.from('x'),'image/png'));n++;
const oversized=createMediaStorage({env,send:async()=>({Body:Readable.from([Buffer.alloc(4*1024*1024+1)])})});await assert.rejects(oversized.read(key),/size limit/);n++;
const objects=new Map(),db=new PGlite(),require=createRequire(import.meta.url),cache={};let failRead=false,discards=0,matched=true;
const query=async(sql,v=[])=>{if(failRead&&sql.startsWith('SELECT id FROM media_assets'))throw Error('DB unavailable');return (await db.query(sql,v)).rows;};
const store={query,transaction:fn=>db.transaction(tx=>fn(async(s,v=[]) => (await tx.query(s,v)).rows))};
const mockStorage={check(){},put:async(k,b)=>objects.set(k,b),read:async k=>objects.get(k),discard:async k=>{objects.delete(k);discards++;}};
function load(name){if(cache[name])return cache[name];const exports={};cache[name]=exports;vm.runInNewContext(ts.transpileModule(readFileSync('lib/admin/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports,process,Buffer,require:id=>id==='server-only'?{}:id==='./db'?{store}:id==='./public-knowledge'?{knowledgeCutover:()=>matched}:id==='./media-storage.mjs'?{createMediaStorage:()=>mockStorage}:id.startsWith('./')?load(id.slice(2)):require(id)});return exports;}
try{
 for(const f of readdirSync('lib/admin/migrations').sort())await db.exec(readFileSync('lib/admin/migrations/'+f,'utf8'));
 await db.query("INSERT INTO admin_users(id,email,password_hash,role,created_at,updated_at) VALUES('fixture','fixture@example.test','synthetic','SUPER_ADMIN','now','now')");
 const {saveMedia,getPublicMediaFile,deleteMedia}=load('media'),{syncPublication}=load('publication');
 const file=new File([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6vGQAAAAASUVORK5CYII=','base64')],'pixel.png',{type:'image/png'});
 process.env.PUBLIC_CONTENT_SOURCE='database';
 const asset=await saveMedia(file,'fixture');eq(objects.size,1);
 await assert.rejects(getPublicMediaFile(asset.id),/Not found/);n++;
 const replacement=await saveMedia(file,'fixture',asset.id);eq(objects.size,2);assert.notEqual(asset.storage_key,replacement.storage_key);n++;
 await db.query("INSERT INTO experience(id,company,title,company_logo_media_id,status,visibility,created_at,updated_at,updated_by) VALUES('e','Synthetic','Draft',$1,'DRAFT','PUBLIC','now','now','fixture')",[asset.id]);
 await assert.rejects(getPublicMediaFile(asset.id),/Not found/);n++;
 await assert.rejects(saveMedia(file,'fixture',asset.id),e=>e.status===409);n++;
 await assert.rejects(deleteMedia(asset.id,'fixture'),e=>e.status===409);n++;
 let row=(await query("UPDATE experience SET status='PUBLISHED' WHERE id='e' RETURNING *"))[0];await store.transaction(q=>syncPublication(q,'experience',row,'PUBLISHED','fixture'));
 await query("UPDATE publication_snapshots SET payload=jsonb_set(payload::jsonb,'{visibility}','\"PRIVATE\"')::text WHERE entity_type='experience'");await assert.rejects(getPublicMediaFile(asset.id),/Not found/);n++;await store.transaction(q=>syncPublication(q,'experience',row,'PUBLISHED','fixture'));
 matched=false;await assert.rejects(getPublicMediaFile(asset.id),/Not found/);n++;matched=true;
 eq((await getPublicMediaFile(asset.id)).row.id,asset.id);
 await query("UPDATE experience SET status='DRAFT',title='unpublished' WHERE id='e'");eq((await getPublicMediaFile(asset.id)).row.id,asset.id);
 row=(await query("UPDATE experience SET status='ARCHIVED' WHERE id='e' RETURNING *"))[0];await store.transaction(q=>syncPublication(q,'experience',row,'ARCHIVED','fixture'));await assert.rejects(getPublicMediaFile(asset.id),/Not found/);n++;
 const before=objects.size;await db.exec("ALTER TABLE audit_events ADD CONSTRAINT reject_fixture CHECK(actor_id<>'fixture') NOT VALID");await assert.rejects(saveMedia(file,'fixture'));n++;eq(objects.size,before);assert.ok(discards>0);n++;
 failRead=true;await assert.rejects(saveMedia(file,'fixture'));n++;eq(objects.size,before+1); // Unknown metadata outcome retains object for reconciliation.
 console.log(`Media storage: ${n} assertions passed (SDK request policy, failure paths, metadata/audit rollback, compensation, uncertain retention, immutable replacement, references and public snapshot eligibility; mocked S3, no live bucket)`);
}finally{await db.close();}
const template=JSON.parse(readFileSync('infrastructure/media-storage.cfn.json'));
const bucket=template.Resources.MediaBucket;
eq(bucket.DeletionPolicy,'Retain');eq(bucket.UpdateReplacePolicy,'Retain');eq(Object.values(bucket.Properties.PublicAccessBlockConfiguration),[true,true,true,true]);eq(bucket.Properties.VersioningConfiguration.Status,'Enabled');eq(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm,'AES256');eq(template.Resources.RuntimeMediaPolicy.Properties.PolicyDocument.Statement[0].Action,['s3:GetObject','s3:PutObject','s3:DeleteObject']);
console.log('Media infrastructure proposal: 6 security assertions passed (not deployed)');
