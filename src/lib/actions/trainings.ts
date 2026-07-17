"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaffAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { candidateTrainings, trainings } from "@/lib/db/schema";

const moduleSchema = z.object({
  title: z.string().min(1),
  type: z.enum(["video", "pdf"]),
  contentUrl: z.string().optional(),
});

export async function createTrainingModule(data: z.infer<typeof moduleSchema>) {
  await requireStaffAuth();
  const parsed = moduleSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid input" };

  await db.insert(trainings).values(parsed.data);
  revalidatePath("/admin/trainings");
  revalidatePath("/trainings");
  return {};
}

export async function assignTrainingToCandidate(candidateId: string, trainingId: string) {
  await requireStaffAuth();
  await db
    .insert(candidateTrainings)
    .values({ candidateId, trainingId, status: "upcoming" })
    .onConflictDoNothing();
  revalidatePath(`/admin/candidates/${candidateId}`);
  revalidatePath("/trainings");
  return {};
}

export async function markTrainingComplete(candidateTrainingId: string, candidateId: string) {
  await requireStaffAuth();
  await db
    .update(candidateTrainings)
    .set({ status: "completed", completedAt: new Date() })
    .where(eq(candidateTrainings.id, candidateTrainingId));
  revalidatePath(`/admin/candidates/${candidateId}`);
  revalidatePath("/trainings");
  return {};
}
