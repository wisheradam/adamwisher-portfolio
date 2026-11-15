import { randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { RDSDataClient, ExecuteStatementCommand } from '@aws-sdk/client-rds-data';
import path from 'node:path';
const email=process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase(),hash=process.env.ADMIN_PASSWORD_HASH;
if(!email||!/^\S+@\S+\.\S+$/.test(email)||!/^scrypt:[^:]+:[a-f0-9]{128}$/i.test(hash??''))throw new Error('Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_PASSWORD_HASH');
const mode=process.env.ADMIN_DATABASE_DRIVER??'pglite',id=randomUUID(),now=new Date().toISOString();
const sql="INSERT INTO admin_users(id,email,password_hash,role,active,session_version,created_at,updated_at) SELECT $1,$2,$3,'SUPER_ADMIN',TRUE,1,$4,$4 WHERE NOT EXISTS(SELECT 1 FROM admin_users)";
if(mode==='pglite') {const pg=await PGlite.create(process.env.ADMIN_DB_PATH??path.join(process.cwd(),'.data','admin-pg'));try{await pg.query(sql,[id,email,hash,now]);}finally{await pg.close();}}
else if(mode==='aurora-data-api') {const {ADMIN_DB_RESOURCE_ARN:resourceArn,ADMIN_DB_SECRET_ARN:secretArn,ADMIN_DB_NAME:database,AWS_REGION:region}=process.env;if(!resourceArn||!secretArn||!database||!region)throw new Error('Database configuration is incomplete');const client=new RDSDataClient({region});await client.send(new ExecuteStatementCommand({resourceArn,secretArn,database,sql:sql.replace(/\$(\d+)/g,(_,n)=>`:p${n}`),parameters:[id,email,hash,now].map((v,i)=>({name:`p${i+1}`,value:{stringValue:v}}))}));}
else throw new Error('Unknown database driver');
console.log('Bootstrap checked. Existing user accounts were not modified.');
