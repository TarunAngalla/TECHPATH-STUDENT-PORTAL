import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { StaffScope } from "@/lib/auth/staff-scope";
import type { ApplicationEventStatus } from "@/lib/constants/application-activity";
import { UPCOMING_EVENT_STATUSES } from "@/lib/constants/application-activity";
import { db } from "@/lib/db";
import { applicationEvents, applications, candidates, staffProfiles, users } from "@/lib/db/schema";

export type StaffActivityKind = "interview" | "assessment";

export type StaffActivityFilters = {
  query?: string;
  status?: string;
};

export async function getStaffActivities(
  scope: StaffScope,
  kind: StaffActivityKind,
  filters: StaffActivityFilters = {},
) {
  const conditions: SQL[] = [eq(applicationEvents.eventType, kind)];
  if (!scope.seesAllCandidates && scope.recruiterId) {
    conditions.push(eq(candidates.recruiterId, scope.recruiterId));
  }
  if (filters.status?.trim()) {
    conditions.push(eq(applicationEvents.status, filters.status.trim() as ApplicationEventStatus));
  }
  if (filters.query?.trim()) {
    const query = `%${filters.query.trim()}%`;
    conditions.push(
      or(
        ilike(candidates.fullName, query),
        ilike(applications.companyName, query),
        ilike(applications.roleTitle, query),
        ilike(applicationEvents.title, query),
      )!,
    );
  }

  const rows = await db
    .select({
      id: applicationEvents.id,
      applicationId: applicationEvents.applicationId,
      candidateId: candidates.id,
      candidateName: candidates.fullName,
      companyName: applications.companyName,
      roleTitle: applications.roleTitle,
      appNo: applications.appNo,
      title: applicationEvents.title,
      activityType: applicationEvents.activityType,
      status: applicationEvents.status,
      scheduledAt: applicationEvents.scheduledAt,
      scheduledEndAt: applicationEvents.scheduledEndAt,
      timezone: applicationEvents.timezone,
      completedAt: applicationEvents.completedAt,
      roundNumber: applicationEvents.roundNumber,
      roundName: applicationEvents.roundName,
      result: applicationEvents.result,
      score: applicationEvents.score,
      nextAction: applications.nextAction,
      recruiterName: staffProfiles.fullName,
      recruiterEmail: users.email,
      updatedAt: applicationEvents.updatedAt,
    })
    .from(applicationEvents)
    .innerJoin(applications, eq(applications.id, applicationEvents.applicationId))
    .innerJoin(candidates, eq(candidates.id, applicationEvents.candidateId))
    .leftJoin(users, eq(users.id, candidates.recruiterId))
    .leftJoin(staffProfiles, eq(staffProfiles.userId, candidates.recruiterId))
    .where(and(...conditions))
    .orderBy(
      sql`${applicationEvents.scheduledAt} IS NULL`,
      asc(applicationEvents.scheduledAt),
      desc(applicationEvents.updatedAt),
    );

  const now = Date.now();
  const upcoming = rows.filter(
    (row) =>
      row.scheduledAt &&
      new Date(row.scheduledAt).getTime() >= now &&
      UPCOMING_EVENT_STATUSES.includes(row.status as ApplicationEventStatus),
  ).length;
  const completed = rows.filter((row) => ["completed", "passed", "failed"].includes(row.status)).length;
  const pending = rows.filter((row) => ["pending", "assigned", "scheduled", "confirmed", "in_progress", "feedback_pending", "result_pending", "rescheduled"].includes(row.status)).length;
  const attention = rows.filter((row) => ["feedback_pending", "result_pending", "expired", "no_show"].includes(row.status)).length;

  return {
    rows,
    metrics: { total: rows.length, upcoming, completed, pending, attention },
  };
}
