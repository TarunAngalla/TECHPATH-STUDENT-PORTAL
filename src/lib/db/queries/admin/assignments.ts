import { and, count, desc, eq, sql } from "drizzle-orm";
import type { StaffScope } from "@/lib/auth/staff-scope";
import { db } from "@/lib/db";
import {
  candidates,
  candidateJourneyEvents,
  candidateRecruiterAssignments,
  staffProfiles,
  users,
} from "@/lib/db/schema";

export async function getRecruiterWorkloads(scope: StaffScope) {
  const recruiterFilter = scope.seesAllCandidates ? eq(users.role, "recruiter") : eq(users.id, scope.userId);
  const recruiters = await db
    .select({
      id: users.id,
      email: users.email,
      fullName: staffProfiles.fullName,
      title: staffProfiles.title,
      phone: staffProfiles.phone,
      timezone: staffProfiles.timezone,
      maxActiveCandidates: staffProfiles.maxActiveCandidates,
      isAvailable: staffProfiles.isAvailable,
    })
    .from(users)
    .leftJoin(staffProfiles, eq(staffProfiles.userId, users.id))
    .where(recruiterFilter)
    .orderBy(users.email);

  return Promise.all(
    recruiters.map(async (recruiter) => {
      const [active] = await db
        .select({ count: count() })
        .from(candidateRecruiterAssignments)
        .where(
          and(
            eq(candidateRecruiterAssignments.recruiterId, recruiter.id),
            eq(candidateRecruiterAssignments.status, "active"),
          ),
        );
      const activeCount = Number(active?.count ?? 0);
      const maxActiveCandidates = recruiter.maxActiveCandidates ?? 20;
      return {
        ...recruiter,
        fullName:
          recruiter.fullName ??
          recruiter.email.split("@")[0].replaceAll(".", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        title: recruiter.title ?? "Talent Marketing Specialist",
        timezone: recruiter.timezone ?? "America/Chicago",
        maxActiveCandidates,
        isAvailable: recruiter.isAvailable ?? true,
        activeCount,
        remainingCapacity: Math.max(0, maxActiveCandidates - activeCount),
        utilizationPct: Math.min(100, Math.round((activeCount / maxActiveCandidates) * 100)),
      };
    }),
  );
}

export async function getAssignmentWorkQueue(scope: StaffScope) {
  const conditions = [eq(candidateRecruiterAssignments.status, "active")];
  if (!scope.seesAllCandidates) conditions.push(eq(candidateRecruiterAssignments.recruiterId, scope.userId));

  return db
    .select({
      assignmentId: candidateRecruiterAssignments.id,
      candidateId: candidates.id,
      candidateName: candidates.fullName,
      candidateAvatarPath: candidates.avatarPath,
      journeyStage: candidates.journeyStage,
      marketingStatus: candidates.marketingStatus,
      assignedAt: candidateRecruiterAssignments.assignedAt,
      assignmentReason: candidateRecruiterAssignments.reason,
      recruiterId: candidateRecruiterAssignments.recruiterId,
      recruiterEmail: users.email,
      recruiterName: staffProfiles.fullName,
    })
    .from(candidateRecruiterAssignments)
    .innerJoin(candidates, eq(candidates.id, candidateRecruiterAssignments.candidateId))
    .innerJoin(users, eq(users.id, candidateRecruiterAssignments.recruiterId))
    .leftJoin(staffProfiles, eq(staffProfiles.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(candidateRecruiterAssignments.assignedAt));
}

export async function getUnassignedCandidates() {
  return db
    .select({
      id: candidates.id,
      fullName: candidates.fullName,
      journeyStage: candidates.journeyStage,
      marketingStatus: candidates.marketingStatus,
      createdAt: candidates.createdAt,
    })
    .from(candidates)
    .where(sql`${candidates.recruiterId} is null`)
    .orderBy(desc(candidates.createdAt));
}

export async function getCandidateJourneyHistoryForStaff(candidateId: string) {
  return db
    .select({
      id: candidateJourneyEvents.id,
      stage: candidateJourneyEvents.stage,
      previousStage: candidateJourneyEvents.previousStage,
      eventType: candidateJourneyEvents.eventType,
      source: candidateJourneyEvents.source,
      note: candidateJourneyEvents.note,
      candidateVisible: candidateJourneyEvents.candidateVisible,
      occurredAt: candidateJourneyEvents.occurredAt,
      actorEmail: users.email,
    })
    .from(candidateJourneyEvents)
    .leftJoin(users, eq(users.id, candidateJourneyEvents.createdBy))
    .where(eq(candidateJourneyEvents.candidateId, candidateId))
    .orderBy(desc(candidateJourneyEvents.occurredAt));
}
