import { and, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  applicationEvents,
  applications,
  candidates,
  leads,
  staffProfiles,
  users,
} from "@/lib/db/schema";
import type { CsvPrimitive } from "@/lib/utils/csv";

export const reportTypes = ["enquiries", "candidates", "applications", "interviews", "assessments", "recruiters"] as const;
export type ReportType = (typeof reportTypes)[number];

export type ReportRange = { from?: Date; to?: Date };

export async function getReportRows(type: ReportType, range: ReportRange): Promise<Record<string, CsvPrimitive>[]> {
  if (type === "enquiries") {
    const rows = await db
      .select({
        name: leads.name,
        email: leads.email,
        phone: leads.phone,
        optType: leads.optType,
        roleInterest: leads.roleInterest,
        status: leads.status,
        consultationStatus: leads.consultationStatus,
        createdAt: leads.createdAt,
        reviewedAt: leads.reviewedAt,
      })
      .from(leads)
      .where(and(range.from ? gte(leads.createdAt, range.from) : undefined, range.to ? lte(leads.createdAt, range.to) : undefined))
      .orderBy(desc(leads.createdAt));
    return rows.map((row) => ({
      Name: row.name,
      Email: row.email,
      Phone: row.phone,
      "OPT Type": row.optType,
      "Role Interest": row.roleInterest,
      Status: row.status,
      Consultation: row.consultationStatus,
      "Submitted At": row.createdAt,
      "Reviewed At": row.reviewedAt,
    }));
  }

  if (type === "candidates") {
    const rows = await db
      .select({
        id: candidates.id,
        fullName: candidates.fullName,
        email: users.email,
        optType: candidates.optType,
        journeyStage: candidates.journeyStage,
        marketingStatus: candidates.marketingStatus,
        recruiterId: candidates.recruiterId,
        accountState: users.accountState,
        createdAt: candidates.createdAt,
      })
      .from(candidates)
      .innerJoin(users, eq(users.id, candidates.userId))
      .where(and(range.from ? gte(candidates.createdAt, range.from) : undefined, range.to ? lte(candidates.createdAt, range.to) : undefined))
      .orderBy(desc(candidates.createdAt));
    const recruiters = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.role, "recruiter"));
    const recruiterMap = new Map(recruiters.map((row) => [row.id, row.email]));
    return rows.map((row) => ({
      Candidate: row.fullName,
      Email: row.email,
      "OPT Type": row.optType,
      "Account State": row.accountState,
      "Journey Stage": row.journeyStage,
      "Marketing Status": row.marketingStatus,
      Recruiter: row.recruiterId ? recruiterMap.get(row.recruiterId) ?? "Unknown" : "Unassigned",
      "Created At": row.createdAt,
    }));
  }

  if (type === "applications") {
    const rows = await db
      .select({
        appNo: applications.appNo,
        candidate: candidates.fullName,
        company: applications.companyName,
        role: applications.roleTitle,
        status: applications.status,
        source: applications.applicationSource,
        dateApplied: applications.dateApplied,
        nextAction: applications.nextAction,
        nextActionAt: applications.nextActionAt,
        updatedAt: applications.updatedAt,
      })
      .from(applications)
      .innerJoin(candidates, eq(candidates.id, applications.candidateId))
      .where(and(range.from ? gte(applications.dateApplied, range.from.toISOString().slice(0, 10)) : undefined, range.to ? lte(applications.dateApplied, range.to.toISOString().slice(0, 10)) : undefined))
      .orderBy(desc(applications.updatedAt));
    return rows.map((row) => ({
      "Application No": row.appNo,
      Candidate: row.candidate,
      Company: row.company,
      Role: row.role,
      Status: row.status,
      Source: row.source,
      "Applied Date": row.dateApplied,
      "Next Action": row.nextAction,
      "Next Action At": row.nextActionAt,
      "Updated At": row.updatedAt,
    }));
  }

  if (type === "interviews" || type === "assessments") {
    const eventType = type === "interviews" ? "interview" : "assessment";
    const rows = await db
      .select({
        candidate: candidates.fullName,
        company: applications.companyName,
        role: applications.roleTitle,
        title: applicationEvents.title,
        activityType: applicationEvents.activityType,
        status: applicationEvents.status,
        scheduledAt: applicationEvents.scheduledAt,
        completedAt: applicationEvents.completedAt,
        timezone: applicationEvents.timezone,
        result: applicationEvents.result,
        score: applicationEvents.score,
        roundNumber: applicationEvents.roundNumber,
        createdAt: applicationEvents.createdAt,
      })
      .from(applicationEvents)
      .innerJoin(applications, eq(applications.id, applicationEvents.applicationId))
      .innerJoin(candidates, eq(candidates.id, applicationEvents.candidateId))
      .where(and(eq(applicationEvents.eventType, eventType), and(range.from ? gte(applicationEvents.createdAt, range.from) : undefined, range.to ? lte(applicationEvents.createdAt, range.to) : undefined)))
      .orderBy(desc(applicationEvents.createdAt));
    return rows.map((row) => ({
      Candidate: row.candidate,
      Company: row.company,
      Role: row.role,
      Title: row.title,
      Type: row.activityType,
      Status: row.status,
      Round: row.roundNumber,
      "Scheduled At": row.scheduledAt,
      "Completed At": row.completedAt,
      Timezone: row.timezone,
      Result: row.result,
      Score: row.score,
    }));
  }

  const recruiterRows = await db
    .select({
      id: users.id,
      email: users.email,
      accountState: users.accountState,
      fullName: staffProfiles.fullName,
      title: staffProfiles.title,
      maxActiveCandidates: staffProfiles.maxActiveCandidates,
      isAvailable: staffProfiles.isAvailable,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(staffProfiles, eq(staffProfiles.userId, users.id))
    .where(and(eq(users.role, "recruiter"), and(range.from ? gte(users.createdAt, range.from) : undefined, range.to ? lte(users.createdAt, range.to) : undefined)))
    .orderBy(users.email);
  const candidateRows = await db.select({ recruiterId: candidates.recruiterId }).from(candidates);
  return recruiterRows.map((row) => ({
    Recruiter: row.fullName ?? row.email,
    Email: row.email,
    Title: row.title,
    "Account State": row.accountState,
    Available: row.isAvailable ?? false,
    Capacity: row.maxActiveCandidates ?? 0,
    "Assigned Candidates": candidateRows.filter((candidate) => candidate.recruiterId === row.id).length,
    "Created At": row.createdAt,
  }));
}
