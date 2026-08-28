import Link from "next/link";

export interface ProjectCardProps {
  title: string;
  category?: string;
  summary?: string;
  role?: string;
  visualSrc?: string;
  href?: string;
  isPlaceholder?: boolean;
}

export function ProjectCard({
  title,
  category,
  summary,
  role,
  visualSrc,
  href,
  isPlaceholder = false,
}: ProjectCardProps) {
  const content = (
    <div className="group flex h-full flex-col justify-between overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-white/20">
      {visualSrc ? (
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
