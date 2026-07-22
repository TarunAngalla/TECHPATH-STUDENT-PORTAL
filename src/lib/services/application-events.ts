import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { applicationEvents, applications, candidates, candidateJourneyEvents } from "@/lib/db/schema";
import type { ApplicationStatus } from "@/lib/constants/status-meta";

const JOURNEY_STAGE_THREE_STATUSES: ApplicationStatus[] = [
  "assessment",
  "interview_r1",
  "interview_r2",
  "interview_r3",
  "hr_round",
  "final_round",
  "decision_pending",
  "offer",
];

function nextAppNo(existingAppNos: string[]) {
  let max = 0;
  for (const value of existingAppNos) {
    const match = /^APP-(\d+)$/i.exec(value.trim());
    if (!match) continue;
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed > max) max = parsed;
  }
  return `APP-${String(max + 1).padStart(3, "0")}`;
}

async function advanceJourneyForApplication(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  candidateId: string,
  status: ApplicationStatus,
  actorUserId: string,
) {
  if (!JOURNEY_STAGE_THREE_STATUSES.includes(status)) return;
  const [candidate] = await tx
    .select({ journeyStage: candidates.journeyStage })
    .from(candidates)
    .where(eq(candidates.id, candidateId))
    .limit(1);
  if (!candidate || candidate.journeyStage >= 3) return;
  await tx.update(candidates).set({ journeyStage: 3 }).where(eq(candidates.id, candidateId));
  await tx.insert(candidateJourneyEvents).values({
    candidateId,
    stage: 3,
    previousStage: candidate.journeyStage,
    eventType: "stage_reached",
    source: "application",
    note: "Interview or assessment activity started",
    candidateVisible: true,
    createdBy: actorUserId,
  });
}

export async function createApplicationWithInitialEvent(input: {
  candidateId: string; companyName: string; roleTitle: string; dateApplied: string;
  status: ApplicationStatus; actorUserId: string;
}) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${input.candidateId}, 0))`);
    const existing = await tx
      .select({ appNo: applications.appNo })
      .from(applications)
      .where(eq(applications.candidateId, input.candidateId))
      .orderBy(desc(applications.createdAt));
    const appNo = nextAppNo(existing.map((row) => row.appNo));
    const [application] = await tx.insert(applications).values({
      candidateId: input.candidateId, appNo, companyName: input.companyName,
      roleTitle: input.roleTitle, dateApplied: input.dateApplied, status: input.status,
    }).returning();
    await tx.insert(applicationEvents).values({
      applicationId: application.id, candidateId: application.candidateId,
      eventType: "application_submitted", title: `Application submitted to ${application.companyName}`,
      status: "completed", occurredAt: new Date(`${input.dateApplied}T00:00:00.000Z`), createdBy: input.actorUserId,
    });
    if (input.status !== "applied") {
      await tx.insert(applicationEvents).values({
        applicationId: application.id, candidateId: application.candidateId, eventType: "status_change",
        title: `Application status set to ${input.status}`, status: "completed", occurredAt: new Date(), createdBy: input.actorUserId,
      });
      await advanceJourneyForApplication(tx, application.candidateId, input.status, input.actorUserId);
    }
    return application;
  });
}

export async function updateApplicationWithStatusEvent(input: {
  applicationId: string; actorUserId: string; status?: ApplicationStatus; comment?: string;
  upcomingLabel?: string | null; upcomingWhen?: Date | null; upcomingWithPerson?: string | null;
  upcomingPrep?: string | null;
}) {
  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(applications).where(eq(applications.id, input.applicationId)).limit(1);
    if (!existing) return null;
    const statusChanged = input.status !== undefined && input.status !== existing.status;
    const [updated] = await tx.update(applications).set({
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.comment !== undefined ? { comment: input.comment } : {}),
      ...(input.upcomingLabel !== undefined ? { upcomingLabel: input.upcomingLabel } : {}),
      ...(input.upcomingWhen !== undefined ? { upcomingWhen: input.upcomingWhen } : {}),
      ...(input.upcomingWithPerson !== undefined ? { upcomingWithPerson: input.upcomingWithPerson } : {}),
      ...(input.upcomingPrep !== undefined ? { upcomingPrep: input.upcomingPrep } : {}),
      updatedAt: new Date(),
    }).where(eq(applications.id, input.applicationId)).returning();
    if (statusChanged && input.status) {
      await tx.insert(applicationEvents).values({
        applicationId: updated.id, candidateId: updated.candidateId, eventType: "status_change",
        title: `Application status changed from ${existing.status} to ${input.status}`,
        status: "completed", occurredAt: new Date(), createdBy: input.actorUserId,
      });
      await advanceJourneyForApplication(tx, updated.candidateId, input.status, input.actorUserId);
    }
    return updated;
  });
}
