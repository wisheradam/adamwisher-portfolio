import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { RDSDataClient, ExecuteStatementCommand, BeginTransactionCommand, CommitTransactionCommand, RollbackTransactionCommand } from '@aws-sdk/client-rds-data';
import {databaseMode,createNeonStore} from '../lib/admin/neon-store.mjs';
import {migrate} from './migration-engine.mjs';
const mode=databaseMode();
const directory=path.join(process.cwd(),'lib/admin/migrations');
const files=readdirSync(directory).filter(file=>/^\d+_[a-z0-9_-]+\.sql$/.test(file)).sort();
const migrations=files.map(file=>({version:file.slice(0,-4),sql:readFileSync(path.join(directory,file),'utf8')}));
let result;
if(mode==='neon') result=await migrate(createNeonStore({direct:true}),migrations);
else if(mode==='pglite') {
 const db=await PGlite.create(process.env.ADMIN_DB_PATH??path.join(process.cwd(),'.data','admin-pg'));
 try {result=await migrate({transaction:fn=>db.transaction(tx=>fn(async(sql,values=[]) => (await tx.query(sql,values)).rows))},migrations);}finally{await db.close();}
} else if(mode==='aurora-data-api') {
 const {ADMIN_DB_RESOURCE_ARN:resourceArn,ADMIN_DB_SECRET_ARN:secretArn,ADMIN_DB_NAME:database,AWS_REGION:region}=process.env;
 if(!resourceArn||!secretArn||!database||!region)throw new Error('Admin database configuration is incomplete');
 const client=new RDSDataClient({region}),cfg={resourceArn,secretArn,database};
 try {result=await migrate({transaction:async fn=>{
  const transactionId=(await client.send(new BeginTransactionCommand(cfg))).transactionId;
  if(!transactionId)throw new Error('Could not begin schema transaction');
  const query=async(sql,values=[])=>{
   const r=await client.send(new ExecuteStatementCommand({...cfg,transactionId,sql:sql.replace(/\$(\d+)/g,(_,i)=>`:p${i}`),parameters:values.map((v,i)=>({name:`p${i+1}`,value:{stringValue:String(v)}})),includeResultMetadata:true}));
   return (r.records??[]).map(row=>Object.fromEntries((r.columnMetadata??[]).map((m,i)=>[m.label??m.name,row[i]?.isNull?null:row[i]?.stringValue])));
  };
  try{const value=await fn(query);await client.send(new CommitTransactionCommand({...cfg,transactionId}));return value;}
  catch(e){await client.send(new RollbackTransactionCommand({...cfg,transactionId}));throw e;}
 }},migrations);}finally{client.destroy();}
} else throw new Error('Unknown ADMIN_DATABASE_DRIVER');
console.log('Admin schema migration complete:',JSON.stringify(result));
