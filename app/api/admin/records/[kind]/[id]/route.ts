import { NextRequest,NextResponse } from "next/server";
import { adminUser,safeMutation } from "@/lib/admin/auth";
import { get,isKind,remove,validate,write } from "@/lib/admin/records";
export const runtime="nodejs";
type Context={params:Promise<{kind:string;id:string}>};
export async function GET(_:NextRequest,{params}:Context) {
  const user=await adminUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  const {kind,id}=await params; if(!isKind(kind)) return NextResponse.json({error:"Not found"},{status:404});
  const record=await get(kind,id); return record?NextResponse.json(record):NextResponse.json({error:"Not found"},{status:404});
}
export async function PATCH(request:NextRequest,{params}:Context) {
  const user=await adminUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  if(user.role==="READ_ONLY" || !await safeMutation()) return NextResponse.json({error:"Forbidden"},{status:403});
  const {kind,id}=await params; if(!isKind(kind)) return NextResponse.json({error:"Not found"},{status:404});
  try {
    const input=validate(kind,await request.json());
    if(input.status==="PUBLISHED" && user.role!=="SUPER_ADMIN") return NextResponse.json({error:"Forbidden"},{status:403});
    const record=await write(kind,input,user.id,id); return NextResponse.json(record);
  } catch(e) {const message=e instanceof Error?e.message:"";const validation=/^(Invalid |Title is required|Slug, title and type are required|Not found|This route is reserved)/.test(message);return NextResponse.json({error:validation?message:"Unable to save record"},{status:validation?400:500});}
}
export async function DELETE(_:NextRequest,{params}:Context) {
  const user=await adminUser(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
  if(user.role!=="SUPER_ADMIN" || !await safeMutation()) return NextResponse.json({error:"Forbidden"},{status:403});
  const {kind,id}=await params; if(!isKind(kind)) return NextResponse.json({error:"Not found"},{status:404});
  return await remove(kind,id,user.id)?new NextResponse(null,{status:204}):NextResponse.json({error:"Not found"},{status:404});
}
