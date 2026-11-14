import { notFound,redirect } from "next/navigation";
import { adminUser } from "@/lib/admin/auth";
import { can } from "@/lib/admin/permissions";
import { get } from "@/lib/admin/records";
import { ProductView } from "@/components/admin/product-view";
export const dynamic="force-dynamic";
export default async function AppPreview({params}:{params:Promise<{id:string}>}){
  const user=await adminUser();if(!user)redirect("/admin/login");if(!can(user.role,"content.preview"))notFound();
  const record=await get("products",(await params).id);if(!record)notFound();
  return <><p className="mx-auto mt-10 max-w-4xl px-6">Private preview · {record.status} · Not indexed</p><ProductView product={record}/></>;
}
