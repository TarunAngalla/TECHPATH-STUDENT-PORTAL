import { and, count, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { INTERVIEW_STATUSES } from "@/lib/constants/status-meta";
import type { StaffScope } from "@/lib/auth/staff-scope";
import { db } from "@/lib/db";
import {
  applications,
  auditLog,
  candidates,
  leads,
  messages,
  users,
} from "@/lib/db/schema";
import { getCandidatesList } from "./candidates";

function candidateScopeFilter(scope?: StaffScope) {
  if (!scope || scope.seesAllCandidates || !scope.recruiterId) return undefined;
  return eq(candidates.recruiterId, scope.recruiterId);
}

function percent(part: number, whole: number) {
  if (whole <= 0) return "—";
  return `${((part / whole) * 100).toFixed(1)}% conversion`;
}

function weekLabel(start: Date) {
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)}–${fmt(end)}`;
}

import { getUnreadMessageCount } from "@/lib/db/queries/shared/messages";

export async function getUnreadStaffMessageCount(scope: StaffScope) {
  return getUnreadMessageCount(scope.userId);
}

export async function getDashboardStats(scope?: StaffScope) {
  const scopeFilter = candidateScopeFilter(scope);

  const [newLeads] = await db
    .select({ count: count() })
    .from(leads)
    .where(eq(leads.status, "new"));

  const [consultationLeads] = await db
    .select({ count: count() })
    .from(leads)
    .where(eq(leads.source, "consultation_booked"));

  const [allLeadsCount] = await db.select({ count: count() }).from(leads);

  const [activeCandidatesRow] = await db
    .select({ count: count() })
    .from(candidates)
    .where(scopeFilter);

  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const scopedCandidates = await db
    .select({
      id: candidates.id,
      fullName: candidates.fullName,
      journeyStage: candidates.journeyStage,
      recruiterId: candidates.recruiterId,
      createdAt: candidates.createdAt,
    })
    .from(candidates)
    .where(scopeFilter)
    .orderBy(desc(candidates.createdAt));

  const scopedIds = scopedCandidates.map((c) => c.id);

  const allApps =
    scopedIds.length === 0
      ? []
      : await db.select().from(applications).where(inArray(applications.candidateId, scopedIds));

  const interviewsThisWeek = allApps.filter((a) => {
    if (!a.upcomingWhen) return false;
    const when = new Date(a.upcomingWhen);
    return (
      when >= weekStart &&
      when <= weekEnd &&
      INTERVIEW_STATUSES.includes(a.status as (typeof INTERVIEW_STATUSES)[number])
    );
  }).length;

  const interviewsInProgress = allApps.filter((a) =>
    INTERVIEW_STATUSES.includes(a.status as (typeof INTERVIEW_STATUSES)[number]),
  ).length;

  const marketingLive = scopedCandidates.filter((c) => c.journeyStage >= 2).length;
  const portalAccessGranted = Number(activeCandidatesRow?.count ?? 0);
  const placedCount = allApps.filter((a) => a.status === "offer").length;

  const unreadMessages = scope ? await getUnreadStaffMessageCount(scope) : 0;

  const workload = await db
    .select({ recruiterId: candidates.recruiterId, count: count() })
    .from(candidates)
    .where(scopeFilter)
    .groupBy(candidates.recruiterId);

  const recruiterEmails = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.role, "recruiter"));

  const recentAudit = await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(10);

  const recentMessages: {
    id: string;
    body: string;
    sentAt: Date;
    candidateId: string;
    senderRole: string;
  }[] = [];

  if (scope) {
    const rawRecent = await db
      .select({
        id: messages.id,
        body: messages.body,
        sentAt: messages.sentAt,
        senderId: messages.senderId,
      })
      .from(messages)
      .where(eq(messages.receiverId, scope.userId))
      .orderBy(desc(messages.sentAt))
      .limit(10);

    for (const rm of rawRecent) {
      const [cand] = await db
        .select({ id: candidates.id })
        .from(candidates)
        .where(eq(candidates.userId, rm.senderId))
        .limit(1);

      if (cand) {
        recentMessages.push({
          id: rm.id,
          body: rm.body,
          sentAt: rm.sentAt,
          candidateId: cand.id,
          senderRole: "candidate",
        });
      }
    }
  }

  const candidateList = await getCandidatesList(scope);

  const recentLeads = await db
    .select({
      id: leads.id,
      name: leads.name,
      email: leads.email,
      source: leads.source,
      status: leads.status,
      notes: leads.notes,
      createdAt: leads.createdAt,
    })
    .from(leads)
    .orderBy(desc(leads.createdAt))
    .limit(6);

  const assignments = candidateList
    .filter((c) => c.recruiterId)
    .slice(0, 6)
    .map((c) => ({
      candidateId: c.id,
      candidateName: c.fullName,
      recruiterEmail: c.recruiterEmail ?? "Unassigned",
      journeyStage: c.journeyStage,
    }));

  const marketingProgress = await Promise.all(
    scopedCandidates.slice(0, 6).map(async (c) => {
      const apps = allApps.filter((a) => a.candidateId === c.id);
      const interviews = apps.filter((a) =>
        INTERVIEW_STATUSES.includes(a.status as (typeof INTERVIEW_STATUSES)[number]),
      ).length;
      const assessments = apps.filter((a) => a.status === "assessment").length;
      const maxBar = Math.max(apps.length, 1);
      return {
        candidateId: c.id,
        candidateName: c.fullName,
        appCount: apps.length,
        interviews,
        assessments,
        journeyStage: c.journeyStage,
        appliedPct: Math.min(100, Math.round((apps.length / maxBar) * 70)),
        interviewPct: Math.min(30, Math.round((interviews / maxBar) * 30)),
      };
    }),
  );

  // Weekly conversion trend for last 5 weeks from real timestamps
  const weeklyTrend: {
    name: string;
    Enquiries: number;
    Consultations: number;
    Portal: number;
    Marketing: number;
    Interviews: number;
  }[] = [];

  for (let i = 4; i >= 0; i--) {
    const start = new Date(weekStart);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const leadRows = await db
      .select({ source: leads.source, createdAt: leads.createdAt })
      .from(leads)
      .where(and(gte(leads.createdAt, start), lt(leads.createdAt, end)));

    const candidatesCreated = await db
      .select({ journeyStage: candidates.journeyStage, createdAt: candidates.createdAt })
      .from(candidates)
      .where(and(gte(candidates.createdAt, start), lt(candidates.createdAt, end), scopeFilter));

    const appsInWeek = allApps.filter((a) => {
      const d = new Date(a.createdAt);
      return d >= start && d < end;
    });

    weeklyTrend.push({
      name: weekLabel(start),
      Enquiries: leadRows.filter((l) => l.source === "enquiry_form").length,
      Consultations: leadRows.filter((l) => l.source === "consultation_booked").length,
      Portal: candidatesCreated.length,
      Marketing: candidatesCreated.filter((c) => c.journeyStage >= 2).length,
      Interviews: appsInWeek.filter((a) =>
        INTERVIEW_STATUSES.includes(a.status as (typeof INTERVIEW_STATUSES)[number]),
      ).length,
    });
  }

  const periodLabel = `${weekLabel(weekStart)} ${weekStart.getFullYear()}`;

  const enquiries = Number(allLeadsCount?.count ?? 0);
  const consultations = Number(consultationLeads?.count ?? 0);

  return {
    newLeads: Number(newLeads?.count ?? 0),
    consultations,
    activeCandidates: portalAccessGranted,
    marketingLive,
    interviewsThisWeek,
    interviewsInProgress,
    recruitersAssigned: workload.filter((w) => w.recruiterId).length,
    unreadMessages,
    periodLabel,
    funnel: {
      enquiries,
      consultations,
      portalAccess: portalAccessGranted,
      marketingLive,
      interviewsInProgress,
      placed: placedCount,
      conversions: {
        consultations: percent(consultations, enquiries),
        portal: percent(portalAccessGranted, consultations || enquiries),
        marketing: percent(marketingLive, portalAccessGranted),
        interviews: percent(interviewsInProgress, marketingLive || portalAccessGranted),
      },
    },
    workload: workload.map((w) => ({
      recruiterId: w.recruiterId,
      count: Number(w.count),
      email: recruiterEmails.find((r) => r.id === w.recruiterId)?.email ?? "Unassigned",
    })),
    recentAudit,
    recentMessages,
    recentLeads,
    assignments,
    marketingProgress,
    weeklyTrend,
    candidateNames: Object.fromEntries(candidateList.map((c) => [c.id, c.fullName])),
    exportRows: candidateList.map((c) => ({
      name: c.fullName,
      email: c.email,
      recruiter: c.recruiterEmail ?? "",
      journeyStage: c.journeyStage,
      applications: c.applicationCount,
    })),
  };
}
