// Disposable native PostgreSQL test transport. Not used by application runtime.
import {randomUUID} from 'node:crypto';
import {createNeonStore} from '../lib/admin/neon-store.mjs';
export async function postgresReviewDatabase() {
 const {Client}=await import('pg');
 const schema='publication_test_'+randomUUID().replaceAll('-','');
 const base=createNeonStore({env:{ADMIN_DATABASE_URL:'postgresql://synthetic:synthetic@ep-test.neon.tech/test?sslmode=require'},makeClient:()=>new Client({connectionString:process.env.TEST_POSTGRES_URL})});
 await base.query(`CREATE SCHEMA "${schema}"`);
 const wrap=query=>({query:async(sql,v=[])=>({rows:await query(sql,v)}),exec:sql=>query(sql)});
 const transaction=fn=>base.transaction(async query=>{await query(`SET LOCAL search_path TO "${schema}"`);return fn(wrap(query));});
 return {
  transaction,
  query:(sql,v)=>transaction(tx=>tx.query(sql,v)),
  exec:sql=>transaction(tx=>tx.exec(sql)),
  close:()=>base.query(`DROP SCHEMA "${schema}" CASCADE`),
 };
}
