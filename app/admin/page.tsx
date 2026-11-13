import { redirect } from "next/navigation";
import Link from "next/link";
import { adminUser } from "@/lib/admin/auth";
import { db } from "@/lib/admin/db";
import { AdminNav } from "@/components/admin/nav";
import "./admin.css";
export const dynamic="force-dynamic";
export default async function Admin() {
  if(!await adminUser()) redirect("/admin/login");
  const database=db();
  const count=(table:string,status:string)=> (database.prepare(`SELECT count(*) AS n FROM ${table} WHERE status=? AND deleted_at IS NULL`).get(status) as {n:number}).n;
  const audit=database.prepare("SELECT action,entity_type,created_at FROM audit_events ORDER BY created_at DESC LIMIT 8").all() as {action:string;entity_type:string;created_at:string}[];
  return <main className="admin-shell"><AdminNav/><section className="admin-main"><header><p>AdamWisher.com</p><h1>Overview</h1><p>Manage content and products with explicit publishing.</p></header><div className="admin-stats"><article className="admin-card"><strong>{count("projects","PUBLISHED")}</strong><span>Published projects</span></article><article className="admin-card"><strong>{count("projects","DRAFT")}</strong><span>Draft projects</span></article><article className="admin-card"><strong>{count("products","RELEASED")}</strong><span>Released apps & tools</span></article></div><div className="admin-actions"><Link href="/admin/projects">New project</Link><Link href="/admin/apps">New app</Link></div><section className="admin-card"><h2>Recent activity</h2>{audit.length?<ul>{audit.map((a,i)=><li key={i}>{a.action} · {a.entity_type} · {new Date(a.created_at).toLocaleString()}</li>)}</ul>:<p>No changes yet.</p>}</section></section></main>;
}
