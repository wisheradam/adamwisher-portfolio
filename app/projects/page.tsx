import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowUpRight, LockKeyhole, LogOut } from "lucide-react";
import {
  PROJECTS_SESSION_COOKIE,
  verifyProjectsSession,
} from "@/lib/projects-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Projects — Adam Wisher",
  description: "Private project overview for Adam Wisher.",
  robots: { index: false, follow: false, nocache: true },
};

const projects = [
  {
    title: "INNOVA SN Decoder",
    category: "INNOVA · Internal tooling",
    status: "Active",
    summary: "Private project workspace for the SN Decoder initiative. Scope, milestones, and delivery status can be expanded here as the project develops.",
    accent: "border-blue-400/30 bg-blue-400/10 text-blue-300",
  },
  {
    title: "Single Source of Truth",
    category: "INNOVA · Systems · Data · Operations",
    status: "Active",
    summary: "Company-wide synchronization across product, sales, manufacturing, logistics, engineering, and product-development data.",
    accent: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  },
  {
    title: "AI Assistant for Technical & VIP Support",
    category: "INNOVA · AI · CRM · CPQ",
    status: "Active",
    summary: "A grounded multi-source assistant connecting verified knowledge with product data, compatibility logic, and ordering workflows.",
    accent: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  },
  {
    title: "INNOVA Knowledge & Training Ecosystem",
    category: "INNOVA · Knowledge · Enablement",
    status: "Active",
    summary: "A governed knowledge system for support, onboarding, partner training, certification, and document standards.",
    accent: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  },
  {
    title: "Business Systems Transformation",
    category: "Enterprise · CPQ · Architecture",
    status: "Roadmap",
    summary: "A research-led roadmap from Zoho to Salesforce, NetSuite, and Slack, with CPQ and connected operations at the center.",
    accent: "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-300",
  },
  {
    title: "Check2Go",
    category: "TravelTech · 0→1 · USA",
    status: "Portfolio",
    summary: "A travel startup led from initial concept and team build through alpha, localization, and investor readiness.",
    accent: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  },
];

export default async function ProjectsPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(PROJECTS_SESSION_COOKIE)?.value;

  if (!verifyProjectsSession(session)) {
    redirect("/projects/login");
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-12 lg:py-12">
        <header className="flex items-center justify-between border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <span className="font-display text-sm font-medium">Adam Wisher</span>
            <span className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
              <LockKeyhole size={11} aria-hidden="true" />
              Private
            </span>
          </div>
          <form action="/api/projects/logout" method="post">
            <button
              type="submit"
              className="focus-ring flex items-center gap-2 rounded-sm font-mono text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign out
              <LogOut size={14} aria-hidden="true" />
            </button>
          </form>
        </header>

        <section className="py-16 lg:py-24" aria-labelledby="projects-heading">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent">Projects overview</p>
            <h1 id="projects-heading" className="mt-4 font-display text-4xl font-medium tracking-tight sm:text-6xl">
              Current initiatives and product work.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              A private, evolving view of active initiatives, strategic workstreams, and selected portfolio projects.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <article key={project.title} className="flex min-h-72 flex-col justify-between rounded-lg border border-border bg-surface p-6">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {project.category}
                    </p>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-wide ${project.accent}`}>
                      {project.status}
                    </span>
                  </div>
                  <h2 className="mt-8 font-display text-2xl font-medium tracking-tight">{project.title}</h2>
                  <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{project.summary}</p>
                </div>
                <div className="mt-8 flex items-center justify-between border-t border-border pt-4 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  <span>Project brief</span>
                  <ArrowUpRight size={14} aria-hidden="true" />
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
