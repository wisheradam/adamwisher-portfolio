import { NextRequest,NextResponse } from "next/server";
import { adminCookie,adminUser,revokeSession,safeMutation,securityAudit } from "@/lib/admin/auth";
export const runtime="nodejs";
export async function POST(request:NextRequest){
  if(!await safeMutation())return NextResponse.json({error:"Forbidden"},{status:403});
  const user=await adminUser();await revokeSession(request.cookies.get(adminCookie())?.value);
  if(user)await securityAudit(user.id,"LOGOUT",user.id);
  const response=NextResponse.json({ok:true});response.cookies.set(adminCookie(),"",{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:0});return response;
}
