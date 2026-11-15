import {NextResponse} from 'next/server';
import {getPublicMediaFile,MediaError} from '@/lib/admin/media';
export const runtime='nodejs';export const dynamic='force-dynamic';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 try{const {row,bytes}=await getPublicMediaFile((await params).id);return new NextResponse(new Uint8Array(bytes),{headers:{'content-type':String(row.mime_type),'cache-control':'private, no-store','x-content-type-options':'nosniff','content-security-policy':'sandbox','content-disposition':'inline; filename="published-media"','x-robots-tag':'noindex, nofollow'}});}
 catch(e){return NextResponse.json({error:e instanceof MediaError?e.message:'Media unavailable'},{status:e instanceof MediaError?e.status:503,headers:{'cache-control':'no-store'}});}
}
