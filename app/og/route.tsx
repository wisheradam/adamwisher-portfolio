import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { metadataForPath,resolvePublicPage } from "@/lib/seo/public-pages";
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'no-store, max-age=0','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'};
export async function GET(request:NextRequest){
 const path=request.nextUrl.searchParams.get('path')??'/';
 const page=await resolvePublicPage(path);
 if(!page)return new Response(null,{status:404,headers});
 const metadata=await metadataForPath(path);
 const title=String(metadata.openGraph?.title??page.title).slice(0,140);
 const description=String(metadata.openGraph?.description??page.description).slice(0,220);
 return new ImageResponse(<div style={{display:'flex',flexDirection:'column',width:'100%',height:'100%',padding:'68px',color:'#172d46',background:'linear-gradient(135deg, #f6fbff, #daeafa 65%, #f8e9ee)',fontFamily:'sans-serif'}}>
  <div style={{display:'flex',fontSize:26,letterSpacing:3}}>ADAM WISHER</div>
  <div style={{display:'flex',flexDirection:'column',marginTop:38,padding:'42px',border:'2px solid rgba(255,255,255,0.9)',borderRadius:30,background:'rgba(255,255,255,0.65)',flex:1}}>
   <div style={{display:'flex',fontSize:title.length>75?42:56,lineHeight:1.15,fontWeight:600}}>{title}</div>
   <div style={{display:'flex',marginTop:24,fontSize:25,lineHeight:1.4,color:'#42566e'}}>{description}</div>
  </div><div style={{display:'flex',marginTop:28,fontSize:22}}>adamwisher.com</div>
 </div>,{width:1200,height:630,headers});
}
