"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCandidatePortalAccess, requireStaffAuth } from "@/lib/auth/guards";
import { getStaffScope } from "@/lib/auth/staff-scope";
import { serverFeatures } from "@/lib/config/features";
import { APPLICATION_EVENT_STATUSES, ASSESSMENT_ACTIVITY_TYPES, INTERVIEW_ACTIVITY_TYPES } from "@/lib/constants/application-activity";
import { APPLICATION_STATUS_OPTIONS, assertApplicationStatusTransition, type ApplicationStatus } from "@/lib/constants/status-meta";
import { db } from "@/lib/db";
import { assertCandidateInScope } from "@/lib/db/queries/admin/candidates";
import { getApplicationById } from "@/lib/db/queries/shared/applications";
import { applicationEvents, applications } from "@/lib/db/schema";
import {
  createApplicationActivity,
  createApplicationWithInitialEvent,
  updateApplicationActivity,
  updateApplicationWithStatusEvent,
} from "@/lib/services/application-events";

const applicationStatuses = APPLICATION_STATUS_OPTIONS.map((item) => item.value) as [ApplicationStatus, ...ApplicationStatus[]];
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const optionalUrl = z.union([z.string().trim().url(), z.literal(""), z.null()]).optional().transform((value) => value || null);
const optionalDateTime = z.union([z.string().datetime(), z.literal(""), z.null()]).optional();

const commentSchema = z.object({ applicationId: z.string().uuid(), comment: z.string().max(2000) });
const adminUpdateSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.enum(applicationStatuses).optional(),
  comment: z.string().max(5000).optional(),
  candidateVisibleNotes: optionalText(5000),
  internalNotes: optionalText(5000),
  nextAction: optionalText(500),
  nextActionAt: optionalDateTime,
  priority: z.enum(["low", "normal", "high"]).optional(),
  jobLocation: optionalText(240),
  employmentType: optionalText(120),
  applicationSource: optionalText(120),
  jobUrl: optionalUrl,
  externalReference: optionalText(180),
});
const createSchema = z.object({
  candidateId: z.string().uuid(),
  companyName: z.string().trim().min(1).max(180),
  roleTitle: z.string().trim().min(1).max(180),
  dateApplied: z.string().date(),
  status: z.enum(applicationStatuses),
  jobLocation: optionalText(240),
  employmentType: optionalText(120),
  applicationSource: optionalText(120),
  jobUrl: optionalUrl,
  externalReference: optionalText(180),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
  candidateVisibleNotes: optionalText(5000),
  internalNotes: optionalText(5000),
  nextAction: optionalText(500),
  nextActionAt: optionalDateTime,
});

const createActivitySchema = z
  .object({
    applicationId: z.string().uuid(),
    eventKey: z.string().uuid().optional(),
    eventType: z.enum(["interview", "assessment"]),
    activityType: z.string().trim().min(1).max(80),
    title: z.string().trim().min(2).max(240),
    description: optionalText(3000),
    status: z.enum(APPLICATION_EVENT_STATUSES),
    scheduledAt: optionalDateTime,
    scheduledEndAt: optionalDateTime,
    timezone: z.string().trim().min(1).max(80).default("UTC"),
    occurredAt: optionalDateTime,
    completedAt: optionalDateTime,
    result: optionalText(1000),
    score: optionalText(120),
    roundNumber: z.number().int().positive().max(20).nullable().optional(),
    roundName: optionalText(120),
    withPerson: optionalText(180),
    companyContactName: optionalText(180),
    companyContactEmail: z.union([z.string().trim().email(), z.literal(""), z.null()]).optional().transform((value) => value || null),
    meetingLink: optionalUrl,
    location: optionalText(240),
    externalUrl: optionalUrl,
    preparationNotes: optionalText(5000),
    candidateVisibleNotes: optionalText(5000),
    internalNotes: optionalText(5000),
    candidateVisible: z.boolean().default(true),
  })
  .superRefine((value, ctx) => {
    const allowed = value.eventType === "interview" ? INTERVIEW_ACTIVITY_TYPES : ASSESSMENT_ACTIVITY_TYPES;
    if (!(allowed as readonly string[]).includes(value.activityType)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["activityType"], message: "Invalid activity type" });
    }
    if (["scheduled", "confirmed", "rescheduled"].includes(value.status) && !value.scheduledAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduledAt"], message: "Scheduled time is required" });
    }
    if (value.scheduledAt && value.scheduledEndAt && new Date(value.scheduledEndAt) <= new Date(value.scheduledAt)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduledEndAt"], message: "End time must be after start time" });
    }
  });

const updateActivitySchema = z.object({
  eventId: z.string().uuid(),
  status: z.enum(APPLICATION_EVENT_STATUSES).optional(),
  scheduledAt: optionalDateTime,
  scheduledEndAt: optionalDateTime,
  timezone: z.string().trim().min(1).max(80).optional(),
  completedAt: optionalDateTime,
  result: optionalText(1000),
  score: optionalText(120),
  meetingLink: optionalUrl,
  externalUrl: optionalUrl,
  candidateVisibleNotes: optionalText(5000),
  internalNotes: optionalText(5000),
}).superRefine((value, ctx) => {
  if (value.scheduledAt && value.scheduledEndAt && new Date(value.scheduledEndAt) <= new Date(value.scheduledAt)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["scheduledEndAt"], message: "End time must be after start time" });
  }
});

