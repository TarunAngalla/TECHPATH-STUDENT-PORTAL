import { cn } from "@/lib/utils/cn";

export function Logo({
  dark = false,
  subtitle = "Candidate portal",
  collapsed = false,
}: {
  dark?: boolean;
  subtitle?: string;
  collapsed?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "w-11 h-auto flex items-center justify-center shrink-0",
          dark ? "text-white" : "text-brand-700"
        )}
      >
        <svg
          viewBox="0 0 110 76"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-auto"
        >
          <circle cx="15" cy="12" r="4" fill="currentColor" stroke="none" />
          <circle cx="35" cy="24" r="4" fill="currentColor" stroke="none" />
          <circle cx="55" cy="12" r="4" fill="currentColor" stroke="none" />
          <circle cx="75" cy="24" r="4" fill="currentColor" stroke="none" />
          <circle cx="95" cy="12" r="4" fill="currentColor" stroke="none" />
          
          <path d="
            M 10 60
            L 10 26
            A 5 5 0 0 1 20 26
            L 20 60
            A 5 5 0 0 0 30 60
            L 30 38
            A 5 5 0 0 1 40 38
            L 40 60
            A 5 5 0 0 0 50 60
            L 50 26
            A 5 5 0 0 1 60 26
            L 60 60
            A 5 5 0 0 0 70 60
            L 70 38
            A 5 5 0 0 1 80 38
            L 80 60
            A 5 5 0 0 0 90 60
            L 90 26
            A 5 5 0 0 1 100 26
            L 100 60
          " />
        </svg>
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <div className={cn("text-sm font-semibold tracking-wide", dark ? "text-white" : "text-text-primary")}>
            THE TECH PATH
          </div>
          <div className={cn("text-[11px]", dark ? "text-white/60" : "text-text-muted")}>
            {subtitle}
          </div>
        </div>
      )}
    </div>
  );
}
