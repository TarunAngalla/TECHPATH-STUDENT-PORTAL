import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  announcements,
  applicationEvents,
  applications,
  auditLog,
  candidates,
  candidateJourneyEvents,
} from "@/lib/db/schema";
import {
  applicationStatusForActivity,
  UPCOMING_EVENT_STATUSES,
  type ApplicationEventStatus,
} from "@/lib/constants/application-activity";
import type { ApplicationStatus } from "@/lib/constants/status-meta";
import { formatDisplayTimestamp } from "@/lib/utils/dates";


const APPLICATION_PROGRESS_RANK: Partial<Record<ApplicationStatus, number>> = {
  draft: 0,
  applied: 1,
  submitted: 1,
  under_review: 2,
  assessment: 3,
  interview_r1: 4,
  interview_r2: 5,
  interview_r3: 6,
  hr_round: 7,
  final_round: 8,
  decision_pending: 9,
  offer: 10,
  hired: 11,
};

function activityCanAdvanceApplication(current: ApplicationStatus, next: ApplicationStatus) {
  if (["rejected", "withdrawn", "closed", "hired"].includes(current)) return false;
  if (current === "on_hold") return true;
  return (APPLICATION_PROGRESS_RANK[next] ?? 0) >= (APPLICATION_PROGRESS_RANK[current] ?? 0);
}

