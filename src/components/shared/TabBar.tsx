"use client";

import { cn } from "@/lib/utils/cn";

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
}: {
  tabs: T[];
  active: T;
  onChange: (tab: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex gap-1 mb-5 overflow-x-auto" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === tab}
          onClick={() => onChange(tab)}
          className={cn(
            "text-xs font-medium px-3.5 py-2 rounded-lg whitespace-nowrap flex-shrink-0 border transition-colors",
            active === tab
              ? "brand-gradient text-white border-transparent"
              : "bg-surface-elevated text-text-muted border-border-subtle hover:border-border-strong",
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
