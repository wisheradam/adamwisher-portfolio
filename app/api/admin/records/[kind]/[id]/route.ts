import { NextRequest,NextResponse } from "next/server";
import { requirePermission,AdminAccessError,safeMutation } from "@/lib/admin/auth";
import { get,isKind,remove,validate,write } from "@/lib/admin/records";
export const runtime="nodejs";
type Context={params:Promise<{kind:string;id:string}>};
const failure=(e:unknown)=>e instanceof AdminAccessError?NextResponse.json({error:e.message},{status:e.status}):NextResponse.json({error:"Admin request unavailable"},{status:500});
export async function GET(_:NextRequest,{params}:Context){
  try{await requirePermission("content.view");const {kind,id}=await params;if(!isKind(kind))return NextResponse.json({error:"Not found"},{status:404});
    const record=await get(kind,id);return record?NextResponse.json(record):NextResponse.json({error:"Not found"},{status:404});
  }catch(e){return failure(e);}
}
export async function PATCH(request:NextRequest,{params}:Context){
  try{const user=await requirePermission("content.edit");if(!await safeMutation())return NextResponse.json({error:"Forbidden"},{status:403});
    const {kind,id}=await params;if(!isKind(kind))return NextResponse.json({error:"Not found"},{status:404});
    const before=await get(kind,id);if(!before)return NextResponse.json({error:"Not found"},{status:404});
    const input=validate(kind,await request.json());
    if(input.status==="PUBLISHED"||before.status==="PUBLISHED"||input.status==="ARCHIVED")await requirePermission("content.publish");
    const record=await write(kind,input,user.id,id);return NextResponse.json(record);
  }catch(e){if(e instanceof AdminAccessError)return failure(e);const message=e instanceof Error?e.message:"";const validation=/^(Invalid |Title is required|Slug, title and type are required|Not found|This route is reserved)/.test(message);return NextResponse.json({error:validation?message:"Unable to save record"},{status:validation?400:500});}
}
export async function DELETE(_:NextRequest,{params}:Context){
  try{const user=await requirePermission("content.delete");if(!await safeMutation())return NextResponse.json({error:"Forbidden"},{status:403});
    const {kind,id}=await params;if(!isKind(kind))return NextResponse.json({error:"Not found"},{status:404});
    return await remove(kind,id,user.id)?new NextResponse(null,{status:204}):NextResponse.json({error:"Not found"},{status:404});
  }catch(e){return failure(e);}
}
