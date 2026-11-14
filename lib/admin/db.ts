import "server-only";
import { RDSDataClient, ExecuteStatementCommand, BeginTransactionCommand, CommitTransactionCommand, RollbackTransactionCommand, type Field } from "@aws-sdk/client-rds-data";
import { PGlite } from "@electric-sql/pglite";
import path from "node:path";

type Scalar = string | number | boolean | null;
export type Row = Record<string, Scalar>;
export type Query = (sql: string, values?: Scalar[]) => Promise<Row[]>;
export interface Store { query: Query; transaction<T>(fn: (query: Query) => Promise<T>): Promise<T> }

let local: Promise<PGlite> | undefined;
let remote: RDSDataClient | undefined;
const mode = () => process.env.ADMIN_DATABASE_DRIVER ?? "pglite";
function config() {
  const resourceArn=process.env.ADMIN_DB_RESOURCE_ARN,secretArn=process.env.ADMIN_DB_SECRET_ARN,database=process.env.ADMIN_DB_NAME;
  if (!resourceArn || !secretArn || !database || !process.env.AWS_REGION) throw new Error("Admin database configuration is incomplete");
  return { resourceArn, secretArn, database };
}
function decode(field: Field | undefined): Scalar {
  if (!field || field.isNull) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.longValue !== undefined) return field.longValue;
  if (field.doubleValue !== undefined) return field.doubleValue;
  if (field.booleanValue !== undefined) return field.booleanValue;
  return null;
}
async function aurora(sql:string, values:Scalar[]=[], transactionId?:string):Promise<Row[]> {
  const cfg=config(); remote ??=new RDSDataClient({region:process.env.AWS_REGION,maxAttempts:2});
  const command=new ExecuteStatementCommand({...cfg,transactionId,sql:sql.replace(/\$(\d+)/g,(_,i)=>`:p${i}`),
    parameters:values.map((value,i)=>({name:`p${i+1}`,value:value===null?{isNull:true}:typeof value==="number"?(Number.isInteger(value)?{longValue:value}:{doubleValue:value}):typeof value==="boolean"?{booleanValue:value}:{stringValue:value}})),
    includeResultMetadata:true});
  const result=await remote.send(command);
  return (result.records??[]).map(record=>Object.fromEntries((result.columnMetadata??[]).map((meta,i)=>[meta.label??meta.name??`column${i}`,decode(record[i])])));
}
async function embedded():Promise<PGlite> {
  local ??= PGlite.create(process.env.ADMIN_DB_PATH ?? path.join(process.cwd(),".data","admin-pg"));
  return local;
}
export const store:Store={
  async query(sql,values=[]) { if(mode()==="aurora-data-api") return aurora(sql,values); if(mode()!=="pglite") throw new Error("Unknown admin database driver"); return (await (await embedded()).query<Row>(sql,values)).rows; },
  async transaction(fn) {
    if(mode()==="aurora-data-api") {
      const cfg=config();remote ??=new RDSDataClient({region:process.env.AWS_REGION,maxAttempts:2});
      const id=(await remote.send(new BeginTransactionCommand(cfg))).transactionId;
      if(!id) throw new Error("Could not begin admin transaction");
      try {const value=await fn((sql,values)=>aurora(sql,values,id));await remote.send(new CommitTransactionCommand({...cfg,transactionId:id}));return value;}
      catch(error){await remote.send(new RollbackTransactionCommand({...cfg,transactionId:id}));throw error;}
    }
    if(mode()!=="pglite") throw new Error("Unknown admin database driver");
    const pg=await embedded();return pg.transaction(async tx=>fn(async(sql,values=[])=> (await tx.query<Row>(sql,values)).rows));
  },
};
