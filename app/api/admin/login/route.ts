import { NextRequest, NextResponse } from "next/server";
import { adminCookie, checkPassword, makeSession } from "@/lib/admin/auth";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.headers.get("host")) return NextResponse.json({error:"Forbidden"},{status:403});
  let password = "";
  try { const body=await request.json(); password=typeof body.password==="string"?body.password:""; } catch {}
  if (password.length > 1024 || !checkPassword(password)) return NextResponse.json({error:"Invalid credentials"},{status:401});
  const response=NextResponse.json({ok:true});
  response.cookies.set(adminCookie(),makeSession(),{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"strict",path:"/",maxAge:28800});
  return response;
}
