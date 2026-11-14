import { NextRequest, NextResponse } from "next/server";
import { adminUser, safeMutation } from "@/lib/admin/auth";
import { isKind, list, validate, write } from "@/lib/admin/records";
export const runtime="nodejs";
export async function GET(request:NextRequest,{params}:{params:Promise<{kind:string}>}) {
  const user=await adminUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {kind}=await params; if(!isKind(kind)) return NextResponse.json({error:"Not found"},{status:404});
  const search=(request.nextUrl.searchParams.get("q")??"").slice(0,100);
  const page=Math.min(1000,Math.max(0,Number(request.nextUrl.searchParams.get("page"))||0));
  return NextResponse.json({records:await list(kind,search,page*25),page});
}
export async function POST(request:NextRequest,{params}:{params:Promise<{kind:string}>}) {
  const user=await adminUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  if(user.role==="READ_ONLY" || !await safeMutation()) return NextResponse.json({error:"Forbidden"},{status:403});
  const {kind}=await params; if(!isKind(kind)) return NextResponse.json({error:"Not found"},{status:404});
  try {
    const input=validate(kind,await request.json());
    if(input.status==="PUBLISHED" && user.role!=="SUPER_ADMIN") return NextResponse.json({error:"Forbidden"},{status:403});
    return NextResponse.json(await write(kind,input,user.id),{status:201});
  } catch(e) {const message=e instanceof Error?e.message:"";const validation=/^(Invalid |Title is required|Slug, title and type are required|Not found|This route is reserved)/.test(message);return NextResponse.json({error:validation?message:"Unable to save record"},{status:validation?400:500});}
}
