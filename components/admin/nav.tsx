"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
const sections=["Overview","Content","Projects","Apps","Experience","Education","Timeline","Releases","Ask Adam","Messages","Media","SEO","Redirects","Feature Flags","Users","Audit Log","Settings"];
export function AdminNav(){const router=useRouter();return <nav className="admin-nav" aria-label="Admin navigation"><Link href="/admin" className="admin-brand">Adam Wisher <span>Admin</span></Link>{sections.map(section=><Link key={section} href={section==="Overview"?"/admin":`/admin/${section.toLowerCase().replaceAll(" ","-")}`}>{section}</Link>)}<button onClick={async()=>{await fetch("/api/admin/logout",{method:"POST"});router.replace("/admin/login");router.refresh();}}>Sign out</button></nav>}