const JOURNEY_STAGE_THREE_STATUSES: ApplicationStatus[] = [
  "assessment",
  "interview_r1",
  "interview_r2",
  "interview_r3",
  "hr_round",
  "final_round",
  "decision_pending",
  "offer",
  "hired",
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

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function advanceJourneyForApplication(
  tx: Transaction,
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

async function syncLegacyUpcomingSummary(tx: Transaction, applicationId: string) {
  const [next] = await tx
    .select({
      title: applicationEvents.title,
      scheduledAt: applicationEvents.scheduledAt,
      withPerson: applicationEvents.withPerson,
      preparationNotes: applicationEvents.preparationNotes,
      candidateVisibleNotes: applicationEvents.candidateVisibleNotes,
    })
    .from(applicationEvents)
    .where(
      and(
        eq(applicationEvents.applicationId, applicationId),
        inArray(applicationEvents.eventType, ["interview", "assessment"]),
        inArray(applicationEvents.status, UPCOMING_EVENT_STATUSES),
        eq(applicationEvents.candidateVisible, true),
        sql`${applicationEvents.scheduledAt} IS NOT NULL`,
        sql`${applicationEvents.scheduledAt} >= now()`,
      ),
    )
    .orderBy(asc(applicationEvents.scheduledAt))
    .limit(1);

  await tx
    .update(applications)
    .set({
      upcomingLabel: next?.title ?? null,
      upcomingWhen: next?.scheduledAt ?? null,
      upcomingWithPerson: next?.withPerson ?? null,
      upcomingPrep: next?.candidateVisibleNotes ?? next?.preparationNotes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(applications.id, applicationId));
}

export async function createApplicationWithInitialEvent(input: {
  candidateId: string;
  companyName: string;
  roleTitle: string;
  dateApplied: string;
  status: ApplicationStatus;
  actorUserId: string;
  jobLocation?: string | null;
  employmentType?: string | null;
  applicationSource?: string | null;
  jobUrl?: string | null;
  externalReference?: string | null;
  priority?: "low" | "normal" | "high";
  candidateVisibleNotes?: string | null;
  internalNotes?: string | null;
  nextAction?: string | null;
  nextActionAt?: Date | null;
}) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${input.candidateId}, 0))`);
    const existing = await tx
      .select({ appNo: applications.appNo })
      .from(applications)
      .where(eq(applications.candidateId, input.candidateId))
      .orderBy(desc(applications.createdAt));
    const appNo = nextAppNo(existing.map((row) => row.appNo));
    const [application] = await tx
      .insert(applications)
      .values({
        candidateId: input.candidateId,
        appNo,
        companyName: input.companyName,
        roleTitle: input.roleTitle,
        dateApplied: input.dateApplied,
        status: input.status,
        submittedBy: input.actorUserId,
        jobLocation: input.jobLocation,
        employmentType: input.employmentType,
        applicationSource: input.applicationSource,
        jobUrl: input.jobUrl,
        externalReference: input.externalReference,
        priority: input.priority ?? "normal",
        candidateVisibleNotes: input.candidateVisibleNotes,
        internalNotes: input.internalNotes,
        nextAction: input.nextAction,
        nextActionAt: input.nextActionAt,
        closedAt: ["hired", "rejected", "withdrawn", "closed"].includes(input.status)
          ? new Date()
          : null,
      })
      .returning();

    const isDraft = input.status === "draft";
    await tx.insert(applicationEvents).values({
      applicationId: application.id,
      candidateId: application.candidateId,
      eventType: isDraft ? "note" : "application_submitted",
      eventKey: "application-created",
      title: isDraft
        ? `Application draft created for ${application.companyName}`
        : `Application submitted to ${application.companyName}`,
      status: "completed",
      occurredAt: new Date(`${input.dateApplied}T00:00:00.000Z`),
      completedAt: new Date(`${input.dateApplied}T00:00:00.000Z`),
      candidateVisibleNotes: isDraft ? null : input.candidateVisibleNotes,
      candidateVisible: !isDraft,
      createdBy: input.actorUserId,
    });

    if (input.status !== "applied" && input.status !== "submitted") {
      await tx.insert(applicationEvents).values({
        applicationId: application.id,
        candidateId: application.candidateId,
        eventType: "status_change",
        eventKey: `initial-status-${input.status}`,
        title: `Application status set to ${input.status}`,
        status: "completed",
        occurredAt: new Date(),
        completedAt: new Date(),
        candidateVisible: true,
        createdBy: input.actorUserId,
      });
      await advanceJourneyForApplication(tx, application.candidateId, input.status, input.actorUserId);
    }

    await tx.insert(auditLog).values({
      actorUserId: input.actorUserId,
      action: "application.created",
      targetTable: "applications",
      targetId: application.id,
    });
    return application;
  });
}

export async function updateApplicationWithStatusEvent(input: {
  applicationId: string;
  actorUserId: string;
  status?: ApplicationStatus;
  comment?: string;
  candidateVisibleNotes?: string | null;
  internalNotes?: string | null;
  nextAction?: string | null;
  nextActionAt?: Date | null;
  priority?: "low" | "normal" | "high";
  jobLocation?: string | null;
  employmentType?: string | null;
  applicationSource?: string | null;
  jobUrl?: string | null;
  externalReference?: string | null;
  upcomingLabel?: string | null;
  upcomingWhen?: Date | null;
  upcomingWithPerson?: string | null;
  upcomingPrep?: string | null;
}) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${input.applicationId}, 0))`);
    const [existing] = await tx.select().from(applications).where(eq(applications.id, input.applicationId)).limit(1);
    if (!existing) return null;
    const statusChanged = input.status !== undefined && input.status !== existing.status;
    const closedAt = input.status && ["hired", "rejected", "withdrawn", "closed"].includes(input.status)
      ? existing.closedAt ?? new Date()
      : input.status && !["hired", "rejected", "withdrawn", "closed"].includes(input.status)
        ? null
        : undefined;
    const [updated] = await tx
      .update(applications)
      .set({
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.comment !== undefined ? { comment: input.comment } : {}),
        ...(input.candidateVisibleNotes !== undefined ? { candidateVisibleNotes: input.candidateVisibleNotes } : {}),
        ...(input.internalNotes !== undefined ? { internalNotes: input.internalNotes } : {}),
        ...(input.nextAction !== undefined ? { nextAction: input.nextAction } : {}),
        ...(input.nextActionAt !== undefined ? { nextActionAt: input.nextActionAt } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.jobLocation !== undefined ? { jobLocation: input.jobLocation } : {}),
        ...(input.employmentType !== undefined ? { employmentType: input.employmentType } : {}),
        ...(input.applicationSource !== undefined ? { applicationSource: input.applicationSource } : {}),
        ...(input.jobUrl !== undefined ? { jobUrl: input.jobUrl } : {}),
        ...(input.externalReference !== undefined ? { externalReference: input.externalReference } : {}),
        ...(input.upcomingLabel !== undefined ? { upcomingLabel: input.upcomingLabel } : {}),
        ...(input.upcomingWhen !== undefined ? { upcomingWhen: input.upcomingWhen } : {}),
        ...(input.upcomingWithPerson !== undefined ? { upcomingWithPerson: input.upcomingWithPerson } : {}),
        ...(input.upcomingPrep !== undefined ? { upcomingPrep: input.upcomingPrep } : {}),
        ...(closedAt !== undefined ? { closedAt } : {}),
        updatedAt: new Date(),
      })
      .where(eq(applications.id, input.applicationId))
      .returning();

    if (statusChanged && input.status) {
      await tx.insert(applicationEvents).values({
        applicationId: updated.id,
        candidateId: updated.candidateId,
        eventType: "status_change",
        eventKey: `status-${input.status}-${Date.now()}`,
        title: `Application status changed from ${existing.status} to ${input.status}`,
        status: "completed",
        occurredAt: new Date(),
        completedAt: new Date(),
        candidateVisibleNotes: input.candidateVisibleNotes,
        candidateVisible: true,
        createdBy: input.actorUserId,
      });
      await advanceJourneyForApplication(tx, updated.candidateId, input.status, input.actorUserId);
    }

    await tx.insert(auditLog).values({
      actorUserId: input.actorUserId,
      action: statusChanged ? "application.status_changed" : "application.updated",
      targetTable: "applications",
      targetId: updated.id,
    });
    return updated;
  });
}

