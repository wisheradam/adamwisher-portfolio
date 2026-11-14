import { redirect } from "next/navigation";
import Link from "next/link";
import { adminUser } from "@/lib/admin/auth";
import { store } from "@/lib/admin/db";
import { AdminNav } from "@/components/admin/nav";
import "./admin.css";
export const dynamic="force-dynamic";
export default async function Admin() {
  const user=await adminUser();if(!user) redirect("/admin/login");

  const count=async(table:"projects"|"products",status:string)=> Number((await store.query(`SELECT count(*) AS n FROM ${table} WHERE status=$1 AND deleted_at IS NULL`,[status]))[0].n);
  const audit=user.role==="SUPER_ADMIN"?await store.query("SELECT action,entity_type,created_at FROM audit_events ORDER BY created_at DESC LIMIT 8"):[];
  const [published,drafts,released]=await Promise.all([count("projects","PUBLISHED"),count("projects","DRAFT"),count("products","RELEASED")]);
  return <main className="admin-shell"><AdminNav role={user.role}/><section className="admin-main"><header><p>AdamWisher.com</p><h1>Overview</h1><p>Manage content and products with explicit publishing.</p></header><div className="admin-stats"><article className="admin-card"><strong>{published}</strong><span>Published projects</span></article><article className="admin-card"><strong>{drafts}</strong><span>Draft projects</span></article><article className="admin-card"><strong>{released}</strong><span>Released apps & tools</span></article></div><div className="admin-actions"><Link href="/admin/projects">New project</Link><Link href="/admin/apps">New app</Link></div><section className="admin-card"><h2>Recent activity</h2>{audit.length?<ul>{audit.map((a,i)=><li key={i}>{a.action} · {a.entity_type} · {new Date(String(a.created_at)).toLocaleString()}</li>)}</ul>:<p>No changes yet.</p>}</section></section></main>;
}
