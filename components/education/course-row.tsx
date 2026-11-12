import type { KnowledgeRecord } from "@/data/knowledge/types";

export function CourseRow({
  record,
  completedAt,
}: {
  record: KnowledgeRecord;
  completedAt: string;
}) {
  const preparation =
    /certification preparation|certification preparation training/i.test(
      record.summary,
    );
  return (
    <li className="course-row px-6 py-5 sm:flex sm:items-start sm:justify-between sm:gap-8">
      <div className="min-w-0">
        <h4 className="text-sm font-medium leading-relaxed">{record.title}</h4>
        <p className="mt-1 text-sm text-muted-foreground">
          {record.organization}
        </p>
        {preparation ? (
          <span className="mt-2 inline-block rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-accent">
            Exam preparation
          </span>
        ) : null}
        {record.id.startsWith("training-") ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {record.summary}
          </p>
        ) : null}
      </div>
      <p className="mt-3 shrink-0 font-mono text-xs text-muted-foreground sm:mt-1">
        {completedAt}
      </p>
    </li>
  );
}
