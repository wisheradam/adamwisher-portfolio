import { randomUUID } from "node:crypto";
import { NextRequest,NextResponse } from "next/server";
import { requirePermission,AdminAccessError,safeMutation } from "@/lib/admin/auth";
import { store } from "@/lib/admin/db";
export const runtime="nodejs";
export async function PATCH(request:NextRequest,{params}:{params:Promise<{id:string}>}){
  try{const actor=await requirePermission("users.manage");if(!await safeMutation())return NextResponse.json({error:"Forbidden"},{status:403});
    const {id}=await params,data=await request.json();if(!["SUPER_ADMIN","EDITOR","READ_ONLY"].includes(data.role)||typeof data.active!=="boolean")return NextResponse.json({error:"Invalid role or status"},{status:400});
    const result=await store.transaction(async query=>{
      const admins=await query("SELECT id FROM admin_users WHERE role='SUPER_ADMIN' AND active=TRUE ORDER BY id FOR UPDATE");
      const before=(await query("SELECT id,email,role,active FROM admin_users WHERE id=$1 FOR UPDATE",[id]))[0];if(!before)return null;
      if(before.role==="SUPER_ADMIN"&&before.active&&(data.role!=="SUPER_ADMIN"||!data.active)&&admins.length<=1)throw new Error("LAST_SUPER_ADMIN");
      const now=new Date().toISOString();await query("UPDATE admin_users SET role=$1,active=$2,session_version=session_version+1,updated_at=$3 WHERE id=$4",[data.role,data.active,now,id]);
      await query("DELETE FROM admin_sessions WHERE user_id=$1",[id]);
      await query("INSERT INTO audit_events(id,actor_id,action,entity_type,entity_id,before_state,after_state,created_at) VALUES($1,$2,'USER_CHANGED','admin_users',$3,$4,$5,$6)",[randomUUID(),actor.id,id,JSON.stringify(before),JSON.stringify({role:data.role,active:data.active}),now]);
      return {id,email:before.email,role:data.role,active:data.active};
    });return result?NextResponse.json(result):NextResponse.json({error:"Not found"},{status:404});
  }catch(e){if(e instanceof AdminAccessError)return NextResponse.json({error:e.message},{status:e.status});if(e instanceof Error&&e.message==="LAST_SUPER_ADMIN")return NextResponse.json({error:"At least one active Super Admin is required"},{status:409});return NextResponse.json({error:"Unable to update user"},{status:500});}
}
