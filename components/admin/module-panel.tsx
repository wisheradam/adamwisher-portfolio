"use client";
import { useCallback,useEffect,useState } from "react";
import { can,type AdminRole } from "@/lib/admin/permissions";
import { fieldsFor,modules,type ModuleName } from "@/lib/admin/module-config";
type Value=string|number|boolean|null;
type RecordRow=Record<string,Value> & {id:string;updated_at:string;status?:string};
const managed=(module:ModuleName)=>!["redirects","feature-flags","seo"].includes(module);
export function ModulePanel({module,role}:{module:ModuleName;role:AdminRole}){
 const config=modules[module],fields=fieldsFor(module),privileged=["redirects","feature-flags"].includes(module);
 const canEdit=can(role,privileged?(module==="redirects"?"redirects.manage":"flags.manage"):"content.edit");
 const [rows,setRows]=useState<RecordRow[]>([]),[search,setSearch]=useState(""),[page,setPage]=useState(0),[editing,setEditing]=useState<RecordRow|null>(null),[form,setForm]=useState<Record<string,Value>>({}),[open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const load=useCallback(async()=>{try{const res=await fetch(`/api/admin/modules/${module}?q=${encodeURIComponent(search)}&page=${page}`);const data=await res.json();if(!res.ok)throw new Error(data.error);setRows(data.records);}catch(e){setError(e instanceof Error?e.message:"Unable to load records");}},[module,search,page]);
 useEffect(()=>{void load();},[load]);
 function begin(row?:RecordRow){setError("");setNotice("");setEditing(row??null);setForm(row??{});setOpen(true);}
 function change(name:string,value:Value){setForm(prev=>({...prev,[name]:value}));}
 async function submit(e:React.FormEvent){e.preventDefault();setError("");setNotice("");if(form.status==="PUBLISHED"&&editing?.status!=="PUBLISHED"&&!window.confirm("Publish this record publicly?"))return;
 setBusy(true);try{const res=await fetch(`/api/admin/modules/${module}${editing?`/${editing.id}`:""}`,{method:editing?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const data=await res.json();if(!res.ok)throw new Error(data.error);setOpen(false);setNotice("Saved successfully.");await load();}catch(e){setError(e instanceof Error?e.message:"Unable to save record");}finally{setBusy(false);}}
 async function remove(row:RecordRow){if(!window.confirm(`Delete ${String(row[config.primary]||"this record")}? This action is recorded in the audit log.`))return;setError("");const res=await fetch(`/api/admin/modules/${module}/${row.id}`,{method:"DELETE"});if(!res.ok){const data=await res.json();setError(data.error??"Unable to delete");return;}setNotice("Record deleted.");await load();}
 return <section><div className="admin-heading"><div><h1>{config.title}</h1><p>{managed(module)?"Draft and private records are excluded from public content. Existing static pages are preserved during migration.":"Changes are audited and validated on the server. Public runtime integration is pending."}</p></div>{canEdit&&<button onClick={()=>begin()}>New record</button>}</div>
 <label htmlFor="module-search">Search {config.title}</label><input id="module-search" value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} />
 {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 <div className="admin-card admin-table"><table><thead><tr><th scope="col">{fields.find(f=>f.name===config.primary)?.label}</th><th scope="col">Status</th><th scope="col">Updated</th><th scope="col">Actions</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td>{String(row[config.primary]??"")}</td><td>{row.status??(row.enabled?"Enabled":"Disabled")}</td><td>{new Date(row.updated_at).toLocaleDateString()}</td><td>{canEdit?<><button onClick={()=>begin(row)}>Edit</button> {can(role,"content.delete")&&<button onClick={()=>void remove(row)}>Delete</button>}</>:"View only"}</td></tr>)}</tbody></table>{rows.length===0&&<p>No records found.</p>}</div>
 <div className="admin-pages"><button disabled={page===0} onClick={()=>setPage(p=>p-1)}>Previous</button><span>Page {page+1}</span><button disabled={rows.length<25} onClick={()=>setPage(p=>p+1)}>Next</button></div>
 {open&&<form className="admin-card admin-editor" onSubmit={submit}><h2>{editing?"Edit":"New"} {config.title}</h2>{fields.map(field=><label key={field.name}>{field.label}{field.type==="boolean"?<input type="checkbox" checked={Boolean(form[field.name])} onChange={e=>change(field.name,e.target.checked)} />:field.type==="textarea"?<textarea value={String(form[field.name]??"")} onChange={e=>change(field.name,e.target.value)} />:field.type==="select"?<select value={String(form[field.name]??"")} onChange={e=>change(field.name,e.target.value)}><option value="">Select</option>{field.options?.map(option=><option key={option} value={option}>{option.replaceAll("_"," ")}</option>)}</select>:<input required={field.required} type={field.type==="date"?"text":field.type==="url"?"url":field.type==="integer"?"number":"text"} min={field.type==="integer"?0:undefined} value={String(form[field.name]??"")} onChange={e=>change(field.name,field.type==="integer"?Number(e.target.value):e.target.value)} />}</label>)}
 <div><button disabled={busy}>{busy?"Saving…":"Save"}</button> <button type="button" onClick={()=>setOpen(false)}>Cancel</button></div>{error&&<p role="alert">{error}</p>}</form>}
 </section>;
}
