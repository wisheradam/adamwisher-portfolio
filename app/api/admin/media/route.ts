import { NextRequest,NextResponse } from "next/server";
import { requirePermission,AdminAccessError,safeMutation } from "@/lib/admin/auth";
import { listMedia,saveMedia,MediaError,mediaUploadLimit } from "@/lib/admin/media";
export const runtime="nodejs";
export const dynamic="force-dynamic";
const fail=(e:unknown)=>NextResponse.json({error:e instanceof MediaError||e instanceof AdminAccessError?e.message:"Media operation failed"},{status:e instanceof MediaError||e instanceof AdminAccessError?e.status:500});
export async function GET(request:NextRequest){try{await requirePermission("content.view");const q=(request.nextUrl.searchParams.get("q")??"").slice(0,100),page=Math.min(1000,Math.max(0,Number(request.nextUrl.searchParams.get("page"))||0));return NextResponse.json({records:await listMedia(q,page),maxUploadBytes:mediaUploadLimit()});}catch(e){return fail(e);}}
export async function POST(request:NextRequest){try{const actor=await requirePermission("media.upload");if(!await safeMutation())return NextResponse.json({error:"Forbidden"},{status:403});if(Number(request.headers.get("content-length"))>mediaUploadLimit()+1024*1024)return NextResponse.json({error:"File too large"},{status:413});const form=await request.formData(),file=form.get("file");if(!(file instanceof File))throw new MediaError("Select a file");return NextResponse.json(await saveMedia(file,actor.id),{status:201});}catch(e){return fail(e);}}
