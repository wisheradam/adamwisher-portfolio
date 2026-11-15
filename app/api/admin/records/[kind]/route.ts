import { NextRequest,NextResponse } from "next/server";
import { requirePermission,AdminAccessError,safeMutation } from "@/lib/admin/auth";
import { isKind,list,validate,write } from "@/lib/admin/records";
export const runtime="nodejs";
const failure=(e:unknown)=>e instanceof AdminAccessError?NextResponse.json({error:e.message},{status:e.status}):NextResponse.json({error:"Admin request unavailable"},{status:500});
export async function GET(request:NextRequest,{params}:{params:Promise<{kind:string}>}){
  try{await requirePermission("content.view");const {kind}=await params;if(!isKind(kind))return NextResponse.json({error:"Not found"},{status:404});
    const search=(request.nextUrl.searchParams.get("q")??"").slice(0,100),page=Math.min(1000,Math.max(0,Number(request.nextUrl.searchParams.get("page"))||0));
    return NextResponse.json({records:await list(kind,search,page*25),page});
  }catch(e){return failure(e);}
}
export async function POST(request:NextRequest,{params}:{params:Promise<{kind:string}>}){
  try{const user=await requirePermission("content.edit");if(!await safeMutation())return NextResponse.json({error:"Forbidden"},{status:403});
    const {kind}=await params;if(!isKind(kind))return NextResponse.json({error:"Not found"},{status:404});
    const input=validate(kind,await request.json());
    if(input.status==="PUBLISHED")await requirePermission("content.publish");
    return NextResponse.json(await write(kind,input,user.id),{status:201});
  }catch(e){if(e instanceof AdminAccessError)return failure(e);const message=e instanceof Error?e.message:"";const validation=/^(Invalid |Title is required|Slug, title and type are required|This route is reserved)/.test(message);return NextResponse.json({error:validation?message:"Unable to save record"},{status:validation?400:500});}
}
