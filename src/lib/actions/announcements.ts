"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCandidatePortalAccess, requireStaffAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { announcementReads, announcements } from "@/lib/db/schema";
import { getAnnouncementsForCandidate } from "@/lib/db/queries/shared/announcements";

export async function markAnnouncementRead(announcementId: string, candidateId?: string) {
  const session = await requireCandidatePortalAccess();
  const targetCandidateId = candidateId ?? session.candidateId;
  if (!targetCandidateId || session.candidateId !== targetCandidateId) return;

  await db
    .insert(announcementReads)
    .values({ announcementId, candidateId: targetCandidateId })
    .onConflictDoNothing();

  revalidatePath("/announcements");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
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

  if (parsed.data.targetCandidateId) {
    const { getStaffScope } = await import("@/lib/auth/staff-scope");
    const { assertCandidateInScope } = await import("@/lib/db/queries/admin/candidates");
    if (!(await assertCandidateInScope(parsed.data.targetCandidateId, getStaffScope(session)))) {
      return { error: "Forbidden" };
    }
  } else if (session.role === "recruiter") {
    // Recruiters may only broadcast to their own book via targeted announcements
    return { error: "Recruiters must target one of their candidates" };
  }

  await db.insert(announcements).values({
    title: parsed.data.title,
    body: parsed.data.body,
    targetCandidateId: parsed.data.targetCandidateId ?? null,
    createdBy: session.userId,
  });

  revalidatePath("/announcements");
  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
  return {};
}

export async function markAllAnnouncementsRead(candidateId: string) {
  const session = await requireCandidatePortalAccess();
  if (session.candidateId !== candidateId) return;

  const all = await getAnnouncementsForCandidate(candidateId);
  for (const a of all) {
    await db
      .insert(announcementReads)
      .values({ announcementId: a.id, candidateId })
      .onConflictDoNothing();
  }
  revalidatePath("/announcements");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
}

/** Live pulse for candidate bell / layout without a full page reload. */
export async function getCandidateAnnouncementsPulseAction() {
  const session = await requireCandidatePortalAccess();
  if (!session.candidateId) {
    return {
      unreadCount: 0,
      announcements: [] as Awaited<ReturnType<typeof getAnnouncementsForCandidate>>,
    };
  }
  const list = await getAnnouncementsForCandidate(session.candidateId);
  return {
    unreadCount: list.filter((a) => !a.isRead).length,
    announcements: list,
  };
}
