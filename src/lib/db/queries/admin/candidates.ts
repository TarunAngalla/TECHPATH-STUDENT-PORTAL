import { and, count, desc, eq, ne, or } from "drizzle-orm";
import type { StaffScope } from "@/lib/auth/staff-scope";
import { db } from "@/lib/db";
import { applications, candidates, messages, staffProfiles, users } from "@/lib/db/schema";

function scopeWhere(scope?: StaffScope) {
  if (!scope || scope.seesAllCandidates || !scope.recruiterId) return undefined;
  return eq(candidates.recruiterId, scope.recruiterId);
}

export async function getCandidatesList(scope?: StaffScope) {
  const rows = await db
    .select({
      id: candidates.id,
      userId: candidates.userId,
      fullName: candidates.fullName,
      optType: candidates.optType,
      journeyStage: candidates.journeyStage,
      recruiterId: candidates.recruiterId,
      marketingStatus: candidates.marketingStatus,
      marketingReadyAt: candidates.marketingReadyAt,
      marketingLiveAt: candidates.marketingLiveAt,
      marketingPausedAt: candidates.marketingPausedAt,
      marketingCompletedAt: candidates.marketingCompletedAt,
      marketingNotes: candidates.marketingNotes,
      createdAt: candidates.createdAt,
      email: users.email,
      accountState: users.accountState,
      firstLogin: users.firstLogin,
    })
    .from(candidates)
    .innerJoin(users, eq(candidates.userId, users.id))
    .where(scopeWhere(scope))
    .orderBy(desc(candidates.createdAt));

  return Promise.all(
    rows.map(async (c) => {
      const [appCount] = await db
        .select({ count: count() })
        .from(applications)
        .where(and(eq(applications.candidateId, c.id), ne(applications.status, "draft")));
      const [lastMsg] = await db
        .select({ sentAt: messages.sentAt })
        .from(messages)
        .where(or(eq(messages.senderId, c.userId), eq(messages.receiverId, c.userId)))
        .orderBy(desc(messages.sentAt))
        .limit(1);
      let recruiterEmail: string | null = null;
      if (c.recruiterId) {
        const [r] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, c.recruiterId))
          .limit(1);
        recruiterEmail = r?.email ?? null;
      }
      return {
        ...c,
        applicationCount: Number(appCount?.count ?? 0),
        lastActivity: lastMsg?.sentAt ?? c.createdAt,
        recruiterEmail,
      };
    }),
  );
}

export async function getCandidateDetail(candidateId: string, scope?: StaffScope) {
  const conditions = [eq(candidates.id, candidateId)];
  const scopeFilter = scopeWhere(scope);
  if (scopeFilter) conditions.push(scopeFilter);

  const [row] = await db
    .select({
      id: candidates.id,
      userId: candidates.userId,
      fullName: candidates.fullName,
      phone: candidates.phone,
      optType: candidates.optType,
      journeyStage: candidates.journeyStage,
      recruiterId: candidates.recruiterId,
      marketingStatus: candidates.marketingStatus,
      marketingReadyAt: candidates.marketingReadyAt,
      marketingLiveAt: candidates.marketingLiveAt,
      marketingPausedAt: candidates.marketingPausedAt,
      marketingCompletedAt: candidates.marketingCompletedAt,
      marketingNotes: candidates.marketingNotes,
      createdAt: candidates.createdAt,
      email: users.email,
      accountState: users.accountState,
      firstLogin: users.firstLogin,
    })
    .from(candidates)
    .innerJoin(users, eq(candidates.userId, users.id))
    .where(and(...conditions))
    .limit(1);
  return row ?? null;
}

export async function assertCandidateInScope(candidateId: string, scope: StaffScope) {
  if (scope.seesAllCandidates) return true;
  const detail = await getCandidateDetail(candidateId, scope);
  return Boolean(detail);
}

export async function getRecruiters() {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: staffProfiles.fullName,
      title: staffProfiles.title,
      phone: staffProfiles.phone,
      maxActiveCandidates: staffProfiles.maxActiveCandidates,
      isAvailable: staffProfiles.isAvailable,
    })
    .from(users)
    .leftJoin(staffProfiles, eq(staffProfiles.userId, users.id))
    .where(eq(users.role, "recruiter"))
    .orderBy(users.email);

  return rows.map((row) => ({
    ...row,
    fullName:
      row.fullName ??
      row.email.split("@")[0].replaceAll(".", " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    title: row.title ?? "Talent Marketing Specialist",
    maxActiveCandidates: row.maxActiveCandidates ?? 20,
    isAvailable: row.isAvailable ?? true,
  }));
}
