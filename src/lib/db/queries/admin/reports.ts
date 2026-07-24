import { and, count, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applicationEvents,
  applications,
  candidateRecruiterAssignments,
  candidates,
  leads,
  users,
} from "@/lib/db/schema";
import { labelLeadSource } from "@/lib/reports/range";

function pct(part: number, whole: number) {
  if (whole <= 0) return null as number | null;
  return (part / whole) * 100;
}

export async function getEnquirySourceReportData(startDate: Date, endDate: Date) {
  const allLeads = await db
    .select({
      id: leads.id,
      source: leads.source,
      status: leads.status,
      consultationStatus: leads.consultationStatus,
      convertedCandidateId: leads.convertedCandidateId,
    })
    .from(leads)
    .where(and(gte(leads.createdAt, startDate), lt(leads.createdAt, endDate)));

  const total = allLeads.length;
  const uncontacted = allLeads.filter((l) => l.status === "new").length;
  const completedConsults = allLeads.filter((l) => l.consultationStatus === "completed").length;
  const portals = allLeads.filter((l) => Boolean(l.convertedCandidateId)).length;

  const sourceGroups = allLeads.reduce(
    (acc, l) => {
      if (!acc[l.source]) acc[l.source] = { count: 0, consultations: 0, portals: 0 };
      acc[l.source].count++;
      if (l.consultationStatus === "completed") acc[l.source].consultations++;
      if (l.convertedCandidateId) acc[l.source].portals++;
      return acc;
    },
    {} as Record<string, { count: number; consultations: number; portals: number }>,
  );

  const breakdown = Object.entries(sourceGroups)
    .map(([source, data]) => ({
      source,
      sourceLabel: labelLeadSource(source),
      count: data.count,
      pctTotal: pct(data.count, total) ?? 0,
      consultations: data.consultations,
      consultationsPct: pct(data.consultations, data.count),
      portals: data.portals,
      portalsPct: pct(data.portals, data.count),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    kpis: {
      totalEnquiries: total,
      consultationCompletedPct: pct(completedConsults, total),
      portalConvertedPct: pct(portals, total),
      uncontacted,
    },
    breakdown,
  };
}

export async function getConversionFunnelReportData(startDate: Date, endDate: Date) {
  const [allLeadsCount] = await db.select({ count: count() }).from(leads);
  const [consultationCompleted] = await db
    .select({ count: count() })
    .from(leads)
    .where(eq(leads.consultationStatus, "completed"));
  const [portalCount] = await db.select({ count: count() }).from(candidates);
  const [ndaSigned] = await db
    .select({ count: count() })
    .from(candidates)
    .innerJoin(users, eq(users.id, candidates.userId))
    .where(eq(users.accountState, "active"));
  const [marketingLive] = await db
    .select({ count: count() })
    .from(candidates)
    .where(eq(candidates.marketingStatus, "live"));

  const interviewRows = await db
    .select({
      candidateId: applicationEvents.candidateId,
      status: applicationEvents.status,
    })
    .from(applicationEvents)
    .where(eq(applicationEvents.eventType, "interview"));

  const interviewsInProgress = new Set(
    interviewRows
      .filter((row) =>
        ["scheduled", "confirmed", "rescheduled", "feedback_pending"].includes(row.status),
      )
      .map((row) => row.candidateId),
  ).size;

  const [placedRow] = await db
    .select({ count: count() })
    .from(applications)
    .where(inArray(applications.status, ["offer", "hired"]));

  const snapshot = [
    { key: "enquiry", label: "Enquiry Received", shortLabel: "Enquiry", count: Number(allLeadsCount?.count ?? 0) },
    { key: "consultation", label: "Consultation Completed", shortLabel: "Consult", count: Number(consultationCompleted?.count ?? 0) },
    { key: "portal", label: "Portal Access Granted", shortLabel: "Portal", count: Number(portalCount?.count ?? 0) },
    { key: "ndaSigned", label: "NDA Signed", shortLabel: "NDA", count: Number(ndaSigned?.count ?? 0) },
    { key: "marketingLive", label: "Marketing Live", shortLabel: "Marketing", count: Number(marketingLive?.count ?? 0) },
    { key: "interviews", label: "Interviews in Progress", shortLabel: "Interviews", count: interviewsInProgress },
    { key: "placed", label: "Offer / Hired", shortLabel: "Placed", count: Number(placedRow?.count ?? 0) },
  ];

  const stages = snapshot.map((stage, i) => {
    if (i === 0) return { ...stage, fromPrev: null as number | null, drop: 0 };
    const prev = snapshot[i - 1]!.count;
    return {
      ...stage,
      fromPrev: pct(stage.count, prev),
      drop: Math.max(0, prev - stage.count),
    };
  });

  const [newLeads] = await db
    .select({ count: count() })
    .from(leads)
    .where(and(gte(leads.createdAt, startDate), lt(leads.createdAt, endDate)));
  const [newCandidates] = await db
    .select({ count: count() })
    .from(candidates)
    .where(and(gte(candidates.createdAt, startDate), lt(candidates.createdAt, endDate)));
  const [interviewsScheduled] = await db
    .select({ count: count() })
    .from(applicationEvents)
    .where(
      and(
        eq(applicationEvents.eventType, "interview"),
        gte(applicationEvents.scheduledAt, startDate),
        lt(applicationEvents.scheduledAt, endDate),
      ),
    );

  const enquiries = stages[0]!.count;
  const placed = stages[stages.length - 1]!.count;
  const marketing = stages.find((s) => s.key === "marketingLive")!.count;
  const overallRate = placed > 0 ? pct(placed, enquiries) : pct(marketing, enquiries);

  return {
    stages,
    periodActivity: {
      newLeads: Number(newLeads?.count ?? 0),
      newCandidates: Number(newCandidates?.count ?? 0),
      interviewsScheduled: Number(interviewsScheduled?.count ?? 0),
    },
    kpis: {
      topOfFunnel: enquiries,
      bottomOfFunnel: placed,
      overallConversionPct: overallRate,
      overallConversionLabel: placed > 0 ? "Placed / Enquiries" : "Marketing Live / Enquiries",
    },
  };
}

export async function getRecruiterPerformanceReportData(startDate: Date, endDate: Date) {
  const recruiters = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.role, "recruiter"));

  const allCandidates = await db
    .select({
      id: candidates.id,
      recruiterId: candidates.recruiterId,
      marketingStatus: candidates.marketingStatus,
    })
    .from(candidates);

  const assignmentsInRange = await db
    .select({
      candidateId: candidateRecruiterAssignments.candidateId,
      recruiterId: candidateRecruiterAssignments.recruiterId,
      assignedAt: candidateRecruiterAssignments.assignedAt,
    })
    .from(candidateRecruiterAssignments)
    .where(
      and(
        gte(candidateRecruiterAssignments.assignedAt, startDate),
        lt(candidateRecruiterAssignments.assignedAt, endDate),
      ),
    );

  const cIds = allCandidates.map((c) => c.id);

  const apps = cIds.length
    ? await db
        .select()
        .from(applications)
        .where(
          and(
            inArray(applications.candidateId, cIds),
            gte(applications.createdAt, startDate),
            lt(applications.createdAt, endDate),
          ),
        )
    : [];

  const events = cIds.length
    ? await db
        .select()
        .from(applicationEvents)
        .where(
          and(
            inArray(applicationEvents.candidateId, cIds),
            gte(applicationEvents.createdAt, startDate),
            lt(applicationEvents.createdAt, endDate),
          ),
        )
    : [];

  const breakdown = recruiters
    .map((r) => {
      const book = allCandidates.filter((c) => c.recruiterId === r.id);
      const assignedInPeriod = new Set(
        assignmentsInRange.filter((a) => a.recruiterId === r.id).map((a) => a.candidateId),
      ).size;
      const bookIds = new Set(book.map((c) => c.id));
      const rApps = apps.filter((a) => bookIds.has(a.candidateId));
      const rEvents = events.filter((e) => bookIds.has(e.candidateId));
      const interviews = rEvents.filter((e) => e.eventType === "interview").length;
      const assessments = rEvents.filter((e) => e.eventType === "assessment").length;
      const offers = rApps.filter((a) => a.status === "offer" || a.status === "hired").length;

      return {
        recruiterId: r.id,
        recruiterName: r.email,
        displayName: (r.email.split("@")[0] ?? r.email)
          .split(/[._-]/)
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join(" "),
        bookSize: book.length,
        assignedInPeriod,
        marketingLive: book.filter((c) => c.marketingStatus === "live").length,
        applications: rApps.length,
        interviews,
        assessments,
        offers,
      };
    })
    .filter((b) => b.bookSize > 0 || b.assignedInPeriod > 0 || b.applications > 0 || b.interviews > 0)
    .sort((a, b) => b.interviews - a.interviews || b.applications - a.applications);

  const totalAssignedPeriod = breakdown.reduce((acc, b) => acc + b.assignedInPeriod, 0);
  const totalInterviews = breakdown.reduce((acc, b) => acc + b.interviews, 0);
  const totalOffers = breakdown.reduce((acc, b) => acc + b.offers, 0);
  const activeRecruiters = breakdown.filter(
    (b) => b.assignedInPeriod > 0 || b.applications > 0 || b.interviews > 0,
  ).length;

  return {
    kpis: {
      activeRecruiters,
      candidatesAssignedPeriod: totalAssignedPeriod,
      interviewsPeriod: totalInterviews,
      offersHired: totalOffers,
    },
    breakdown,
  };
}

