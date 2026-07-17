import { and, desc, eq, or, sql } from "drizzle-orm";
import { INTERVIEW_STATUSES } from "@/lib/constants/status-meta";
import { db } from "@/lib/db";
import {
  announcements,
  announcementReads,
  applications,
  candidates,
  documents,
  messageReads,
  messages,
  passwordChangeLog,
} from "@/lib/db/schema";

export { getCandidateByUserId } from "./candidate-helpers";

export async function getDashboardStatsForCandidate(candidateId: string) {
  const apps = await db
    .select()
    .from(applications)
    .where(eq(applications.candidateId, candidateId))
    .orderBy(desc(applications.dateApplied));

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const upcomingThisMonth = apps.filter((a) => {
    if (!a.upcomingWhen) return false;
    const when = new Date(a.upcomingWhen);
    return when >= monthStart && when <= monthEnd;
  }).length;

  return {
    totalApplications: apps.length,
    inInterviewProcess: apps.filter((a) =>
      INTERVIEW_STATUSES.includes(a.status as (typeof INTERVIEW_STATUSES)[number]),
    ).length,
    upcomingThisMonth,
    applications: apps,
    upcoming: apps
      .filter((a) => a.upcomingWhen)
      .sort((a, b) => new Date(a.upcomingWhen!).getTime() - new Date(b.upcomingWhen!).getTime()),
  };
}

export async function getUnreadMessageCount(candidateId: string, userId: string) {
  const recruiterMessages = await db
    .select({ id: messages.id })
    .from(messages)
    .where(and(eq(messages.candidateId, candidateId), eq(messages.senderRole, "recruiter")));

  if (recruiterMessages.length === 0) return 0;

  const readIds = await db
    .select({ messageId: messageReads.messageId })
    .from(messageReads)
    .where(
      and(eq(messageReads.userId, userId), eq(messageReads.candidateId, candidateId)),
    );

  const readSet = new Set(readIds.map((r) => r.messageId));
  return recruiterMessages.filter((m) => !readSet.has(m.id)).length;
}

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
    .where(or(sql`${announcements.targetCandidateId} IS NULL`, eq(announcements.targetCandidateId, candidateId)))
    .orderBy(desc(announcements.createdAt));

  return rows.map((r) => ({ ...r, isRead: Boolean(r.readAt) }));
}

export async function getLatestPasswordChange(userId: string) {
  const [row] = await db
    .select()
    .from(passwordChangeLog)
    .where(eq(passwordChangeLog.userId, userId))
    .orderBy(desc(passwordChangeLog.changedAt))
    .limit(1);
  return row ?? null;
}

export async function getPasswordChangeHistory(userId: string) {
  return db
    .select()
    .from(passwordChangeLog)
    .where(eq(passwordChangeLog.userId, userId))
    .orderBy(desc(passwordChangeLog.changedAt));
}

export async function getOnboardingChecklist(candidateId: string, _userId: string) {
  const [resume] = await db
    .select()
    .from(documents)
    .where(and(eq(documents.candidateId, candidateId), eq(documents.category, "resume")))
    .limit(1);

  const [candidate] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, candidateId))
    .limit(1);

  const apps = await db
    .select()
    .from(applications)
    .where(eq(applications.candidateId, candidateId));

  const hasInterview = apps.some((a) =>
    ["interview_r1", "interview_r2", "interview_r3", "hr_round", "final_round", "offer"].includes(a.status),
  );

  return [
    { label: "Account created by recruiter", done: true, href: "/settings" },
    { label: "Complete your candidate profile", done: Boolean(candidate?.phone), href: "/settings" },
    { label: "Upload your resume", done: Boolean(resume), href: "/documents" },
    { label: "Attend your first interview", done: hasInterview, href: "/upcoming" },
    { label: "Finish technical mock interview training", done: false, href: "/trainings" },
  ];
}
