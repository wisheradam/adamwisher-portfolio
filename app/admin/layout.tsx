import type { Metadata } from "next";
import { NOINDEX } from "@/lib/seo/site";
import "./admin.css";
export const metadata:Metadata={...NOINDEX,title:"Admin Console | Adam Wisher"};
export default function Layout({children}:{children:React.ReactNode}) {return <div>{children}</div>;}
