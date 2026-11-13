import { notFound,redirect } from "next/navigation";
import { adminUser } from "@/lib/admin/auth";
import { AdminNav } from "@/components/admin/nav";
import { Console } from "@/components/admin/console";
import "../admin.css";
const sections=["content","projects","apps","experience","education","timeline","releases","ask-adam","messages","media","seo","redirects","feature-flags","users","audit-log","settings"];
export const dynamic="force-dynamic";
export default async function Section({params}:{params:Promise<{section:string}>}) {
  if(!await adminUser()) redirect("/admin/login");
  const {section}=await params; if(!sections.includes(section)) notFound();
  return <main className="admin-shell"><AdminNav/><div className="admin-main"><Console section={section}/></div></main>;
}
