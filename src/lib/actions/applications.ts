"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCandidateAuth, requireStaffAuth } from "@/lib/auth/guards";
import { getApplicationById } from "@/lib/db/queries/shared/applications";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";
import type { ApplicationStatus } from "@/lib/constants/status-meta";

const commentSchema = z.object({
  applicationId: z.string().uuid(),
  comment: z.string(),
});

const adminUpdateSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.string().optional(),
  comment: z.string().optional(),
  upcomingLabel: z.string().nullable().optional(),
  upcomingWhen: z.string().nullable().optional(),
  upcomingWithPerson: z.string().nullable().optional(),
  upcomingPrep: z.string().nullable().optional(),
});

const createSchema = z.object({
  candidateId: z.string().uuid(),
  companyName: z.string().min(1),
  roleTitle: z.string().min(1),
  dateApplied: z.string(),
  status: z.string(),
});

export async function saveApplicationComment(applicationId: string, comment: string) {
  const session = await requireCandidateAuth();
  const parsed = commentSchema.safeParse({ applicationId, comment });
  if (!parsed.success) return { error: "Invalid input" };

  const app = await getApplicationById(applicationId);
  if (!app || app.candidateId !== session.candidateId) return { error: "Not found" };

  await db
    .update(applications)
    .set({ comment, updatedAt: new Date() })
    .where(eq(applications.id, applicationId));

  revalidatePath("/applications");
  revalidatePath("/dashboard");
  revalidatePath(`/admin/candidates/${session.candidateId}`);
  return {};
}

export async function updateApplicationAdmin(data: z.infer<typeof adminUpdateSchema>) {
  await requireStaffAuth();
  const parsed = adminUpdateSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid input" };

  const app = await getApplicationById(parsed.data.applicationId);
  if (!app) return { error: "Not found" };

  await db
    .update(applications)
    .set({
      ...(parsed.data.status ? { status: parsed.data.status as ApplicationStatus } : {}),
      ...(parsed.data.comment !== undefined ? { comment: parsed.data.comment } : {}),
      ...(parsed.data.upcomingLabel !== undefined ? { upcomingLabel: parsed.data.upcomingLabel } : {}),
      ...(parsed.data.upcomingWhen !== undefined
        ? { upcomingWhen: parsed.data.upcomingWhen ? new Date(parsed.data.upcomingWhen) : null }
        : {}),
      ...(parsed.data.upcomingWithPerson !== undefined
        ? { upcomingWithPerson: parsed.data.upcomingWithPerson }
        : {}),
      ...(parsed.data.upcomingPrep !== undefined ? { upcomingPrep: parsed.data.upcomingPrep } : {}),
      updatedAt: new Date(),
    })
    .where(eq(applications.id, parsed.data.applicationId));

  revalidatePath("/applications");
  revalidatePath("/upcoming");
  revalidatePath("/dashboard");
  revalidatePath(`/admin/candidates/${app.candidateId}`);
  return {};
}

export async function createApplication(data: z.infer<typeof createSchema>) {
  await requireStaffAuth();
  const parsed = createSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid input" };

  const existing = await db
    .select({ appNo: applications.appNo })
    .from(applications)
    .where(eq(applications.candidateId, parsed.data.candidateId));

  const nextNo = `APP-${String(existing.length + 1).padStart(3, "0")}`;

  await db.insert(applications).values({
    candidateId: parsed.data.candidateId,
    appNo: nextNo,
    companyName: parsed.data.companyName,
    roleTitle: parsed.data.roleTitle,
    dateApplied: parsed.data.dateApplied,
    status: parsed.data.status as ApplicationStatus,
  });

  revalidatePath(`/admin/candidates/${parsed.data.candidateId}`);
  revalidatePath("/applications");
  revalidatePath("/dashboard");
  return {};
}
