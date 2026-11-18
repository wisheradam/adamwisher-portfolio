// Synthetic content rehearsal only. Not a full database or credential backup tool.
import {strict as assert} from 'node:assert';
import {randomBytes,createCipheriv,createDecipheriv,createHash} from 'node:crypto';
import {readFileSync,readdirSync,mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {PGlite} from '@electric-sql/pglite';
import {migrate} from './migration-engine.mjs';
const tables=['experience','publication_snapshots','audit_events'];
const fixture={experience:[{id:'fixture',company:'Synthetic',title:'Draft v2',status:'DRAFT',visibility:'PUBLIC',created_at:'2026-11-16',updated_at:'2026-11-16',updated_by:'fixture'}],publication_snapshots:[{entity_type:'experience',entity_id:'fixture',payload:JSON.stringify({id:'fixture',company:'Synthetic',title:'Public v1',status:'PUBLISHED',visibility:'PUBLIC'}),revision:1,published_at:'2026-11-16',published_by:'fixture'}],audit_events:[{id:'fixture-audit',entity_type:'experience',entity_id:'fixture',actor_id:'fixture',action:'PUBLISHED',created_at:'2026-11-16'}]};
const data=process.env.NEON_SYNTHETIC_BACKUP_FILE?JSON.parse(readFileSync(process.env.NEON_SYNTHETIC_BACKUP_FILE,'utf8')):fixture;
assert.deepEqual(Object.keys(data).sort(),[...tables].sort());
assert(data.experience.length===1&&data.experience[0].company==='Synthetic'&&data.experience[0].updated_by==='fixture');
assert(data.publication_snapshots.length===1&&data.publication_snapshots[0].published_by==='fixture');
assert(data.audit_events.length===1&&data.audit_events[0].actor_id==='fixture');
const canonical=value=>JSON.stringify(value,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const hash=value=>createHash('sha256').update(value).digest('hex');
const key=randomBytes(32),iv=randomBytes(12),plain=Buffer.from(canonical(data));
const cipher=createCipheriv('aes-256-gcm',key,iv);
const encrypted=Buffer.concat([cipher.update(plain),cipher.final()]);
const envelope={version:1,algorithm:'aes-256-gcm',iv:iv.toString('hex'),tag:cipher.getAuthTag().toString('hex'),ciphertext:encrypted.toString('base64')};
const decrypt=(e,k)=>{const d=createDecipheriv('aes-256-gcm',k,Buffer.from(e.iv,'hex'));d.setAuthTag(Buffer.from(e.tag,'hex'));return Buffer.concat([d.update(Buffer.from(e.ciphertext,'base64')),d.final()]);};
const root=process.env.REHEARSAL_OUTPUT_DIR??mkdtempSync(path.join(tmpdir(),'adam-encrypted-content-'));
mkdirSync(root,{recursive:true,mode:0o700});
const keyRoot=mkdtempSync(path.join(tmpdir(),'adam-recovery-key-'));
writeFileSync(path.join(keyRoot,'key'),key,{mode:0o600,flag:'wx'});
writeFileSync(path.join(root,'synthetic-content.aes-gcm.json'),JSON.stringify(envelope),{mode:0o600,flag:'wx'});
const recovered=decrypt(JSON.parse(readFileSync(path.join(root,'synthetic-content.aes-gcm.json'),'utf8')),readFileSync(path.join(keyRoot,'key')));
assert.equal(hash(recovered),hash(plain));
assert.throws(()=>decrypt(envelope,randomBytes(32)));
const corrupted={...envelope,ciphertext:Buffer.from(encrypted.map((v,i)=>i===0?v^1:v)).toString('base64')};
assert.throws(()=>decrypt(corrupted,key));
const restored=JSON.parse(recovered),db=new PGlite();let checks=3;
try{
 const migrations=readdirSync('lib/admin/migrations').sort().map(f=>({version:f.slice(0,-4),sql:readFileSync('lib/admin/migrations/'+f,'utf8')}));
 await migrate({transaction:fn=>db.transaction(tx=>fn(async(s,v=[]) =>(await tx.query(s,v)).rows))},migrations);
 await db.transaction(async tx=>{for(const table of tables)for(const row of restored[table]){const cols=Object.keys(row);assert(cols.every(c=>/^[a-z_]+$/.test(c)));await tx.query(`INSERT INTO ${table}(${cols.join(',')}) VALUES(${cols.map((_,i)=>'$'+(i+1)).join(',')})`,cols.map(c=>row[c]));}});
 for(const table of tables){const cols=Object.keys(restored[table][0]);const rows=(await db.query(`SELECT ${cols.join(',')} FROM ${table}`)).rows;assert.equal(canonical(rows),canonical(restored[table]));checks++;}
 assert.equal((await db.query('SELECT title FROM experience')).rows[0].title,'Draft v2');checks++;
 assert.equal(JSON.parse((await db.query('SELECT payload FROM publication_snapshots')).rows[0].payload).title,'Public v1');checks++;
 const manifest={scope:'synthetic content only; excludes users/sessions/credentials and schema recovery',algorithm:envelope.algorithm,plaintextSha256:hash(plain),encryptedSha256:hash(JSON.stringify(envelope)),counts:Object.fromEntries(tables.map(t=>[t,data[t].length])),checks};
 writeFileSync(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2),{mode:0o600,flag:'wx'});
 console.log(`Encrypted synthetic content restore: ${checks} checks passed (decrypt/hash, wrong key, tamper rejection, 3 complete row comparisons, Draft v2 and public v1)`);
 console.log(JSON.stringify({output:root,keyDirectory:keyRoot,manifest}));
}finally{await db.close();key.fill(0);plain.fill(0);recovered.fill(0);}
