"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaffAuth, requireCandidatePortalAccess } from "@/lib/auth/guards";
import { serverFeatures } from "@/lib/config/features";
import { db } from "@/lib/db";
import { candidateTrainings, candidates, trainings } from "@/lib/db/schema";

const moduleSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  type: z.enum(["video", "pdf"]),
  contentUrl: z.string().trim().min(1, "Content URL is required").url("Enter a valid URL"),
});

export async function createTrainingModule(data: z.infer<typeof moduleSchema>) {
  const session = await requireStaffAuth();
  if (session.role !== "admin") return { error: "Admin only" };
  const parsed = moduleSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Invalid input" };

  const [created] = await db
    .insert(trainings)
    .values({
      title: parsed.data.title,
      type: parsed.data.type,
      contentUrl: parsed.data.contentUrl,
    })
    .returning();

  // Assign to every candidate so the module appears in their Trainings list.
  const allCandidates = await db.select({ id: candidates.id }).from(candidates);
  if (allCandidates.length > 0) {
    await db
      .insert(candidateTrainings)
      .values(
        allCandidates.map((c) => ({
          candidateId: c.id,
          trainingId: created.id,
          status: "upcoming" as const,
        })),
      )
      .onConflictDoNothing();
  }

  revalidatePath("/admin/trainings");
  revalidatePath("/admin/candidates");
  revalidatePath("/trainings");
  revalidatePath("/dashboard");
  return { assignedCount: allCandidates.length };
}

export async function assignTrainingToCandidate(candidateId: string, trainingId: string) {
  const session = await requireStaffAuth();
  const { getStaffScope } = await import("@/lib/auth/staff-scope");
  const { assertCandidateInScope } = await import("@/lib/db/queries/admin/candidates");
  if (!(await assertCandidateInScope(candidateId, getStaffScope(session)))) {
    return { error: "Forbidden" };
  }
  await db
    .insert(candidateTrainings)
    .values({ candidateId, trainingId, status: "upcoming" })
    .onConflictDoNothing();
  revalidatePath(`/admin/candidates/${candidateId}`);
  revalidatePath("/trainings");
  revalidatePath("/dashboard");
  return {};
}

export async function markTrainingComplete(candidateTrainingId: string, candidateId: string) {
  const session = await requireStaffAuth();
  const { getStaffScope } = await import("@/lib/auth/staff-scope");
  const { assertCandidateInScope } = await import("@/lib/db/queries/admin/candidates");
  if (!(await assertCandidateInScope(candidateId, getStaffScope(session)))) {
    return { error: "Forbidden" };
  }
  const [record] = await db.select({ candidateId: candidateTrainings.candidateId }).from(candidateTrainings).where(eq(candidateTrainings.id, candidateTrainingId)).limit(1);
  if (!record || record.candidateId !== candidateId) return { error: "Training assignment not found" };
  await db.update(candidateTrainings).set({ status: "completed", completedAt: new Date() }).where(eq(candidateTrainings.id, candidateTrainingId));
  revalidatePath(`/admin/candidates/${candidateId}`);
  revalidatePath("/trainings");
  revalidatePath("/dashboard");
  return {};
}

export async function completeTrainingAsCandidate(candidateTrainingId: string) {
  const session = await requireCandidatePortalAccess();
  if (!serverFeatures.candidateTrainingSelfComplete) return { error: "Training completion is managed by TechPath staff." };
  const [ct] = await db
    .select()
    .from(candidateTrainings)
    .where(eq(candidateTrainings.id, candidateTrainingId))
    .limit(1);

  if (!ct) return { error: "Training not found" };
  if (ct.candidateId !== session.candidateId) return { error: "Unauthorized" };

  await db
    .update(candidateTrainings)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(candidateTrainings.id, candidateTrainingId));

  revalidatePath("/trainings");
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  return {};
}
