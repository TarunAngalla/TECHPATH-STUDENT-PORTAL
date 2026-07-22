import { and, count, desc, eq, inArray, ne } from "drizzle-orm";
import type { StaffScope } from "@/lib/auth/staff-scope";
import { db } from "@/lib/db";
import { applicationEvents, applications, candidates, staffProfiles, users } from "@/lib/db/schema";

export async function getMarketingProgressRows(scope: StaffScope) {
  const rows = await db
    .select({
      candidateId: candidates.id,
      candidateName: candidates.fullName,
      journeyStage: candidates.journeyStage,
      marketingStatus: candidates.marketingStatus,
      marketingReadyAt: candidates.marketingReadyAt,
      marketingLiveAt: candidates.marketingLiveAt,
      marketingPausedAt: candidates.marketingPausedAt,
      marketingCompletedAt: candidates.marketingCompletedAt,
      marketingNotes: candidates.marketingNotes,
      recruiterId: candidates.recruiterId,
      recruiterName: staffProfiles.fullName,
      recruiterEmail: users.email,
    })
    .from(candidates)
    .leftJoin(users, eq(users.id, candidates.recruiterId))
    .leftJoin(staffProfiles, eq(staffProfiles.userId, candidates.recruiterId))
    .where(
      scope.seesAllCandidates || !scope.recruiterId
        ? undefined
        : eq(candidates.recruiterId, scope.recruiterId),
    )
    .orderBy(desc(candidates.marketingLiveAt), desc(candidates.createdAt));

  const ids = rows.map((row) => row.candidateId);
  const applicationCounts = ids.length
    ? await db
        .select({ candidateId: applications.candidateId, total: count() })
        .from(applications)
        .where(and(inArray(applications.candidateId, ids), ne(applications.status, "draft")))
        .groupBy(applications.candidateId)
    : [];
  const activityRows = ids.length
    ? await db
        .select({
          candidateId: applicationEvents.candidateId,
          eventType: applicationEvents.eventType,
          status: applicationEvents.status,
        })
        .from(applicationEvents)
        .where(inArray(applicationEvents.candidateId, ids))
    : [];

  const appMap = new Map(applicationCounts.map((row) => [row.candidateId, Number(row.total)]));
  return rows.map((row) => {
    const activities = activityRows.filter((event) => event.candidateId === row.candidateId);
    return {
      ...row,
      applications: appMap.get(row.candidateId) ?? 0,
      interviews: activities.filter((event) => event.eventType === "interview").length,
      assessments: activities.filter((event) => event.eventType === "assessment").length,
      pendingFeedback: activities.filter((event) => ["feedback_pending", "result_pending"].includes(event.status)).length,
    };
  });
}
