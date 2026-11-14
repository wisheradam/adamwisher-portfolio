import { notFound,redirect } from "next/navigation";
import { adminUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
import { get } from "@/lib/admin/records";
import Link from "next/link";
export const dynamic="force-dynamic";
export default async function Preview({params}:{params:Promise<{id:string}>}) {
  const user=await adminUser();if(!user) redirect("/admin/login");if(!can(user.role,"content.preview"))notFound();
  const record=await get("projects",(await params).id); if(!record) notFound();
  return <main style={{maxWidth:800,margin:"5rem auto",padding:24}}><p>Private preview · not indexed</p><h1>{String(record.title)}</h1><p>{String(record.summary)}</p><article style={{whiteSpace:"pre-wrap"}}>{String(record.body)}</article><p><Link href="/admin/projects">Back to admin</Link></p></main>;
}
