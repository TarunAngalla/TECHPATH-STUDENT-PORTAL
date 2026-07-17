"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCandidateAuth, requireStaffAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { announcementReads, announcements } from "@/lib/db/schema";

export async function markAnnouncementRead(announcementId: string, candidateId: string) {
  const session = await requireCandidateAuth();
  if (session.candidateId !== candidateId) return;

  await db
    .insert(announcementReads)
    .values({ announcementId, candidateId })
    .onConflictDoNothing();

  revalidatePath("/announcements");
}

const createSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  targetCandidateId: z.string().uuid().nullable().optional(),
});

export async function createAnnouncement(data: z.infer<typeof createSchema>) {
  const session = await requireStaffAuth();
  const parsed = createSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid input" };

  await db.insert(announcements).values({
    title: parsed.data.title,
    body: parsed.data.body,
    targetCandidateId: parsed.data.targetCandidateId ?? null,
    createdBy: session.userId,
  });

  revalidatePath("/announcements");
  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
  return {};
}

export async function markAllAnnouncementsRead(candidateId: string) {
  const session = await requireCandidateAuth();
  if (session.candidateId !== candidateId) return;

  const all = await db.select({ id: announcements.id }).from(announcements);
  for (const a of all) {
    await db
      .insert(announcementReads)
      .values({ announcementId: a.id, candidateId })
      .onConflictDoNothing();
  }
  revalidatePath("/announcements");
}
