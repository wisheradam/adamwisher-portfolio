import "server-only";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { store } from "./db";
import { can, type AdminRole, type Permission } from "./permissions";

const name="adam_admin_session";
const ttl=8*60*60*1000;
export type AdminUser={id:string;email:string;role:AdminRole};
export class AdminAccessError extends Error {constructor(public status:401|403){super(status===401?"Unauthorized":"Forbidden");}}
const hash=(value:string)=>createHash("sha256").update(value).digest("hex");
export function checkPassword(password:string,encoded:string):boolean {
  const [algorithm,salt,expected]=encoded.split(":");
  if(algorithm!=="scrypt"||!salt||!/^[a-f0-9]{128}$/i.test(expected??"")||password.length>1024)return false;
  return timingSafeEqual(scryptSync(password,salt,64),Buffer.from(expected,"hex"));
}
export async function createSession(user:AdminUser & {sessionVersion:number}) {
  const token=randomBytes(32).toString("hex"),now=new Date(),expires=new Date(now.getTime()+ttl);
  await store.query("INSERT INTO admin_sessions(token_hash,user_id,session_version,expires_at,created_at) VALUES ($1,$2,$3,$4,$5)",
    [hash(token),user.id,user.sessionVersion,expires.toISOString(),now.toISOString()]);
  return token;
}
export async function revokeSession(token?:string){if(token)await store.query("DELETE FROM admin_sessions WHERE token_hash=$1",[hash(token)]);}
export async function adminUser():Promise<AdminUser|null> {
  const token=(await cookies()).get(name)?.value;
  if(!token||!/^[a-f0-9]{64}$/.test(token))return null;
  const rows=await store.query("SELECT u.id,u.email,u.role FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id WHERE s.token_hash=$1 AND s.expires_at>$2 AND s.session_version=u.session_version AND u.active=TRUE",[hash(token),new Date().toISOString()]);
  return rows.length?{id:String(rows[0].id),email:String(rows[0].email),role:rows[0].role as AdminRole}:null;
}
export async function requirePermission(permission:Permission):Promise<AdminUser>{
  const user=await adminUser();if(!user)throw new AdminAccessError(401);
  if(!can(user.role,permission))throw new AdminAccessError(403);return user;
}
export function adminCookie(){return name;}
export async function safeMutation():Promise<boolean>{
  const h=await headers(),origin=h.get("origin"),host=h.get("x-forwarded-host")??h.get("host");
  try{return Boolean(origin&&host&&new URL(origin).host===host);}catch{return false;}
}
export async function loginLimit(key:string):Promise<boolean>{
  const digest=hash(key),now=new Date(),cutoff=new Date(now.getTime()-15*60*1000).toISOString(),until=new Date(now.getTime()+15*60*1000).toISOString();
  const rows=await store.query("INSERT INTO admin_login_limits(key_hash,attempts,window_start,blocked_until) VALUES($1,1,$2,NULL) ON CONFLICT(key_hash) DO UPDATE SET attempts=CASE WHEN admin_login_limits.window_start<$3 THEN 1 ELSE admin_login_limits.attempts+1 END,window_start=CASE WHEN admin_login_limits.window_start<$3 THEN $2 ELSE admin_login_limits.window_start END,blocked_until=CASE WHEN admin_login_limits.window_start<$3 THEN NULL WHEN admin_login_limits.attempts+1>5 THEN $4 ELSE admin_login_limits.blocked_until END RETURNING attempts,blocked_until",[digest,now.toISOString(),cutoff,until]);
  return Number(rows[0].attempts)<=5 && !(rows[0].blocked_until&&String(rows[0].blocked_until)>now.toISOString());
}
export async function clearLoginFailures(key:string){await store.query("DELETE FROM admin_login_limits WHERE key_hash=$1",[hash(key)]);}
export async function securityAudit(actor:string,action:string,entityId:string){
  await store.query("INSERT INTO audit_events(id,actor_id,action,entity_type,entity_id,before_state,after_state,created_at) VALUES($1,$2,$3,'admin_security',$4,NULL,NULL,$5)",[randomBytes(16).toString("hex"),actor,action,entityId,new Date().toISOString()]);
}
