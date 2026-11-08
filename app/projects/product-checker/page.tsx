import { readFile } from "node:fs/promises";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PROJECTS_SESSION_COOKIE, verifyProjectsSession } from "@/lib/projects-auth";

export const dynamic = "force-dynamic";
export const metadata = {title: "Product Checker — Adam Wisher", robots: {index: false, follow: false}};
type Row = {id:string;sku:string;model:string;family:string;description:string;price_raw:string;currency:string;page:number;notes:string[];issues:string[]};
export default async function ProductChecker({searchParams}:{searchParams:Promise<{q?:string}>}) {
  if (!verifyProjectsSession((await cookies()).get(PROJECTS_SESSION_COOKIE)?.value)) redirect("/projects/login");
  const raw = (await searchParams).q;
  const q = typeof raw === "string" ? raw.trim().slice(0,160) : "";
  const file = process.env.PRODUCT_CHECKER_CATALOG_PATH;
  const rows:Row[]|null = file ? JSON.parse(await readFile(file,"utf8")) : null;
  const exact = rows?.filter(r=>r.sku?.toLowerCase()===q.toLowerCase()) ?? [];
  const terms = q.toLowerCase().split(/\s+/);
  const matches = !q ? [] : exact.length ? exact : (rows??[]).filter(r=>{
    const s = [r.sku,r.model,r.family,r.description].join(" ").toLowerCase();
    return terms.every(t=>s.includes(t));
  });
  return <main className="mx-auto max-w-4xl px-6 py-16">
    <a href="/projects" className="focus-ring text-sm underline">Back to Projects</a>
    <p className="mt-12 font-mono text-xs uppercase tracking-wide">INNOVA · Listino 2026</p>
    <h1 className="mt-3 font-display text-5xl">Product Checker</h1>
    <p className="my-6 text-muted-foreground">Look up a product, its listed price and catalog notes.</p>
    {rows ? <><form className="flex gap-3"><input aria-label="SKU, model or description" name="q" defaultValue={q} maxLength={160} placeholder="SKU, model or description" className="min-w-0 flex-1 rounded border border-border bg-surface p-3"/><button className="rounded border border-border px-4">Search</button></form>
    {q && <p className="my-5">{matches.length} matching records{matches.length>50 ? " · showing the first 50; refine your search" : ""}</p>}
    {matches.slice(0,50).map(r=><article key={r.id} className="my-4 rounded border border-border p-5"><h2 className="font-display text-xl">{r.sku || r.model}</h2><p>{[r.family,r.model].filter(Boolean).join(" · ")}</p><p className="my-2">{r.description}</p><p>Listed price: {r.price_raw || "Not listed"} {r.price_raw && r.currency}</p><p>Listino 2026 · p. {r.page}</p>{!!(r.notes.length+r.issues.length) && <details className="mt-3"><summary>Page notes and linked issues</summary>{[...r.notes,...r.issues].map((n,i)=><p key={i} className="mt-2">{n}</p>)}</details>}</article>)}</> : <p>The catalog has not been connected to this installation.</p>}
  </main>;
}
