import Link from "next/link";

export interface ProjectCardProps {
  title: string;
  category?: string;
  summary?: string;
  role?: string;
  visualSrc?: string;
  href?: string;
  isPlaceholder?: boolean;
  visual?: "ssot" | "check2go" | "knowledge" | "transformation";
}

function SsotVisual() {
  const systems = ["CRM", "ERP", "R&D", "3PL"];

  return (
    <div className="relative aspect-[4/3] overflow-hidden border-b border-border bg-[#0d1117] p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.16),transparent_58%)]" />
      <div className="relative grid h-full grid-cols-2 gap-3">
        {systems.map((system) => (
          <div key={system} className="flex items-center justify-center rounded-md border border-white/10 bg-white/[0.025] font-mono text-[10px] tracking-[0.18em] text-white/45">
            {system}
          </div>
        ))}
      </div>
      <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-blue-400/50 bg-[#101a2b] shadow-[0_0_40px_rgba(59,130,246,0.2)]">
        <span className="font-display text-sm font-medium tracking-tight text-white">SSOT</span>
      </div>
    </div>
  );
}

function Check2GoVisual() {
  const stages = ["Idea", "Validate", "Build", "Alpha"];

  return (
    <div className="relative aspect-[4/3] overflow-hidden border-b border-border bg-[#071512] p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_22%,rgba(45,212,191,0.18),transparent_48%)]" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-200/55">TravelTech · USA</span>
          <span className="rounded-full border border-emerald-300/20 px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-emerald-200/50">0→1</span>
        </div>
        <div>
          <div className="mb-4 flex items-center gap-1.5">
            {stages.map((stage, index) => (
              <div key={stage} className="flex min-w-0 flex-1 items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-300/70" />
                {index < stages.length - 1 && <span className="h-px flex-1 bg-emerald-300/20" />}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2 font-mono text-[8px] text-emerald-100/40">
            {stages.map((stage) => <span key={stage}>{stage}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function KnowledgeVisual() {
  const domains = ["Support", "Onboarding", "Training", "Standards"];

  return (
    <div className="relative aspect-[4/3] overflow-hidden border-b border-border bg-[#14120c] p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(250,204,21,0.15),transparent_55%)]" />
      <div className="relative grid h-full grid-cols-2 gap-3">
        {domains.map((domain) => (
          <div key={domain} className="flex items-center justify-center rounded-md border border-amber-200/10 bg-white/[0.025] font-mono text-[9px] uppercase tracking-[0.12em] text-amber-100/45">
            {domain}
          </div>
        ))}
      </div>
      <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-amber-300/40 bg-[#211d10] shadow-[0_0_40px_rgba(250,204,21,0.14)]">
        <span className="font-display text-xs font-medium text-white">ONE</span>
        <span className="font-mono text-[7px] uppercase tracking-wider text-amber-100/50">Knowledge</span>
      </div>
    </div>
  );
}

function TransformationVisual() {
  const stack = ["Salesforce", "NetSuite", "Slack", "Factory"];

  return (
    <div className="relative aspect-[4/3] overflow-hidden border-b border-border bg-[#110d1c] p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.18),transparent_58%)]" />
      <div className="relative grid h-full grid-cols-2 gap-3">
        {stack.map((system) => (
          <div key={system} className="flex items-center justify-center rounded-md border border-violet-200/10 bg-white/[0.025] font-mono text-[9px] uppercase tracking-[0.1em] text-violet-100/45">
            {system}
          </div>
        ))}
      </div>
      <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-violet-300/40 bg-[#20142f] shadow-[0_0_40px_rgba(168,85,247,0.18)]">
        <span className="font-display text-sm font-medium text-white">CPQ</span>
        <span className="font-mono text-[7px] uppercase tracking-wider text-violet-100/50">Core logic</span>
      </div>
    </div>
  );
}

export function ProjectCard({
  title,
  category,
  summary,
  role,
  visualSrc,
  href,
  isPlaceholder = false,
  visual,
}: ProjectCardProps) {
  const content = (
    <div className="group flex h-full flex-col justify-between overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-white/20">
      {visual === "ssot" ? (
        <SsotVisual />
      ) : visual === "check2go" ? (
        <Check2GoVisual />
      ) : visual === "knowledge" ? (
        <KnowledgeVisual />
      ) : visual === "transformation" ? (
        <TransformationVisual />
      ) : visualSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={visualSrc} alt="" className="aspect-[4/3] w-full border-b border-border object-cover" />
      ) : (
        <div aria-hidden="true" className="aspect-[4/3] w-full border-b border-border bg-white/[0.02]" />
      )}

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          {category && <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">{category}</span>}
          <h3 className="mt-2 font-display text-lg font-medium">{title}</h3>
          {summary && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{summary}</p>}
        </div>
        <div className="mt-4 flex items-center justify-between font-mono text-xs text-muted-foreground">
          {role && <span>{role}</span>}
          {isPlaceholder ? <span aria-hidden="true">TODO</span> : href && <span aria-hidden="true">View case study →</span>}
        </div>
      </div>
    </div>
  );

  if (href && !isPlaceholder) {
    return <Link href={href} className="focus-ring block h-full rounded-lg">{content}</Link>;
  }

  return content;
}
