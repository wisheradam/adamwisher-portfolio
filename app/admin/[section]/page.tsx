import { notFound,redirect } from "next/navigation";
import { adminUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
import { AdminNav } from "@/components/admin/nav";
import { Console } from "@/components/admin/console";
import "../admin.css";
const sections=["content","projects","apps","experience","education","timeline","releases","ask-adam","messages","media","seo","redirects","feature-flags","users","audit-log","settings"];
export const dynamic="force-dynamic";
export default async function Section({params}:{params:Promise<{section:string}>}) {
  const user=await adminUser();if(!user)redirect("/admin/login");
  const {section}=await params; if(!sections.includes(section)) notFound();
  if(section==="users"&&!can(user.role,"users.manage"))notFound();
  if(section==="audit-log"&&!can(user.role,"audit.view"))notFound();
  return <main className="admin-shell"><AdminNav role={user.role}/><div className="admin-main"><Console section={section} role={user.role}/></div></main>;
}
