import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Inbox, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Mail — Adam Wisher",
  description: "Secure sign-in to the Mail@adamwisher.com inbox.",
};

export default function MailPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-12 lg:py-12">
        <header className="flex items-center justify-between border-b border-border pb-6">
          <Link href="/" className="focus-ring rounded-sm font-display text-sm font-medium">
            Adam Wisher
          </Link>
          <Link
            href="/"
            className="focus-ring flex items-center gap-2 rounded-sm font-mono text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to site
          </Link>
        </header>

        <section className="mx-auto grid min-h-[72vh] max-w-4xl content-center gap-12 py-16 lg:grid-cols-[1fr_0.8fr] lg:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">
              Personal mailbox
            </p>
            <h1 className="mt-5 font-display text-5xl font-medium leading-[0.98] tracking-[-0.045em] sm:text-7xl">
              Your mail,<br />in one place.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Sign in to read messages sent to your personal mailbox.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex size-12 items-center justify-center rounded-md border border-border bg-background text-accent">
                <Inbox size={22} aria-hidden="true" />
              </div>
              <span className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                <ShieldCheck size={13} aria-hidden="true" />
                Secure sign-in
              </span>
            </div>

            <p className="mt-8 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              Mailbox
            </p>
            <p className="mt-2 break-all font-display text-xl sm:text-2xl">
              Mail@adamwisher.com
            </p>

            <a
              href="https://mail.adamwisher.com/account/"
              target="_blank"
              rel="noopener noreferrer"
              className="focus-ring mt-8 flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-accent px-5 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Open mailbox
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>

            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Sign-in and messages are handled securely by the mail service. This
              page never asks for or stores your password.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
