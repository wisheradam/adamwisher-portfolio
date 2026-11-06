"use client";

import { useRef, useState } from "react";
import { Mail, Phone, ArrowUpRight, CheckCircle2 } from "lucide-react";

const inputStyle = "focus-ring mt-2 w-full rounded-md border border-border bg-background px-4 py-3 text-sm placeholder:text-muted-foreground disabled:opacity-50";

export function ContactPanel() {
  const [phone, setPhone] = useState<string>();
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const startedAt = useRef(Date.now());

  async function revealPhone() {
    setPhoneLoading(true); setPhoneError("");
    try {
      const response = await fetch("/api/contact/phone", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPhone(data.phone);
    } catch { setPhoneError("Please try again later or contact me by email."); }
    finally { setPhoneLoading(false); }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSending(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/contact", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.get("name"), email: form.get("email"), purpose: form.get("purpose"), message: form.get("message"), website: form.get("website"), consent: form.get("consent") === "on", startedAt: startedAt.current }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setSent(true);
    } catch (error) { setError(error instanceof Error ? error.message : "Please email me directly or try again later."); }
    finally { setSending(false); }
  }

  return (
    <div className="mt-12 grid items-start gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
      <div className="space-y-4">
        <a href="mailto:Mail@adamwisher.com" className="focus-ring block rounded-lg border border-border bg-surface p-6 transition-colors hover:border-accent/50 sm:p-8">
          <Mail className="text-accent" size={24} aria-hidden="true" />
          <p className="mt-6 font-mono text-xs uppercase tracking-wide text-muted-foreground">Email</p>
          <div className="mt-2 flex items-center justify-between gap-3"><span className="break-all font-display text-xl sm:text-2xl">Mail@adamwisher.com</span><ArrowUpRight size={18} aria-hidden="true" /></div>
        </a>
        <div className="rounded-lg border border-border bg-surface p-6 sm:p-8">
          <Phone className="text-accent" size={24} aria-hidden="true" />
          <p className="mt-6 font-mono text-xs uppercase tracking-wide text-muted-foreground">Phone</p>
          {phone ? <a href={`tel:${phone}`} className="focus-ring mt-2 inline-block rounded-sm font-display text-2xl">{phone}</a> : <p className="mt-2 select-none font-display text-2xl text-muted-foreground" aria-label="Phone number hidden">+972 •• ••• •• ••</p>}
          {!phone ? <button onClick={revealPhone} disabled={phoneLoading} aria-expanded={Boolean(phone)} className="focus-ring mt-5 rounded-md border border-border px-4 py-2.5 text-sm transition-colors hover:border-accent disabled:opacity-50">{phoneLoading ? "Revealing…" : "Show phone number"}</button> : null}
          <p className="mt-4 text-sm text-muted-foreground">Prefer a scheduled conversation? Choose “Request a call” in the form.</p>
          {phoneError ? <p role="alert" className="mt-3 text-sm text-red-400">{phoneError}</p> : null}
        </div>
      </div>

      <section aria-labelledby="request-heading" className="rounded-lg border border-border bg-surface p-6 sm:p-8">
        <h2 id="request-heading" className="font-display text-2xl font-medium tracking-tight">Send a request</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Tell me what you have in mind and how I can help.</p>
        {sent ? <div role="status" className="py-12"><CheckCircle2 className="text-accent" size={32} aria-hidden="true" /><h3 className="mt-5 font-display text-xl">Your request has been sent.</h3><p className="mt-3 text-sm text-muted-foreground">Thank you. I’ll reply to the email address you provided.</p><button onClick={() => { setSent(false); startedAt.current = Date.now(); }} className="focus-ring mt-6 rounded-sm text-sm text-accent">Send another request</button></div> : (
          <form onSubmit={submit} className="mt-8 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm">Your name<input className={inputStyle} name="name" autoComplete="name" required minLength={2} maxLength={100} disabled={sending} /></label>
              <label className="text-sm">Email address<input className={inputStyle} name="email" type="email" autoComplete="email" required maxLength={254} disabled={sending} /></label>
            </div>
            <label className="block text-sm">Request type<select className={inputStyle} name="purpose" disabled={sending}><option>Project inquiry</option><option>Professional opportunity</option><option>Request a call</option><option>Other</option></select></label>
            <label className="block text-sm">Your message<textarea className={`${inputStyle} min-h-40 resize-y`} name="message" required minLength={10} maxLength={5000} disabled={sending} placeholder="A little context, your goals, and any useful details…" /></label>
            <div className="hidden" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
            <label className="flex items-start gap-3 text-xs leading-relaxed text-muted-foreground"><input type="checkbox" name="consent" required disabled={sending} className="focus-ring mt-1 accent-blue-500" />I agree that my name, email, and message will be used to respond to this request.</label>
            <p className="text-xs leading-relaxed text-muted-foreground">Your request is emailed to me. Please avoid sharing passwords or sensitive information.</p>
            {error ? <p role="alert" className="text-sm text-red-400">{error}</p> : null}
            <button type="submit" disabled={sending} className="focus-ring flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50">{sending ? "Sending…" : "Send request"}<ArrowUpRight size={16} aria-hidden="true" /></button>
          </form>
        )}
      </section>
    </div>
  );
}
