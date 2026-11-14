import { NextResponse } from "next/server";
import { requirePermission,AdminAccessError } from "@/lib/admin/auth";
import { getMediaFile,MediaError } from "@/lib/admin/media";
export const runtime="nodejs";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){try{await requirePermission("content.view");const {row,bytes}=await getMediaFile((await params).id);return new NextResponse(new Uint8Array(bytes),{headers:{"content-type":String(row.mime_type),"content-disposition":`inline; filename="media.${String(row.mime_type).split("/")[1]}"`,"cache-control":"private, no-store","x-content-type-options":"nosniff","content-security-policy":"sandbox"}});}catch(e){return NextResponse.json({error:e instanceof MediaError||e instanceof AdminAccessError?e.message:"Media unavailable"},{status:e instanceof MediaError||e instanceof AdminAccessError?e.status:500});}}
