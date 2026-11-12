import { SiteHeader } from "@/components/site-header";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import {
  isProjectsAuthConfigured,
  PROJECTS_SESSION_COOKIE,
  verifyProjectsSession,
} from "@/lib/projects-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects — Private access",
  description: "Private project workspace for Adam Wisher.",
  robots: { index: false, follow: false, nocache: true },
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ProjectsLoginPage({
  searchParams,
}: LoginPageProps) {
  const cookieStore = await cookies();
  if (verifyProjectsSession(cookieStore.get(PROJECTS_SESSION_COOKIE)?.value)) {
    redirect("/projects");
  }

  const { error } = await searchParams;
  const configured = isProjectsAuthConfigured();

  return (
    <main className="min-h-screen">
      <div className="page-shell route-page">
        <SiteHeader />

        <section className="login-panel route-content">
          <div>
            <p className="pill inline-flex">Private workspace</p>
            <h1 className="mt-5 font-display text-5xl font-medium leading-[0.98] tracking-[-0.045em] sm:text-7xl">
              Projects,
              <br />
              kept private.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Sign in to view the internal project overview and current
              workstreams.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-surface p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex size-12 items-center justify-center rounded-md border border-border bg-background text-accent">
                <LockKeyhole size={22} aria-hidden="true" />
              </div>
              <span className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                <ShieldCheck size={13} aria-hidden="true" />
                Server protected
              </span>
            </div>

            <form action="/api/projects/login" method="post" className="mt-8">
              <label
                htmlFor="password"
                className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground"
              >
                Access password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={!configured}
                className="focus-ring mt-3 h-12 w-full rounded-md border border-border bg-background px-4 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Enter password"
              />

              {error === "invalid" ? (
                <p role="alert" className="mt-3 text-sm text-red-400">
                  The password is incorrect. Please try again.
                </p>
              ) : null}
              {!configured || error === "configuration" ? (
                <p role="alert" className="mt-3 text-sm text-red-400">
                  Private access is not configured yet.
                </p>
              ) : null}

              <button
                type="submit"
                disabled={!configured}
                className="focus-ring mt-5 flex min-h-12 w-full items-center justify-center rounded-md bg-accent px-5 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Open projects
              </button>
            </form>

            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Authentication is checked on the server. The password is never
              stored in this page or sent to client-side code.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
