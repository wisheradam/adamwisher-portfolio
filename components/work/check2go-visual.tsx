import { BriefcaseBusiness, CalendarDays, Plane, Search, Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

const stages = [
  { number: "01", label: "Search", Icon: Search, position: "left-[6%] top-[28%]" },
  { number: "02", label: "Plan", Icon: CalendarDays, position: "right-[6%] top-[28%]" },
  { number: "03", label: "Book", Icon: Ticket, position: "left-[6%] bottom-[9%]" },
  { number: "04", label: "Go", Icon: BriefcaseBusiness, position: "right-[6%] bottom-[9%]" },
];

export function Check2GoVisual({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative aspect-[4/3] overflow-hidden border-b border-border bg-[#061411]",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_52%,rgba(45,212,191,0.17),transparent_34%),radial-gradient(circle_at_82%_12%,rgba(16,185,129,0.12),transparent_34%)]" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(94,234,212,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(94,234,212,0.08)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="absolute left-[6%] top-[7%] font-mono text-[8px] uppercase tracking-[0.2em] text-emerald-100/45 sm:text-[10px]">
        TravelTech · USA · 0→1
      </div>

      <svg
        aria-hidden="true"
        viewBox="0 0 100 75"
        className="absolute inset-0 h-full w-full text-emerald-300/30"
        preserveAspectRatio="none"
      >
        <path d="M36 32 C42 32 43 35 46 38" fill="none" stroke="currentColor" strokeWidth="0.35" strokeDasharray="1.3 1.3" />
        <path d="M64 32 C58 32 57 35 54 38" fill="none" stroke="currentColor" strokeWidth="0.35" strokeDasharray="1.3 1.3" />
        <path d="M36 57 C42 57 43 49 46 45" fill="none" stroke="currentColor" strokeWidth="0.35" strokeDasharray="1.3 1.3" />
        <path d="M64 57 C58 57 57 49 54 45" fill="none" stroke="currentColor" strokeWidth="0.35" strokeDasharray="1.3 1.3" />
      </svg>

      {stages.map(({ number, label, Icon, position }) => (
        <div
          key={label}
          className={cn(
            "absolute flex h-[22%] w-[29%] flex-col justify-between rounded-md border border-emerald-200/15 bg-white/[0.018] p-2.5 backdrop-blur-[1px] sm:p-3",
            position,
          )}
        >
          <div className="flex items-center gap-2 font-mono text-[7px] uppercase tracking-[0.16em] text-emerald-100/42 sm:text-[9px]">
            <span>{number}</span>
            <span>{label}</span>
          </div>
          <div className="flex items-end justify-between gap-2 text-emerald-200/55">
            <Icon className="h-5 w-5 stroke-[1.4] sm:h-7 sm:w-7" />
            <div className="mb-0.5 w-[42%] space-y-1.5">
              <span className="block h-px w-full bg-emerald-200/20" />
              <span className="block h-px w-3/4 bg-emerald-200/12" />
            </div>
          </div>
        </div>
      ))}

      <div className="absolute left-1/2 top-[51%] flex h-[29%] w-[29%] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-emerald-300/45 bg-[#08201b]/95 shadow-[0_0_50px_rgba(45,212,191,0.16)]">
        <div className="absolute inset-[8%] rounded-full border border-emerald-200/10" />
        <Plane className="mb-1 h-5 w-5 stroke-[1.5] text-emerald-200/65 sm:h-7 sm:w-7" />
        <span className="font-display text-[10px] font-medium tracking-tight text-white sm:text-sm">Check2Go</span>
      </div>
    </div>
  );
}
