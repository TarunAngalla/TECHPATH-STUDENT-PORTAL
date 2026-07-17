import { and, desc, eq, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { announcementReads, announcements } from "@/lib/db/schema";

export async function getAnnouncementsForCandidate(candidateId: string) {
  const rows = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      createdAt: announcements.createdAt,
      readAt: announcementReads.readAt,
    })
    .from(announcements)
    .leftJoin(
      announcementReads,
      and(
        eq(announcementReads.announcementId, announcements.id),
        eq(announcementReads.candidateId, candidateId),
      ),
    )
    .where(or(isNull(announcements.targetCandidateId), eq(announcements.targetCandidateId, candidateId)))
    .orderBy(desc(announcements.createdAt));

  return rows.map((r) => ({ ...r, isRead: Boolean(r.readAt) }));
}

export async function getAllAnnouncements() {
  return db.select().from(announcements).orderBy(desc(announcements.createdAt));
}
