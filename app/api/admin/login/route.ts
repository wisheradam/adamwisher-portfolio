import { NextRequest,NextResponse } from "next/server";
import { adminCookie,checkPassword,createSession,loginLimit,clearLoginFailures,securityAudit,safeMutation } from "@/lib/admin/auth";
import { store } from "@/lib/admin/db";
export const runtime="nodejs";
export async function POST(request:NextRequest){
  if(!await safeMutation())return NextResponse.json({error:"Forbidden"},{status:403});
  let email="",password="";
  try{const input=await request.json();email=typeof input.email==="string"?input.email.trim().toLowerCase():"";password=typeof input.password==="string"?input.password:"";}catch{}
  if(email.length>320||password.length>1024)return NextResponse.json({error:"Invalid credentials"},{status:401});
  const key=`login:${email}`;
  if(!await loginLimit(key))return NextResponse.json({error:"Too many attempts. Try again later."},{status:429});
  const user=(await store.query("SELECT id,email,password_hash,role,active,session_version FROM admin_users WHERE email=$1",[email]))[0];
  if(!user||!user.active||!checkPassword(password,String(user.password_hash))){
    await securityAudit("anonymous","LOGIN_FAILED",email?"account-attempt":"empty-account");
    return NextResponse.json({error:"Invalid credentials"},{status:401});
  }
  await clearLoginFailures(key);
  const token=await createSession({id:String(user.id),email:String(user.email),role:user.role as "SUPER_ADMIN"|"EDITOR"|"READ_ONLY",sessionVersion:Number(user.session_version)});
  await store.query("UPDATE admin_users SET last_login_at=$1 WHERE id=$2",[new Date().toISOString(),String(user.id)]);
  await securityAudit(String(user.id),"LOGIN_SUCCEEDED",String(user.id));
  const response=NextResponse.json({ok:true});response.cookies.set(adminCookie(),token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:8*60*60});return response;
}
