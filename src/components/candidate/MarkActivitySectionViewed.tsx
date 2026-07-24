"use client";

import { useEffect } from "react";
import {
  markCandidateActivitySectionViewedAction,
} from "@/lib/actions/activity-nav";
import type { CandidateActivitySection } from "@/lib/db/queries/candidate/activity-nav";
import { notifyActivitySectionViewed } from "@/lib/hooks/useCandidateActivityBadges";

/** Clears the sidebar “new” badge when the candidate opens Interviews or Assessments. */
export function MarkActivitySectionViewed({ section }: { section: CandidateActivitySection }) {
  useEffect(() => {
    void markCandidateActivitySectionViewedAction(section).then(() => {
      notifyActivitySectionViewed();
    });
  }, [section]);

  return null;
}
