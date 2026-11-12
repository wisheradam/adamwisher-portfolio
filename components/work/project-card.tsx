import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import {
  ProjectVisual,
  type ProjectVisualKind,
} from "@/components/work/project-visual";

export interface ProjectCardProps {
  title: string;
  category?: string;
  summary?: string;
  role?: string;
  visualSrc?: string;
  href?: string;
  isPlaceholder?: boolean;
  visual?: ProjectVisualKind;
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
    <div className="project-card">
      {visual || visualSrc === "/project-06-rx.svg" ? (
        <ProjectVisual kind={visual ?? "healthcare"} />
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

      <div className="project-copy">
        <div>
          {category && <span className="project-category">{category}</span>}
          <h3 className="project-title">{title}</h3>
          {summary && <p className="project-summary">{summary}</p>}
        </div>
        <div className="project-meta">
          {role && <span>{role}</span>}
          {isPlaceholder ? (
            <span aria-hidden="true">TODO</span>
          ) : (
            href && (
              <span aria-hidden="true">
                View case study <ArrowUpRight size={14} />
              </span>
            )
          )}
        </div>
      </div>
    </div>
  );

  if (href && !isPlaceholder) {
    return (
      <Link href={href} className="project-link focus-ring">
        {content}
      </Link>
    );
  }

  return content;
}
