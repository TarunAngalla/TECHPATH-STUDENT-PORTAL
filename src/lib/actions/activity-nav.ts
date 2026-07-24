"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCandidatePortalAccess } from "@/lib/auth/guards";
import {
  getCandidateActivityNavBadges,
  markCandidateSectionViewed,
  type CandidateActivitySection,
} from "@/lib/db/queries/candidate/activity-nav";

const sectionSchema = z.enum(["interview", "assessment"]);

export async function getCandidateActivityBadgesAction() {
  const session = await requireCandidatePortalAccess();
  if (!session.candidateId) return { interviews: 0, assessments: 0 };
  return getCandidateActivityNavBadges(session.candidateId);
}

export async function markCandidateActivitySectionViewedAction(section: CandidateActivitySection) {
  const session = await requireCandidatePortalAccess();
  const parsed = sectionSchema.safeParse(section);
  if (!parsed.success || !session.candidateId) return { error: "Invalid section" };

  await markCandidateSectionViewed(session.candidateId, parsed.data);
  revalidatePath("/", "layout");
  revalidatePath(parsed.data === "interview" ? "/interview-details" : "/assessments");
  return {};
}
