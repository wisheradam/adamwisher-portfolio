import { NextResponse } from "next/server";
import { requirePermission,AdminAccessError } from "@/lib/admin/auth";
import { store } from "@/lib/admin/db";
export const runtime="nodejs";
export async function GET(){try{await requirePermission("audit.view");return NextResponse.json({events:await store.query("SELECT id,actor_id,action,entity_type,entity_id,created_at FROM audit_events ORDER BY created_at DESC LIMIT 100")});}catch(e){if(e instanceof AdminAccessError)return NextResponse.json({error:e.message},{status:e.status});return NextResponse.json({error:"Unavailable"},{status:500});}}