function toDate(value: string | null | undefined) {
  return value ? new Date(value) : value === null || value === "" ? null : undefined;
}

async function assertApplicationScope(applicationId: string, session: Awaited<ReturnType<typeof requireStaffAuth>>) {
  const application = await getApplicationById(applicationId);
  if (!application) return null;
  if (!(await assertCandidateInScope(application.candidateId, getStaffScope(session)))) return null;
  return application;
}

function revalidateApplication(candidateId: string, applicationId?: string) {
  revalidatePath("/applications");
  revalidatePath("/interview-details");
  revalidatePath("/assessments");
  revalidatePath("/upcoming");
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  revalidatePath("/announcements");
  revalidatePath("/", "layout");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/applications");
  revalidatePath(`/admin/candidates/${candidateId}`);
  if (applicationId) revalidatePath(`/admin/applications/${applicationId}`);
}

export async function saveApplicationComment(applicationId: string, comment: string) {
  const session = await requireCandidatePortalAccess();
  if (!serverFeatures.candidateApplicationComments) return { error: "Candidate application comments are read-only." };
  const parsed = commentSchema.safeParse({ applicationId, comment });
  if (!parsed.success) return { error: "Invalid input" };
  const app = await getApplicationById(applicationId);
  if (!app || app.candidateId !== session.candidateId) return { error: "Not found" };
  await db.update(applications).set({ comment: parsed.data.comment, updatedAt: new Date() }).where(eq(applications.id, applicationId));
  revalidateApplication(session.candidateId, applicationId);
  return {};
}

export async function updateApplicationAdmin(data: unknown) {
  const session = await requireStaffAuth();
  const parsed = adminUpdateSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const app = await assertApplicationScope(parsed.data.applicationId, session);
  if (!app) return { error: "Forbidden or not found" };
  if (session.role === "recruiter" && parsed.data.status && parsed.data.status !== app.status) {
    try {
      assertApplicationStatusTransition(app.status as ApplicationStatus, parsed.data.status);
    } catch (error) {
      return { error: error instanceof Error ? error.message : "Invalid status transition" };
    }
  }
  await updateApplicationWithStatusEvent({
    applicationId: parsed.data.applicationId,
    actorUserId: session.userId,
    status: parsed.data.status,
    comment: parsed.data.comment,
    candidateVisibleNotes: parsed.data.candidateVisibleNotes,
    internalNotes: parsed.data.internalNotes,
    nextAction: parsed.data.nextAction,
    nextActionAt: toDate(parsed.data.nextActionAt),
    priority: parsed.data.priority,
    jobLocation: parsed.data.jobLocation,
    employmentType: parsed.data.employmentType,
    applicationSource: parsed.data.applicationSource,
    jobUrl: parsed.data.jobUrl,
    externalReference: parsed.data.externalReference,
  });
  revalidateApplication(app.candidateId, app.id);
  return {};
}

export async function createApplication(data: unknown) {
  const session = await requireStaffAuth();
  const parsed = createSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  if (!(await assertCandidateInScope(parsed.data.candidateId, getStaffScope(session)))) return { error: "Forbidden" };
  const application = await createApplicationWithInitialEvent({
    ...parsed.data,
    status: parsed.data.status,
    actorUserId: session.userId,
    nextActionAt: toDate(parsed.data.nextActionAt),
  });
  revalidateApplication(parsed.data.candidateId, application.id);
  return { applicationId: application.id };
}

export async function createApplicationActivityAction(data: unknown) {
  const session = await requireStaffAuth();
  const parsed = createActivitySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid activity" };
  const app = await assertApplicationScope(parsed.data.applicationId, session);
  if (!app) return { error: "Forbidden or not found" };
  if (session.role === "recruiter" && ["hired", "rejected", "withdrawn", "closed"].includes(app.status)) {
    return { error: "Closed applications cannot receive new activity." };
  }
  const event = await createApplicationActivity({
    ...parsed.data,
    eventKey: parsed.data.eventKey ?? randomUUID(),
    actorUserId: session.userId,
    scheduledAt: toDate(parsed.data.scheduledAt),
    scheduledEndAt: toDate(parsed.data.scheduledEndAt),
    occurredAt: toDate(parsed.data.occurredAt),
    completedAt: toDate(parsed.data.completedAt),
  });
  if (!event) return { error: "Application not found" };
  revalidateApplication(app.candidateId, app.id);
  return { eventId: event.id };
}

export async function updateApplicationActivityAction(data: unknown) {
  const session = await requireStaffAuth();
  const parsed = updateActivitySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid activity" };
  const [event] = await db.select().from(applicationEvents).where(eq(applicationEvents.id, parsed.data.eventId)).limit(1);
  if (!event) return { error: "Not found" };
  const app = await assertApplicationScope(event.applicationId, session);
  if (!app) return { error: "Forbidden" };
  await updateApplicationActivity({
    ...parsed.data,
    actorUserId: session.userId,
    scheduledAt: toDate(parsed.data.scheduledAt),
    scheduledEndAt: toDate(parsed.data.scheduledEndAt),
    completedAt: toDate(parsed.data.completedAt),
  });
  revalidateApplication(app.candidateId, app.id);
  return {};
}
