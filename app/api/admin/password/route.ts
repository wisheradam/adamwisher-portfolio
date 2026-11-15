import { randomBytes,randomUUID,scryptSync } from "node:crypto";
import { NextRequest,NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminCookie,adminUser,checkPassword,safeMutation } from "@/lib/admin/auth";
import { store } from "@/lib/admin/db";
export const runtime="nodejs";
export async function POST(request:NextRequest){
 try{const user=await adminUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});if(!await safeMutation())return NextResponse.json({error:"Forbidden"},{status:403});
  const input=await request.json();if(typeof input.currentPassword!=="string"||typeof input.newPassword!=="string"||input.newPassword.length<12||input.newPassword.length>1024||input.currentPassword===input.newPassword)return NextResponse.json({error:"Choose a different password of at least 12 characters"},{status:400});
  const row=(await store.query("SELECT password_hash FROM admin_users WHERE id=$1 AND active=TRUE",[user.id]))[0];if(!row||!checkPassword(input.currentPassword,String(row.password_hash)))return NextResponse.json({error:"Current password is incorrect"},{status:403});
  const salt=randomBytes(16).toString("hex"),encoded=`scrypt:${salt}:${scryptSync(input.newPassword,salt,64).toString("hex")}`,now=new Date().toISOString();
  await store.transaction(async query=>{await query("UPDATE admin_users SET password_hash=$1,session_version=session_version+1,updated_at=$2 WHERE id=$3",[encoded,now,user.id]);await query("DELETE FROM admin_sessions WHERE user_id=$1",[user.id]);await query("INSERT INTO audit_events(id,actor_id,action,entity_type,entity_id,before_state,after_state,created_at) VALUES($1,$2,'PASSWORD_CHANGED','admin_users',$2,NULL,NULL,$3)",[randomUUID(),user.id,now]);});
  const response=NextResponse.json({ok:true});response.cookies.set(adminCookie(),"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:0});return response;
 }catch{return NextResponse.json({error:"Unable to change password"},{status:500});}
}
