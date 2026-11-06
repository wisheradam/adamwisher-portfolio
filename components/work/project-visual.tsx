import { cn } from "@/lib/utils";

export type ProjectVisualKind = "ssot" | "check2go" | "knowledge" | "transformation" | "ai-support" | "healthcare";

export function ProjectVisual({ kind, className }: { kind: ProjectVisualKind; className?: string }) {
  return (
    <div aria-hidden="true" data-project-visual={kind} className={cn("relative aspect-[4/3] overflow-hidden border-b border-border", className)}>
      {/* Variants follow the site toggle rather than the OS preference. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/project-visuals/${kind}-dark.svg`} alt="" width={1200} height={900} className="absolute inset-0 hidden h-full w-full object-cover dark:block" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/project-visuals/${kind}-light.svg`} alt="" width={1200} height={900} className="absolute inset-0 block h-full w-full object-cover dark:hidden" />
    </div>
  );
}
