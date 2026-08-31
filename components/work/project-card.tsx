import Link from "next/link";

export interface ProjectCardProps {
  title: string;
  category?: string;
  summary?: string;
  role?: string;
  visualSrc?: string;
  href?: string;
  isPlaceholder?: boolean;
  visual?: "ssot";
}

function SsotVisual() {
  const systems = ["CRM", "ERP", "R&D", "3PL"];

  return (
    <div className="relative aspect-[4/3] overflow-hidden border-b border-border bg-[#0d1117] p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.16),transparent_58%)]" />
      <div className="relative grid h-full grid-cols-2 gap-3">
        {systems.map((system) => (
          <div
            key={system}
            className="flex items-center justify-center rounded-md border border-white/10 bg-white/[0.025] font-mono text-[10px] tracking-[0.18em] text-white/45"
          >
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
      ) : visualSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={visualSrc}
          alt=""
          className="aspect-[4/3] w-full border-b border-border object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="aspect-[4/3] w-full border-b border-border bg-white/[0.02]"
        />
      )}

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          {category && (
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              {category}
            </span>
          )}
          <h3 className="mt-2 font-display text-lg font-medium">{title}</h3>
          {summary && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {summary}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between font-mono text-xs text-muted-foreground">
          {role && <span>{role}</span>}
          {isPlaceholder ? (
            <span aria-hidden="true">TODO</span>
          ) : (
            href && <span aria-hidden="true">View case study →</span>
          )}
        </div>
      </div>
    </div>
  );

  if (href && !isPlaceholder) {
    return (
      <Link href={href} className="focus-ring block h-full rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
