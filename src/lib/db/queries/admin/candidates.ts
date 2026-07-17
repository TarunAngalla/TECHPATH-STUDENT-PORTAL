import { count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications, candidates, messages, users } from "@/lib/db/schema";

export async function getCandidatesList() {
  const rows = await db
    .select({
      id: candidates.id,
      fullName: candidates.fullName,
      optType: candidates.optType,
      journeyStage: candidates.journeyStage,
      recruiterId: candidates.recruiterId,
      createdAt: candidates.createdAt,
      email: users.email,
    })
    .from(candidates)
    .innerJoin(users, eq(candidates.userId, users.id))
    .orderBy(desc(candidates.createdAt));

  return Promise.all(
    rows.map(async (c) => {
      const [appCount] = await db
        .select({ count: count() })
        .from(applications)
        .where(eq(applications.candidateId, c.id));
      const [lastMsg] = await db
        .select({ sentAt: messages.sentAt })
        .from(messages)
        .where(eq(messages.candidateId, c.id))
        .orderBy(desc(messages.sentAt))
        .limit(1);
      let recruiterEmail: string | null = null;
      if (c.recruiterId) {
        const [r] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, c.recruiterId))
          .limit(1);
        recruiterEmail = r?.email ?? null;
      }
      return {
        ...c,
        applicationCount: Number(appCount?.count ?? 0),
        lastActivity: lastMsg?.sentAt ?? c.createdAt,
        recruiterEmail,
      };
    }),
  );
}

export async function getCandidateDetail(candidateId: string) {
  const [row] = await db
    .select({
      id: candidates.id,
      userId: candidates.userId,
      fullName: candidates.fullName,
      phone: candidates.phone,
      optType: candidates.optType,
      journeyStage: candidates.journeyStage,
      recruiterId: candidates.recruiterId,
      createdAt: candidates.createdAt,
      email: users.email,
    })
    .from(candidates)
    .innerJoin(users, eq(candidates.userId, users.id))
    .where(eq(candidates.id, candidateId))
    .limit(1);
  return row ?? null;
}

export async function getRecruiters() {
  return db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.role, "recruiter"));
}
