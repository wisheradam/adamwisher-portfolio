"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function LoginForm() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false); const router=useRouter();
  async function submit(event:React.FormEvent) {
    event.preventDefault(); setBusy(true);setError("");
    try {
      const response=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
      if(!response.ok) throw new Error("Invalid credentials");
      router.replace("/admin");router.refresh();
    } catch {setError("Sign in failed. Check your credentials.");}
    finally {setBusy(false);setPassword("");}
  }
  return <form onSubmit={submit} className="admin-card"><h1>Admin Console</h1><p>Sign in to manage AdamWisher.com.</p><label htmlFor="admin-email">Email</label><input id="admin-email" type="email" autoComplete="username" required value={email} onChange={e=>setEmail(e.target.value)} /><label htmlFor="admin-password">Password</label><input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} /><button disabled={busy}>{busy?"Signing in…":"Sign in"}</button>{error&&<p role="alert">{error}</p>}</form>;
}
