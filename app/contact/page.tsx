import type { Metadata } from "next";
import Link from "next/link";
import { ContactPanel } from "@/components/contact/contact-panel";

export const metadata: Metadata = { title: "Contact — Adam Wisher", description: "Get in touch with Adam Wisher about product management, AI, digital products, and professional opportunities." };

export default function ContactPage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-6 py-8 lg:px-12 lg:py-12">
      <header className="flex items-center justify-between border-b border-border pb-6">
        <Link href="/" className="focus-ring rounded-sm font-display text-sm font-medium">Adam Wisher</Link>
        <Link href="/" className="focus-ring rounded-sm font-mono text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground">← Home</Link>
      </header>
      <section className="py-16 lg:py-24" aria-labelledby="contact-heading">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Contact</p>
        <h1 id="contact-heading" className="mt-4 max-w-3xl font-display text-4xl font-medium tracking-tight sm:text-6xl">Let’s start a conversation.</h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">Have a product challenge, a collaboration in mind, or a professional opportunity? Get in touch.</p>
        <ContactPanel />
      </section>
    </main>
  );
}