export async function createApplicationActivity(input: {
  applicationId: string;
  actorUserId: string;
  eventKey: string;
  eventType: "interview" | "assessment";
  activityType: string;
  title: string;
  description?: string | null;
  status: ApplicationEventStatus;
  scheduledAt?: Date | null;
  scheduledEndAt?: Date | null;
  timezone?: string;
  occurredAt?: Date | null;
  completedAt?: Date | null;
  result?: string | null;
  score?: string | null;
  roundNumber?: number | null;
  roundName?: string | null;
  withPerson?: string | null;
  companyContactName?: string | null;
  companyContactEmail?: string | null;
  meetingLink?: string | null;
  location?: string | null;
  externalUrl?: string | null;
  preparationNotes?: string | null;
  candidateVisibleNotes?: string | null;
  internalNotes?: string | null;
  candidateVisible?: boolean;
}) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${input.applicationId}, 0))`);
    const [application] = await tx
      .select()
      .from(applications)
      .where(eq(applications.id, input.applicationId))
      .limit(1);
    if (!application) return null;

    const [existing] = await tx
      .select()
      .from(applicationEvents)
      .where(
        and(
          eq(applicationEvents.applicationId, input.applicationId),
          eq(applicationEvents.eventKey, input.eventKey),
        ),
      )
      .limit(1);
    if (existing) return existing;

    const completedAt = input.completedAt ?? (["completed", "passed", "failed", "feedback_pending", "result_pending"].includes(input.status) ? new Date() : null);
    const occurredAt = input.occurredAt ?? completedAt;
    const [event] = await tx
      .insert(applicationEvents)
      .values({
        applicationId: input.applicationId,
        candidateId: application.candidateId,
        eventType: input.eventType,
        activityType: input.activityType,
        eventKey: input.eventKey,
        title: input.title,
        description: input.description,
        status: input.status,
        scheduledAt: input.scheduledAt,
        scheduledEndAt: input.scheduledEndAt,
        timezone: input.timezone ?? "UTC",
        occurredAt,
        completedAt,
        result: input.result,
        score: input.score,
        roundNumber: input.roundNumber,
        roundName: input.roundName,
        withPerson: input.withPerson,
        companyContactName: input.companyContactName,
        companyContactEmail: input.companyContactEmail,
        meetingLink: input.meetingLink,
        location: input.location,
        externalUrl: input.externalUrl,
        preparationNotes: input.preparationNotes,
        candidateVisibleNotes: input.candidateVisibleNotes,
        internalNotes: input.internalNotes,
        candidateVisible: input.candidateVisible ?? true,
        createdBy: input.actorUserId,
      })
      .returning();

    const nextStatus = applicationStatusForActivity({
      eventType: input.eventType,
      roundNumber: input.roundNumber,
      activityType: input.activityType,
    });
    if (activityCanAdvanceApplication(application.status as ApplicationStatus, nextStatus)) {
      await tx
        .update(applications)
        .set({ status: nextStatus, updatedAt: new Date() })
        .where(eq(applications.id, input.applicationId));
      await tx.insert(applicationEvents).values({
        applicationId: input.applicationId,
        candidateId: application.candidateId,
        eventType: "status_change",
        eventKey: `status-${nextStatus}-from-${input.eventKey}`,
        title: `Application status changed from ${application.status} to ${nextStatus}`,
        status: "completed",
        occurredAt: new Date(),
        completedAt: new Date(),
        candidateVisible: true,
        createdBy: input.actorUserId,
      });
    }
    await advanceJourneyForApplication(tx, application.candidateId, nextStatus, input.actorUserId);
    await syncLegacyUpcomingSummary(tx, input.applicationId);

    if (input.candidateVisible !== false) {
      const when = input.scheduledAt
        ? ` · ${formatDisplayTimestamp(input.scheduledAt, input.timezone ?? "UTC")}`
        : "";
      await tx.insert(announcements).values({
        title: input.eventType === "interview" ? "Interview update" : "Assessment update",
        body: `${application.companyName} · ${input.title}${when}`,
        targetCandidateId: application.candidateId,
        sourceKey: `application-event:${event.id}:created`,
        createdBy: input.actorUserId,
      }).onConflictDoNothing();
    }
    await tx.insert(auditLog).values({
      actorUserId: input.actorUserId,
      action: `application_event.${input.eventType}.created`,
      targetTable: "application_events",
      targetId: event.id,
    });
    return event;
  });
}

export async function updateApplicationActivity(input: {
  eventId: string;
  actorUserId: string;
  status?: ApplicationEventStatus;
  scheduledAt?: Date | null;
  scheduledEndAt?: Date | null;
  timezone?: string;
  completedAt?: Date | null;
  result?: string | null;
  score?: string | null;
  meetingLink?: string | null;
  externalUrl?: string | null;
  candidateVisibleNotes?: string | null;
  internalNotes?: string | null;
}) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(applicationEvents)
      .where(eq(applicationEvents.id, input.eventId))
      .limit(1);
    if (!existing) return null;
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${existing.applicationId}, 0))`);

    const autoCompletedAt = input.status && ["completed", "passed", "failed", "feedback_pending", "result_pending"].includes(input.status)
      ? input.completedAt ?? existing.completedAt ?? new Date()
      : input.completedAt;
    const [updated] = await tx
      .update(applicationEvents)
      .set({
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.scheduledAt !== undefined ? { scheduledAt: input.scheduledAt } : {}),
        ...(input.scheduledEndAt !== undefined ? { scheduledEndAt: input.scheduledEndAt } : {}),
        ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
        ...(autoCompletedAt !== undefined ? { completedAt: autoCompletedAt } : {}),
        ...(input.result !== undefined ? { result: input.result } : {}),
        ...(input.score !== undefined ? { score: input.score } : {}),
        ...(input.meetingLink !== undefined ? { meetingLink: input.meetingLink } : {}),
        ...(input.externalUrl !== undefined ? { externalUrl: input.externalUrl } : {}),
        ...(input.candidateVisibleNotes !== undefined ? { candidateVisibleNotes: input.candidateVisibleNotes } : {}),
        ...(input.internalNotes !== undefined ? { internalNotes: input.internalNotes } : {}),
        updatedAt: new Date(),
      })
      .where(eq(applicationEvents.id, input.eventId))
      .returning();

    await syncLegacyUpcomingSummary(tx, existing.applicationId);
    const materialUpdate =
      (input.status !== undefined && input.status !== existing.status) ||
      (input.scheduledAt !== undefined && String(input.scheduledAt ?? "") !== String(existing.scheduledAt ?? ""));
    if (materialUpdate && existing.candidateVisible) {
      const [application] = await tx
        .select({ companyName: applications.companyName })
        .from(applications)
        .where(eq(applications.id, existing.applicationId))
        .limit(1);
      const notificationKey = `application-event:${existing.id}:${updated.status}:${updated.scheduledAt?.toISOString() ?? "none"}`;
      await tx.insert(announcements).values({
        title: existing.eventType === "interview" ? "Interview updated" : "Assessment updated",
        body: `${application?.companyName ?? "Application"} · ${updated.title} · ${updated.status.replaceAll("_", " ")}`,
        targetCandidateId: existing.candidateId,
        sourceKey: notificationKey,
        createdBy: input.actorUserId,
      }).onConflictDoNothing();
    }
    await tx.insert(auditLog).values({
      actorUserId: input.actorUserId,
      action: `application_event.${existing.eventType}.updated`,
      targetTable: "application_events",
      targetId: existing.id,
    });
    return updated;
  });
}
