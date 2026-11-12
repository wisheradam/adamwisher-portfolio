import { SiteHeader } from "@/components/site-header";
import type { Metadata } from "next";
import { ContactPanel } from "@/components/contact/contact-panel";

export const metadata: Metadata = { title: "Contact — Adam Wisher", description: "Get in touch with Adam Wisher about product management, AI, digital products, and professional opportunities." };

export default function ContactPage() {
  return (
    <main className="page-shell route-page">
      <SiteHeader />
      <section className="py-16 lg:py-24" aria-labelledby="contact-heading">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Contact</p>
        <h1 id="contact-heading" className="mt-4 max-w-3xl font-display text-4xl font-medium tracking-tight sm:text-6xl">Let’s start a conversation.</h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">Have a product challenge, a collaboration in mind, or a professional opportunity? Get in touch.</p>
        <ContactPanel />
      </section>
    </main>
  );
}
