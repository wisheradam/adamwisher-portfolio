// One-time import for the Stage 0 local SQLite preview database.
import { execFileSync } from 'node:child_process';
import { PGlite } from '@electric-sql/pglite';
import path from 'node:path';
const source=process.argv[2];
if(!source) throw new Error('Usage: npm run admin:import-sqlite -- /absolute/path/to/admin.sqlite');
if(process.env.ADMIN_DATABASE_DRIVER && process.env.ADMIN_DATABASE_DRIVER!=='pglite') throw new Error('Import supports local PGlite only');
const script=`import json,sqlite3,sys\nc=sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True);c.row_factory=sqlite3.Row\nprint(json.dumps({t:[dict(r) for r in c.execute('SELECT * FROM '+t)] for t in ('projects','products','audit_events')}))`;
const data=JSON.parse(execFileSync('python3',['-c',script,path.resolve(source)],{encoding:'utf8',maxBuffer:50*1024*1024}));
const db=await PGlite.create(process.env.ADMIN_DB_PATH??path.join(process.cwd(),'.data','admin-pg'));
try{
 await db.transaction(async tx=>{
   const present=await tx.query('SELECT version FROM admin_schema_migrations WHERE version=$1',['001_init']);
   if(!present.rows.length) throw new Error('Run npm run admin:migrate first');
   for(const table of ['projects','products','audit_events']){
     for(const row of data[table]){
       const columns=Object.keys(row);const markers=columns.map((_,i)=>`$${i+1}`);
       await tx.query(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${markers.join(',')}) ON CONFLICT DO NOTHING`,Object.values(row));
     }
   }
 });
 console.log('SQLite import complete:',Object.fromEntries(Object.entries(data).map(([table,rows])=>[table,rows.length])));
}finally{await db.close();}
