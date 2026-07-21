"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCandidatePortalAccess, requireStaffAuth } from "@/lib/auth/guards";
import { serverFeatures } from "@/lib/config/features";
import { db } from "@/lib/db";
import { getApplicationById } from "@/lib/db/queries/shared/applications";
import { applications } from "@/lib/db/schema";
import { createApplicationWithInitialEvent, updateApplicationWithStatusEvent } from "@/lib/services/application-events";
import type { ApplicationStatus } from "@/lib/constants/status-meta";

const applicationStatuses = ["applied", "assessment", "interview_r1", "interview_r2", "interview_r3", "hr_round", "final_round", "decision_pending", "offer", "rejected"] as const;
const commentSchema = z.object({ applicationId: z.string().uuid(), comment: z.string().max(2000) });
const adminUpdateSchema = z.object({
  applicationId: z.string().uuid(), status: z.enum(applicationStatuses).optional(), comment: z.string().max(5000).optional(),
  upcomingLabel: z.string().max(200).nullable().optional(), upcomingWhen: z.string().datetime().nullable().optional(),
  upcomingWithPerson: z.string().max(200).nullable().optional(), upcomingPrep: z.string().max(3000).nullable().optional(),
});
const createSchema = z.object({ candidateId: z.string().uuid(), companyName: z.string().trim().min(1).max(180), roleTitle: z.string().trim().min(1).max(180), dateApplied: z.string().date(), status: z.enum(applicationStatuses) });

type AdminUpdateInput = { applicationId: string; status?: string; comment?: string; upcomingLabel?: string | null; upcomingWhen?: string | null; upcomingWithPerson?: string | null; upcomingPrep?: string | null };
type CreateApplicationInput = { candidateId: string; companyName: string; roleTitle: string; dateApplied: string; status: string };

export async function saveApplicationComment(applicationId: string, comment: string) {
  const session = await requireCandidatePortalAccess();
  if (!serverFeatures.candidateApplicationComments) return { error: "Candidate application comments are read-only." };
  const parsed = commentSchema.safeParse({ applicationId, comment }); if (!parsed.success) return { error: "Invalid input" };
  const app = await getApplicationById(applicationId); if (!app || app.candidateId !== session.candidateId) return { error: "Not found" };
  await db.update(applications).set({ comment: parsed.data.comment, updatedAt: new Date() }).where(eq(applications.id, applicationId));
  revalidatePath("/applications"); revalidatePath("/dashboard"); revalidatePath(`/admin/candidates/${session.candidateId}`); return {};
}
export async function updateApplicationAdmin(data: AdminUpdateInput) {
  const session = await requireStaffAuth(); const parsed = adminUpdateSchema.safeParse(data); if (!parsed.success) return { error: "Invalid input" };
  const app = await getApplicationById(parsed.data.applicationId); if (!app) return { error: "Not found" };
  const { getStaffScope } = await import("@/lib/auth/staff-scope");
  const { assertCandidateInScope } = await import("@/lib/db/queries/admin/candidates");
  if (!(await assertCandidateInScope(app.candidateId, getStaffScope(session)))) return { error: "Forbidden" };
  await updateApplicationWithStatusEvent({
    applicationId: parsed.data.applicationId, actorUserId: session.userId,
    status: parsed.data.status as ApplicationStatus | undefined, comment: parsed.data.comment,
    upcomingLabel: parsed.data.upcomingLabel,
    upcomingWhen: parsed.data.upcomingWhen === undefined ? undefined : parsed.data.upcomingWhen ? new Date(parsed.data.upcomingWhen) : null,
    upcomingWithPerson: parsed.data.upcomingWithPerson, upcomingPrep: parsed.data.upcomingPrep,
  });
  revalidatePath("/applications"); revalidatePath("/upcoming"); revalidatePath("/dashboard"); revalidatePath("/admin/dashboard"); revalidatePath(`/admin/candidates/${app.candidateId}`); return {};
}
export async function createApplication(data: CreateApplicationInput) {
  const session = await requireStaffAuth(); const parsed = createSchema.safeParse(data); if (!parsed.success) return { error: "Invalid input" };
  const { getStaffScope } = await import("@/lib/auth/staff-scope");
  const { assertCandidateInScope } = await import("@/lib/db/queries/admin/candidates");
  if (!(await assertCandidateInScope(parsed.data.candidateId, getStaffScope(session)))) return { error: "Forbidden" };
  await createApplicationWithInitialEvent({ ...parsed.data, status: parsed.data.status as ApplicationStatus, actorUserId: session.userId });
  revalidatePath(`/admin/candidates/${parsed.data.candidateId}`); revalidatePath("/admin/dashboard"); revalidatePath("/applications"); revalidatePath("/dashboard"); return {};
}
