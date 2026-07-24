import { and, eq, gt, inArray, or, sql } from "drizzle-orm";
import { UPCOMING_EVENT_STATUSES } from "@/lib/constants/application-activity";
import { db } from "@/lib/db";
import { applicationEvents, candidateSectionViews } from "@/lib/db/schema";

export type CandidateActivitySection = "interview" | "assessment";

async function getSectionLastViewedAt(candidateId: string, section: CandidateActivitySection) {
  const [row] = await db
    .select({ lastViewedAt: candidateSectionViews.lastViewedAt })
    .from(candidateSectionViews)
    .where(
      and(
        eq(candidateSectionViews.candidateId, candidateId),
        eq(candidateSectionViews.section, section),
      ),
    )
    .limit(1);
  return row?.lastViewedAt ?? null;
}

async function countNewActivity(candidateId: string, section: CandidateActivitySection) {
  const eventType = section === "interview" ? "interview" : "assessment";
  const lastViewedAt = await getSectionLastViewedAt(candidateId, section);

  const conditions = [
    eq(applicationEvents.candidateId, candidateId),
    eq(applicationEvents.eventType, eventType),
    eq(applicationEvents.candidateVisible, true),
    inArray(applicationEvents.status, UPCOMING_EVENT_STATUSES),
  ];

  if (lastViewedAt) {
    conditions.push(
      or(
        gt(applicationEvents.createdAt, lastViewedAt),
        gt(applicationEvents.updatedAt, lastViewedAt),
      )!,
    );
  }

  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(applicationEvents)
    .where(and(...conditions));

  return row?.count ?? 0;
}

export async function getCandidateActivityNavBadges(candidateId: string) {
  const [interviews, assessments] = await Promise.all([
    countNewActivity(candidateId, "interview"),
    countNewActivity(candidateId, "assessment"),
  ]);
  return { interviews, assessments };
}

export async function markCandidateSectionViewed(
  candidateId: string,
  section: CandidateActivitySection,
) {
  const now = new Date();
  await db
    .insert(candidateSectionViews)
    .values({ candidateId, section, lastViewedAt: now })
    .onConflictDoUpdate({
      target: [candidateSectionViews.candidateId, candidateSectionViews.section],
      set: { lastViewedAt: now },
    });
}
