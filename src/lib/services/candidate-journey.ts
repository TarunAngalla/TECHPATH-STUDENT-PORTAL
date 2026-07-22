import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applicationEvents,
  applications,
  candidates,
  candidateJourneyEvents,
  candidateRecruiterAssignments,
  documents,
  users
} from "@/lib/db/schema";

export type JourneySource = "manual" | "assignment" | "marketing" | "application" | "system";

export async function getCandidateJourneyHistory(candidateId: string, includeInternal = false) {
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
      createdBy: candidateJourneyEvents.createdBy,
      actorEmail: users.email,
    })
    .from(candidateJourneyEvents)
    .leftJoin(users, eq(users.id, candidateJourneyEvents.createdBy))
    .where(
      includeInternal
        ? eq(candidateJourneyEvents.candidateId, candidateId)
        : and(
            eq(candidateJourneyEvents.candidateId, candidateId),
            eq(candidateJourneyEvents.candidateVisible, true),
          ),
    )
    .orderBy(candidateJourneyEvents.occurredAt);
}

export async function getMarketingReadiness(
  candidateId: string,
  // Accept the root db client or an open transaction client.
  executor: Pick<typeof db, "select"> = db,
) {
  const [candidate] = await executor
    .select({
      id: candidates.id,
      recruiterId: candidates.recruiterId,
      marketingStatus: candidates.marketingStatus,
      accountState: users.accountState,
      phone: candidates.phone,
    })
    .from(candidates)
    .innerJoin(users, eq(users.id, candidates.userId))
    .where(eq(candidates.id, candidateId))
    .limit(1);

  if (!candidate) return null;

  const [activeAssignment] = await executor
    .select({ id: candidateRecruiterAssignments.id })
    .from(candidateRecruiterAssignments)
    .where(
      and(
        eq(candidateRecruiterAssignments.candidateId, candidateId),
        eq(candidateRecruiterAssignments.status, "active"),
      ),
    )
    .limit(1);

  const [resume] = await executor
    .select({ id: documents.id })
    .from(documents)
    .where(and(eq(documents.candidateId, candidateId), eq(documents.category, "resume")))
    .limit(1);

  const checks = [
    {
      key: "active_account",
      label: "Candidate account and NDA are active",
      complete: candidate.accountState === "active",
    },
    {
      key: "recruiter",
      label: "An active recruiter is assigned",
      complete: Boolean(candidate.recruiterId && activeAssignment),
    },
    {
      key: "resume",
      label: "A current resume is available",
      complete: Boolean(resume),
    },
    {
      key: "contact",
      label: "Candidate contact details are available",
      complete: Boolean(candidate.phone?.trim()),
    },
  ];

  return {
    candidate,
    checks,
    ready: checks.every((check) => check.complete),
    missing: checks.filter((check) => !check.complete).map((check) => check.label),
  };
}

export async function hasInterviewOrAssessmentEvidence(candidateId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(applicationEvents)
    .where(
      and(
        eq(applicationEvents.candidateId, candidateId),
        inArray(applicationEvents.eventType, ["interview", "assessment"]),
        inArray(applicationEvents.status, ["scheduled", "completed", "passed", "failed"]),
      ),
    );
  if (Number(row?.count ?? 0) > 0) return true;

  const [legacyApplication] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(
      and(
        eq(applications.candidateId, candidateId),
        inArray(applications.status, [
          "assessment",
          "interview_r1",
          "interview_r2",
          "interview_r3",
          "hr_round",
          "final_round",
          "decision_pending",
          "offer",
        ]),
      ),
    )
    .limit(1);
  return Boolean(legacyApplication);
}
