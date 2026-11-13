import { redirect } from "next/navigation";
import { adminUser } from "@/lib/admin/auth";
import { LoginForm } from "@/components/admin/login-form";
export const dynamic="force-dynamic";
export default async function Login() {
  if(await adminUser()) redirect("/admin");
  return <main className="admin-login"><LoginForm /></main>;
}
