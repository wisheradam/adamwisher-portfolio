// Disposable local SQL validation only; no credentials, network or backup execution.
import {spawnSync} from 'node:child_process';
import {strict as assert} from 'node:assert';
import {PGlite} from '@electric-sql/pglite';
const result=spawnSync('python3',['-c',`import importlib.util,json
s=importlib.util.spec_from_file_location('r','scripts/neon-macos-recovery.py');r=importlib.util.module_from_spec(s);s.loader.exec_module(r)
r.sql=lambda c,side,statement: statement
print(json.dumps({'catalog':r.CATALOG,'fingerprint':r.fingerprint({},'source'),'sequences':r.sequence_state({},'source')}))`],{encoding:'utf8'});
assert.equal(result.status,0);
const queries=JSON.parse(result.stdout),db=new PGlite();
try{
 await db.exec("CREATE ROLE neon_superuser; CREATE TABLE fixture(id integer, note text); INSERT INTO fixture VALUES(1,'synthetic'); CREATE SEQUENCE fixture_seq;");
 const catalog=(await db.query(queries.catalog)).rows[0];assert.ok(catalog);
 const generated=(await db.query(queries.fingerprint.split('\\gexec')[0])).rows;
 assert.equal(generated.length,1);
 const original=(await db.query(Object.values(generated[0])[0])).rows[0].json_build_array;
 assert.equal(original[1],1);assert.match(original[2],/^[a-f0-9]{64}$/);
 await db.exec("UPDATE fixture SET note='changed'");
 const changed=(await db.query(Object.values(generated[0])[0])).rows[0].json_build_array;
 assert.notEqual(original[2],changed[2]);
 const seq=(await db.query(queries.sequences.split('\\gexec')[0])).rows;
 assert.equal(seq.length,1);assert.equal((await db.query(Object.values(seq[0])[0])).rows[0].json_build_array[2],false);
 console.log('Recovery SQL: 8 checks passed (catalog, generated SHA-256, row-change detection and sequence state; disposable PGlite only)');
}finally{await db.close();}
