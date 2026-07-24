import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { INTERVIEW_COMPLETED_STATUSES, UPCOMING_EVENT_STATUSES, summarizeApplicationActivities, type ApplicationEventStatus } from "@/lib/constants/application-activity";
import { db } from "@/lib/db";
import {
  applicationEvents,
  applications,
  candidates,
  documents,
  passwordChangeLog,
  candidateTrainings,
  trainings,
} from "@/lib/db/schema";
import { getUnreadMessageCount as getUnreadForUser } from "@/lib/db/queries/shared/messages";
import { getCandidateVisibleApplicationsByCandidateId } from "@/lib/db/queries/shared/applications";

export { getAnnouncementsForCandidate } from "@/lib/db/queries/shared/announcements";
export { getCandidateByUserId } from "./candidate-helpers";

export async function getDashboardStatsForCandidate(candidateId: string) {
  const [apps, activities] = await Promise.all([
    getCandidateVisibleApplicationsByCandidateId(candidateId),
    db
      .select({
        id: applicationEvents.id,
        eventType: applicationEvents.eventType,
        status: applicationEvents.status,
        scheduledAt: applicationEvents.scheduledAt,
        completedAt: applicationEvents.completedAt,
        createdAt: applicationEvents.createdAt,
      })
      .from(applicationEvents)
      .innerJoin(applications, eq(applications.id, applicationEvents.applicationId))
      .where(
        and(
          eq(applicationEvents.candidateId, candidateId),
          eq(applicationEvents.candidateVisible, true),
          ne(applications.status, "draft"),
        ),
      ),
  ]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const upcomingActivities = activities
    .filter((event) => {
      if (!event.scheduledAt || !UPCOMING_EVENT_STATUSES.includes(event.status as ApplicationEventStatus)) return false;
      return new Date(event.scheduledAt) >= now;
    })
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());

  const upcomingThisMonth = upcomingActivities.filter((event) => {
    const when = new Date(event.scheduledAt!);
    return when >= monthStart && when <= monthEnd;
  }).length;

  const activityMetrics = summarizeApplicationActivities(activities, now);
  const { interviewsAttended, assessmentsCompleted, interviewsInProgress: inInterviewProcess } = activityMetrics;
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
    totalApplications: apps.filter((app) => app.status !== "draft").length,
    inInterviewProcess,
    interviewsAttended,
    assessmentsCompleted,
    upcomingThisMonth,
    upcomingInterviewCount: activityMetrics.upcomingInterviews,
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

  const [interviewEvidence] = await db
    .select({ id: applicationEvents.id })
    .from(applicationEvents)
    .innerJoin(applications, eq(applications.id, applicationEvents.applicationId))
    .where(
      and(
        eq(applicationEvents.candidateId, candidateId),
        eq(applicationEvents.eventType, "interview"),
        eq(applicationEvents.candidateVisible, true),
        ne(applications.status, "draft"),
        inArray(applicationEvents.status, INTERVIEW_COMPLETED_STATUSES),
      ),
    )
    .limit(1);

  const hasInterview = Boolean(interviewEvidence);

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
    { key: "resume", label: "Resume received by TechPath", done: Boolean(resume), href: "/resources" },
    { key: "interview", label: "Attend your first interview", done: hasInterview, href: "/interview-details" },
    { key: "training", label: "Finish technical mock interview training", done: hasCompletedMock, href: "/trainings" },
  ];
}
