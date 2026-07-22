import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { applicationEvents, applications } from "@/lib/db/schema";

export async function getCandidateApplicationActivities(
  candidateId: string,
  eventTypes: ("interview" | "assessment")[],
) {
  return db
    .select({
      id: applicationEvents.id,
      applicationId: applicationEvents.applicationId,
      candidateId: applicationEvents.candidateId,
      eventType: applicationEvents.eventType,
      activityType: applicationEvents.activityType,
      title: applicationEvents.title,
      description: applicationEvents.description,
      status: applicationEvents.status,
      scheduledAt: applicationEvents.scheduledAt,
      scheduledEndAt: applicationEvents.scheduledEndAt,
      timezone: applicationEvents.timezone,
      occurredAt: applicationEvents.occurredAt,
      completedAt: applicationEvents.completedAt,
      result: applicationEvents.result,
      score: applicationEvents.score,
      roundNumber: applicationEvents.roundNumber,
      roundName: applicationEvents.roundName,
      withPerson: applicationEvents.withPerson,
      companyContactName: applicationEvents.companyContactName,
      meetingLink: applicationEvents.meetingLink,
      location: applicationEvents.location,
      externalUrl: applicationEvents.externalUrl,
      preparationNotes: applicationEvents.preparationNotes,
      candidateVisibleNotes: applicationEvents.candidateVisibleNotes,
      createdAt: applicationEvents.createdAt,
      updatedAt: applicationEvents.updatedAt,
      companyName: applications.companyName,
      roleTitle: applications.roleTitle,
      applicationStatus: applications.status,
      appNo: applications.appNo,
    })
    .from(applicationEvents)
    .innerJoin(applications, eq(applications.id, applicationEvents.applicationId))
    .where(
      and(
        eq(applicationEvents.candidateId, candidateId),
        eq(applicationEvents.candidateVisible, true),
        ne(applications.status, "draft"),
        inArray(applicationEvents.eventType, eventTypes),
      ),
    )
    .orderBy(asc(applicationEvents.scheduledAt), desc(applicationEvents.createdAt));
}

export async function getApplicationActivitiesForStaff(applicationId: string) {
  return db
    .select()
    .from(applicationEvents)
    .where(eq(applicationEvents.applicationId, applicationId))
    .orderBy(desc(applicationEvents.createdAt));
}

export async function getApplicationActivityById(eventId: string) {
  const [event] = await db
    .select()
    .from(applicationEvents)
    .where(eq(applicationEvents.id, eventId))
    .limit(1);
  return event ?? null;
}
