import { count, desc, eq } from "drizzle-orm";
import { INTERVIEW_STATUSES } from "@/lib/constants/status-meta";
import { db } from "@/lib/db";
import { applications, auditLog, candidates, leads, messages, users } from "@/lib/db/schema";
import { getCandidatesList } from "./candidates";

export async function getDashboardStats() {
  const [newLeads] = await db
    .select({ count: count() })
    .from(leads)
    .where(eq(leads.status, "new"));

  const [activeCandidates] = await db.select({ count: count() }).from(candidates);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const allApps = await db.select().from(applications);
  const interviewsThisWeek = allApps.filter((a) => {
    if (!a.upcomingWhen) return false;
    const when = new Date(a.upcomingWhen);
    return (
      when >= weekStart &&
      when <= weekEnd &&
      INTERVIEW_STATUSES.includes(a.status as (typeof INTERVIEW_STATUSES)[number])
    );
  }).length;

  const [unreadMessages] = await db
    .select({ count: count() })
    .from(messages)
    .where(eq(messages.senderRole, "candidate"));

  const leadRows = await db.select().from(leads);
  const candidateCount = Number(activeCandidates?.count ?? 0);
  const placedCount = allApps.filter((a) => a.status === "offer").length;

  const workload = await db
    .select({ recruiterId: candidates.recruiterId, count: count() })
    .from(candidates)
    .groupBy(candidates.recruiterId);

  const recruiterEmails = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.role, "recruiter"));

  const recentAudit = await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(10);

  const recentMessages = await db
    .select({
      id: messages.id,
      body: messages.body,
      sentAt: messages.sentAt,
      candidateId: messages.candidateId,
      senderRole: messages.senderRole,
    })
    .from(messages)
    .orderBy(desc(messages.sentAt))
    .limit(10);

  const candidateList = await getCandidatesList();

  return {
    newLeads: Number(newLeads?.count ?? 0),
    activeCandidates: candidateCount,
    interviewsThisWeek,
    unreadMessages: Number(unreadMessages?.count ?? 0),
    funnel: {
      enquiries: leadRows.filter((l) => l.source === "enquiry_form").length,
      consultations: leadRows.filter((l) => l.source === "consultation_booked").length,
      active: candidateCount,
      placed: placedCount,
    },
    workload: workload.map((w) => ({
      recruiterId: w.recruiterId,
      count: Number(w.count),
      email: recruiterEmails.find((r) => r.id === w.recruiterId)?.email ?? "Unassigned",
    })),
    recentAudit,
    recentMessages,
    candidateNames: Object.fromEntries(candidateList.map((c) => [c.id, c.fullName])),
  };
}
