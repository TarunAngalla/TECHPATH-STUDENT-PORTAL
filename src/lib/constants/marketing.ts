import type { MarketingStatus } from "@/lib/db/schema";

export const MARKETING_STATUS_LABELS: Record<MarketingStatus, string> = {
  not_ready: "Not ready",
  ready: "Ready to launch",
  live: "Marketing live",
  paused: "Paused",
  completed: "Completed",
};

export const MARKETING_STATUS_DESCRIPTIONS: Record<MarketingStatus, string> = {
  not_ready: "Profile preparation is still in progress.",
  ready: "Required profile items are complete and marketing can be launched.",
  live: "The candidate profile is actively being submitted to companies.",
  paused: "Marketing activity is temporarily paused.",
  completed: "The candidate marketing cycle has been completed.",
};

export function assertMarketingTransition(current: MarketingStatus, next: MarketingStatus) {
  const allowed: Record<MarketingStatus, MarketingStatus[]> = {
    not_ready: ["ready"],
    ready: ["live", "not_ready"],
    live: ["paused", "completed"],
    paused: ["live", "completed", "not_ready"],
    completed: [],
  };
  if (!allowed[current].includes(next)) {
    throw new Error(`Invalid marketing transition: ${current} → ${next}`);
  }
}
