import { NextRequest, NextResponse } from "next/server";
import { adminCookie } from "@/lib/admin/auth";
export async function POST(request: NextRequest) {
  const origin=request.headers.get("origin");
  if (!origin || new URL(origin).host!==request.headers.get("host")) return NextResponse.json({error:"Forbidden"},{status:403});
  const response=NextResponse.json({ok:true});
  response.cookies.delete(adminCookie());
  return response;
}
