import { cn } from "@/lib/utils/cn";

export function Logo({
  dark = false,
  subtitle = "Candidate portal",
}: {
  dark?: boolean;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm text-text-inverse brand-gradient",
          !dark && "shadow-glass",
        )}
      >
        TP
      </div>
      <div className="leading-tight">
        <div className={cn("text-sm font-semibold", dark ? "text-white" : "text-text-primary")}>
          the tech path
        </div>
        <div className={cn("text-[11px]", dark ? "text-white/60" : "text-text-muted")}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}
