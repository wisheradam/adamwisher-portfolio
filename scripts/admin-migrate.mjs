import { readFileSync } from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { RDSDataClient, ExecuteStatementCommand, BeginTransactionCommand, CommitTransactionCommand, RollbackTransactionCommand } from '@aws-sdk/client-rds-data';
const mode=process.env.ADMIN_DATABASE_DRIVER??'pglite';
const file=path.join(process.cwd(),'lib/admin/migrations/001_init.sql');
const statements=readFileSync(file,'utf8').split(';').map(s=>s.trim()).filter(Boolean);
const version='001_init';
if(mode==='pglite') {
  const db=await PGlite.create(process.env.ADMIN_DB_PATH??path.join(process.cwd(),'.data','admin-pg'));
  await db.transaction(async tx=>{for(const sql of statements) await tx.exec(sql);await tx.query('INSERT INTO admin_schema_migrations(version) VALUES ($1) ON CONFLICT DO NOTHING',[version]);});
  await db.close();
} else if(mode==='aurora-data-api') {
  const {ADMIN_DB_RESOURCE_ARN:resourceArn,ADMIN_DB_SECRET_ARN:secretArn,ADMIN_DB_NAME:database,AWS_REGION:region}=process.env;
  if(!resourceArn||!secretArn||!database||!region) throw new Error('Admin database configuration is incomplete');
  const client=new RDSDataClient({region});const cfg={resourceArn,secretArn,database};
  const transactionId=(await client.send(new BeginTransactionCommand(cfg))).transactionId;
  try {for(const sql of statements) await client.send(new ExecuteStatementCommand({...cfg,transactionId,sql}));
    await client.send(new ExecuteStatementCommand({...cfg,transactionId,sql:`INSERT INTO admin_schema_migrations(version) VALUES ('${version}') ON CONFLICT DO NOTHING`}));
    await client.send(new CommitTransactionCommand({...cfg,transactionId}));
  } catch(error) {await client.send(new RollbackTransactionCommand({...cfg,transactionId}));throw error;}
} else throw new Error('Unknown ADMIN_DATABASE_DRIVER');
console.log('Admin schema migration complete:',version);
