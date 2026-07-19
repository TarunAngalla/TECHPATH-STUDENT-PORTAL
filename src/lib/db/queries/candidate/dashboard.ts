import { and, desc, eq, or, sql } from "drizzle-orm";
import { INTERVIEW_STATUSES } from "@/lib/constants/status-meta";
import { db } from "@/lib/db";
import {
  announcements,
  announcementReads,
  applications,
  candidates,
  documents,
  passwordChangeLog,
  candidateTrainings,
  trainings,
} from "@/lib/db/schema";
import { getUnreadMessageCount as getUnreadForUser } from "@/lib/db/queries/shared/messages";

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
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const upcomingThisMonth = apps.filter((a) => {
    if (!a.upcomingWhen) return false;
    const when = new Date(a.upcomingWhen);
    return when >= monthStart && when <= monthEnd;
  }).length;

  const appsThisWeek = apps.filter((a) => new Date(a.createdAt) >= weekStart).length;

  const trainingRows = await db
    .select({
      id: candidateTrainings.id,
      status: candidateTrainings.status,
      completedAt: candidateTrainings.completedAt,
      title: trainings.title,
    })
    .from(candidateTrainings)
    .innerJoin(trainings, eq(candidateTrainings.trainingId, trainings.id))
    .where(eq(candidateTrainings.candidateId, candidateId))
    .orderBy(desc(candidateTrainings.completedAt));

  const completedTrainings = trainingRows.filter((t) => t.status === "completed");
  const upcomingTrainings = trainingRows.filter((t) => t.status === "upcoming");

  const recentActivity = [...apps]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 8);

  return {
    totalApplications: apps.length,
    inInterviewProcess: apps.filter((a) =>
      INTERVIEW_STATUSES.includes(a.status as (typeof INTERVIEW_STATUSES)[number]),
    ).length,
    upcomingThisMonth,
    appsThisWeek,
    applications: apps,
    upcoming: apps
      .filter((a) => a.upcomingWhen)
      .sort((a, b) => new Date(a.upcomingWhen!).getTime() - new Date(b.upcomingWhen!).getTime()),
    trainings: {
      completed: completedTrainings,
      upcoming: upcomingTrainings,
      total: trainingRows.length,
      completedCount: completedTrainings.length,
    },
    recentActivity,
  };
}

export async function getUnreadMessageCount(_candidateId: string, userId: string) {
  return getUnreadForUser(userId);
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

export async function getOnboardingChecklist(candidateId: string) {
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

  const mockTrainings = await db
    .select({ status: candidateTrainings.status })
    .from(candidateTrainings)
    .innerJoin(trainings, eq(candidateTrainings.trainingId, trainings.id))
    .where(
      and(
        eq(candidateTrainings.candidateId, candidateId),
        sql`LOWER(${trainings.title}) LIKE '%mock interview%'`
      )
    )
    .limit(1);

  const hasCompletedMock = mockTrainings.some((t) => t.status === "completed");

  return [
    { key: "account", label: "Account created by recruiter", done: true, href: "/settings" },
    { key: "profile", label: "Complete your candidate profile", done: Boolean(candidate?.phone), href: "/settings" },
    { key: "resume", label: "Upload your resume", done: Boolean(resume), href: "/documents" },
    { key: "interview", label: "Attend your first interview", done: hasInterview, href: "/upcoming" },
    { key: "training", label: "Finish technical mock interview training", done: hasCompletedMock, href: "/trainings" },
  ];
}
