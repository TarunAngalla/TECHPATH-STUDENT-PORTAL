"use client";

import { useEffect, useState } from "react";
import { getCandidateActivityBadgesAction } from "@/lib/actions/activity-nav";

const DEFAULT_INTERVAL_MS = 4000;
export const ACTIVITY_SECTION_VIEWED_EVENT = "techpath:activity-section-viewed";

export type ActivityNavBadges = {
  interviews: number;
  assessments: number;
};

/** Poll new interview/assessment counts for sidebar badges. */
export function useCandidateActivityBadges(
  initial: ActivityNavBadges,
  intervalMs = DEFAULT_INTERVAL_MS,
) {
  const [badges, setBadges] = useState(initial);

  useEffect(() => {
    setBadges(initial);
  }, [initial.interviews, initial.assessments]);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const result = await getCandidateActivityBadgesAction();
        if (!cancelled) setBadges(result);
      } catch {
        // Keep last known badges.
      }
    };

    const schedule = () => {
      window.clearInterval(timer);
      timer = window.setInterval(poll, intervalMs);
    };

    void poll();
    schedule();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void poll();
        schedule();
      }
    };
    const onViewed = () => {
      void poll();
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener(ACTIVITY_SECTION_VIEWED_EVENT, onViewed);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener(ACTIVITY_SECTION_VIEWED_EVENT, onViewed);
    };
  }, [intervalMs]);

  return badges;
}

export function notifyActivitySectionViewed() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ACTIVITY_SECTION_VIEWED_EVENT));
  }
}
