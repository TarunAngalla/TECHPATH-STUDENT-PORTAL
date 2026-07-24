import { and, desc, eq, ilike, notInArray, or, sql, type SQL } from "drizzle-orm";
import type { StaffScope } from "@/lib/auth/staff-scope";
import type { ApplicationStatus } from "@/lib/constants/status-meta";
import { db } from "@/lib/db";
import { applications, candidates, staffProfiles, users } from "@/lib/db/schema";

export type ApplicationListFilters = {
  query?: string;
  status?: string;
};

export async function getStaffApplications(scope: StaffScope, filters: ApplicationListFilters = {}) {
  const conditions: SQL[] = [];
  if (!scope.seesAllCandidates && scope.recruiterId) {
    conditions.push(eq(candidates.recruiterId, scope.recruiterId));
  }
  if (filters.status) conditions.push(eq(applications.status, filters.status as ApplicationStatus));
  if (filters.query?.trim()) {
    const query = `%${filters.query.trim()}%`;
    conditions.push(
      or(
        ilike(applications.companyName, query),
        ilike(applications.roleTitle, query),
        ilike(candidates.fullName, query),
        ilike(applications.appNo, query),
      )!,
    );
  }

  return db
    .select({
      id: applications.id,
      candidateId: applications.candidateId,
      appNo: applications.appNo,
      companyName: applications.companyName,
      roleTitle: applications.roleTitle,
      jobLocation: applications.jobLocation,
      applicationSource: applications.applicationSource,
      dateApplied: applications.dateApplied,
      status: applications.status,
      priority: applications.priority,
      nextAction: applications.nextAction,
      nextActionAt: applications.nextActionAt,
      updatedAt: applications.updatedAt,
      candidateName: candidates.fullName,
      recruiterId: candidates.recruiterId,
      recruiterName: staffProfiles.fullName,
      recruiterEmail: users.email,
    })
    .from(applications)
    .innerJoin(candidates, eq(candidates.id, applications.candidateId))
    .leftJoin(users, eq(users.id, candidates.recruiterId))
    .leftJoin(staffProfiles, eq(staffProfiles.userId, candidates.recruiterId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(applications.updatedAt));
}

export async function getApplicationOperationalMetrics(scope: StaffScope) {
  const scopeSql = scope.seesAllCandidates || !scope.recruiterId
    ? sql`true`
    : sql`${candidates.recruiterId} = ${scope.recruiterId}`;

  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${applications.status} not in ('draft','rejected','withdrawn','closed','hired'))::int`,
      offers: sql<number>`count(*) filter (where ${applications.status} in ('offer','hired'))::int`,
      rejected: sql<number>`count(*) filter (where ${applications.status} = 'rejected')::int`,
      overdue: sql<number>`count(*) filter (where ${applications.nextActionAt} < now() and ${applications.status} not in ('rejected','withdrawn','closed','hired'))::int`,
    })
    .from(applications)
    .innerJoin(candidates, eq(candidates.id, applications.candidateId))
    .where(scopeSql);

  return {
    total: Number(row?.total ?? 0),
    active: Number(row?.active ?? 0),
    offers: Number(row?.offers ?? 0),
    rejected: Number(row?.rejected ?? 0),
    overdue: Number(row?.overdue ?? 0),
  };
}

const CLOSED_STATUSES = ["hired", "rejected", "withdrawn", "closed", "draft"] as const;

/** Applications staff can attach interview/assessment activity to. */
export async function getStaffApplicationOptions(scope: StaffScope) {
  const conditions: SQL[] = [notInArray(applications.status, [...CLOSED_STATUSES])];
  if (!scope.seesAllCandidates && scope.recruiterId) {
    conditions.push(eq(candidates.recruiterId, scope.recruiterId));
  }

  return db
    .select({
      id: applications.id,
      candidateId: applications.candidateId,
      candidateName: candidates.fullName,
      companyName: applications.companyName,
      roleTitle: applications.roleTitle,
      appNo: applications.appNo,
      status: applications.status,
    })
    .from(applications)
    .innerJoin(candidates, eq(candidates.id, applications.candidateId))
    .where(and(...conditions))
    .orderBy(desc(applications.updatedAt));
}
