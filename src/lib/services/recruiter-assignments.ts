import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  candidateRecruiterAssignments,
  staffProfiles,
  users,
} from "@/lib/db/schema";

export async function getRecruiterCapacity(recruiterId: string) {
  const [recruiter] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      fullName: staffProfiles.fullName,
      title: staffProfiles.title,
      phone: staffProfiles.phone,
      timezone: staffProfiles.timezone,
      maxActiveCandidates: staffProfiles.maxActiveCandidates,
      isAvailable: staffProfiles.isAvailable,
    })
    .from(users)
    .leftJoin(staffProfiles, eq(staffProfiles.userId, users.id))
    .where(eq(users.id, recruiterId))
    .limit(1);

  if (!recruiter || recruiter.role !== "recruiter") return null;

  const [active] = await db
    .select({ count: count() })
    .from(candidateRecruiterAssignments)
    .where(
      and(
        eq(candidateRecruiterAssignments.recruiterId, recruiterId),
        eq(candidateRecruiterAssignments.status, "active"),
      ),
    );

  const activeCount = Number(active?.count ?? 0);
  const maxActiveCandidates = recruiter.maxActiveCandidates ?? 20;
  return {
    ...recruiter,
    fullName: recruiter.fullName ?? recruiter.email.split("@")[0].replaceAll(".", " "),
    title: recruiter.title ?? "Talent Marketing Specialist",
    maxActiveCandidates,
    isAvailable: recruiter.isAvailable ?? true,
    activeCount,
    remainingCapacity: Math.max(0, maxActiveCandidates - activeCount),
    atCapacity: activeCount >= maxActiveCandidates,
  };
}

export async function getRecruiterAssignmentHistory(candidateId: string) {
  return db
    .select({
      id: candidateRecruiterAssignments.id,
      recruiterId: candidateRecruiterAssignments.recruiterId,
      recruiterEmail: users.email,
      recruiterName: staffProfiles.fullName,
      recruiterTitle: staffProfiles.title,
      assignedBy: candidateRecruiterAssignments.assignedBy,
      status: candidateRecruiterAssignments.status,
      reason: candidateRecruiterAssignments.reason,
      assignedAt: candidateRecruiterAssignments.assignedAt,
      endedAt: candidateRecruiterAssignments.endedAt,
      endedBy: candidateRecruiterAssignments.endedBy,
      endReason: candidateRecruiterAssignments.endReason,
    })
    .from(candidateRecruiterAssignments)
    .innerJoin(users, eq(users.id, candidateRecruiterAssignments.recruiterId))
    .leftJoin(staffProfiles, eq(staffProfiles.userId, users.id))
    .where(eq(candidateRecruiterAssignments.candidateId, candidateId))
    .orderBy(desc(candidateRecruiterAssignments.assignedAt));
}

export async function assertRecruiterCanAcceptCandidate(recruiterId: string) {
  const capacity = await getRecruiterCapacity(recruiterId);
  if (!capacity) throw new Error("Select a valid recruiter.");
  if (!capacity.isAvailable) throw new Error("This recruiter is not accepting new assignments.");
  if (capacity.atCapacity) {
    throw new Error(
      `${capacity.fullName} is at capacity (${capacity.activeCount}/${capacity.maxActiveCandidates}).`,
    );
  }
  return capacity;
}
