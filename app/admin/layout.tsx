import type { Metadata } from "next";
import "./admin.css";
export const metadata:Metadata={title:"Admin Console | Adam Wisher",robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}) {return <div>{children}</div>;}