export async function getMarketingActivityReportData(startDate: Date, endDate: Date) {
  const cands = await db
    .select({
      id: candidates.id,
      fullName: candidates.fullName,
      recruiterId: candidates.recruiterId,
      marketingStatus: candidates.marketingStatus,
    })
    .from(candidates);

  const allApps = await db.select().from(applications);
  const periodApps = allApps.filter((a) => {
    const d = new Date(a.createdAt);
    return d >= startDate && d < endDate;
  });

  const periodEvents = await db
    .select()
    .from(applicationEvents)
    .where(and(gte(applicationEvents.createdAt, startDate), lt(applicationEvents.createdAt, endDate)));

  const recruiters = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.role, "recruiter"));

  const breakdown = cands
    .map((c) => {
      const lifetimeApps = allApps.filter((a) => a.candidateId === c.id);
      const cApps = periodApps.filter((a) => a.candidateId === c.id);
      const cEvents = periodEvents.filter((e) => e.candidateId === c.id);
      const interviews = cEvents.filter((e) => e.eventType === "interview").length;
      const assessments = cEvents.filter((e) => e.eventType === "assessment").length;
      const needsAttention = c.marketingStatus === "live" && lifetimeApps.length === 0;

      let lastActivity: Date | null = null;
      const dates = [
        ...lifetimeApps.map((a) => new Date(a.createdAt)),
        ...cEvents.map((e) => new Date(e.createdAt)),
      ];
      if (dates.length) lastActivity = new Date(Math.max(...dates.map((d) => d.getTime())));

      return {
        candidateId: c.id,
        candidateName: c.fullName,
        recruiterName: (() => {
          const email = recruiters.find((r) => r.id === c.recruiterId)?.email;
          if (!email) return "Unassigned";
          return (email.split("@")[0] ?? email)
            .split(/[._-]/)
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
            .join(" ");
        })(),
        applications: cApps.length,
        lifetimeApplications: lifetimeApps.length,
        interviews,
        assessments,
        marketingStatus: c.marketingStatus,
        lastActivityDate: lastActivity ? lastActivity.toISOString() : null,
        needsAttention,
      };
    })
    .filter(
      (b) =>
        b.applications > 0 ||
        b.interviews > 0 ||
        b.assessments > 0 ||
        b.needsAttention ||
        b.marketingStatus === "live",
    )
    .sort((a, b) => Number(b.needsAttention) - Number(a.needsAttention) || b.applications - a.applications);

  return {
    kpis: {
      applications: periodApps.length,
      interviews: periodEvents.filter((e) => e.eventType === "interview").length,
      assessments: periodEvents.filter((e) => e.eventType === "assessment").length,
      needsAttention: breakdown.filter((b) => b.needsAttention).length,
    },
    breakdown,
  };
}

/** Latest assignment date per candidate for dashboard table. */
export async function getLatestAssignmentDates(candidateIds: string[]) {
  if (candidateIds.length === 0) return {} as Record<string, Date>;
  const rows = await db
    .select({
      candidateId: candidateRecruiterAssignments.candidateId,
      assignedAt: candidateRecruiterAssignments.assignedAt,
    })
    .from(candidateRecruiterAssignments)
    .where(inArray(candidateRecruiterAssignments.candidateId, candidateIds))
    .orderBy(desc(candidateRecruiterAssignments.assignedAt));

  const map: Record<string, Date> = {};
  for (const row of rows) {
    if (!map[row.candidateId]) map[row.candidateId] = row.assignedAt;
  }
  return map;
}
