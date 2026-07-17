import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { JOURNEY_STEPS } from "@/lib/constants/journey";

export function JourneyBar({ current, big = false }: { current: number; big?: boolean }) {
  return (
    <div className="flex items-center">
      {JOURNEY_STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={step} className="contents">
            <div className="flex flex-col items-center" style={{ width: big ? 140 : "auto" }}>
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0",
                  done && "bg-success text-white",
                  active && !done && "brand-gradient text-white",
                  !done && !active && "bg-surface text-text-muted",
                )}
              >
                {done ? <CheckCircle2 size={14} aria-hidden="true" /> : i + 1}
              </div>
              {big && (
                <div
                  className={cn(
                    "text-xs text-center mt-2 px-1",
                    active ? "text-text-primary font-medium" : "text-text-muted font-normal",
                  )}
                >
                  {step}
                </div>
              )}
            </div>
            {i < JOURNEY_STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 mx-1 min-w-[20px]",
                  i < current ? "bg-success" : "bg-border-subtle",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
