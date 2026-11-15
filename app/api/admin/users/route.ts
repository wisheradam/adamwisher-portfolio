import { randomUUID,scryptSync,randomBytes } from "node:crypto";
import { NextRequest,NextResponse } from "next/server";
import { requirePermission,AdminAccessError,safeMutation } from "@/lib/admin/auth";
import { store } from "@/lib/admin/db";
const roles=["SUPER_ADMIN","EDITOR","READ_ONLY"];
export const runtime="nodejs";
export async function GET(){try{await requirePermission("users.manage");const users=await store.query("SELECT id,email,role,active,created_at,updated_at,last_login_at FROM admin_users ORDER BY created_at DESC LIMIT 100");return NextResponse.json({users});}catch(e){if(e instanceof AdminAccessError)return NextResponse.json({error:e.message},{status:e.status});return NextResponse.json({error:"Unavailable"},{status:500});}}
export async function POST(request:NextRequest){
  try{const actor=await requirePermission("users.manage");if(!await safeMutation())return NextResponse.json({error:"Forbidden"},{status:403});
    const data=await request.json(),email=typeof data.email==="string"?data.email.trim().toLowerCase():"",password=data.password,role=data.role;
    if(!/^\S+@\S+\.\S+$/.test(email)||email.length>320||typeof password!=="string"||password.length<12||password.length>1024||!roles.includes(role))return NextResponse.json({error:"Invalid user details"},{status:400});
    const salt=randomBytes(16).toString("hex"),hash=`scrypt:${salt}:${scryptSync(password,salt,64).toString("hex")}`,id=randomUUID(),now=new Date().toISOString();
    await store.transaction(async query=>{
      await query("INSERT INTO admin_users(id,email,password_hash,role,active,session_version,created_at,updated_at) VALUES($1,$2,$3,$4,TRUE,1,$5,$5)",[id,email,hash,role,now]);
      await query("INSERT INTO audit_events(id,actor_id,action,entity_type,entity_id,before_state,after_state,created_at) VALUES($1,$2,'USER_CREATED','admin_users',$3,NULL,$4,$5)",[randomUUID(),actor.id,id,JSON.stringify({email,role,active:true}),now]);
    });return NextResponse.json({id,email,role,active:true},{status:201});
  }catch(e){if(e instanceof AdminAccessError)return NextResponse.json({error:e.message},{status:e.status});return NextResponse.json({error:"Unable to create user"},{status:500});}
}
