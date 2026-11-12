import { FigmaIllustration } from "./figma-illustration";
export type ProjectVisualKind =
  | "ssot"
  | "check2go"
  | "knowledge"
  | "transformation"
  | "ai-support"
  | "healthcare";
export function ProjectVisual({
  kind,
  className = "",
}: {
  kind: ProjectVisualKind;
  className?: string;
}) {
  return (
    <div
      className={`project-visual ${className}`}
      aria-hidden="true"
      data-project-visual={kind}
    >
      <svg viewBox="0 0 348 261" width="348" height="261" focusable="false">
        <foreignObject width="348" height="261">
          <FigmaIllustration kind={kind} />
        </foreignObject>
      </svg>
    </div>
  );
}
