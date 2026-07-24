import { and, desc, eq, getTableColumns, isNotNull, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { applications } from "@/lib/db/schema";

export async function getApplicationsByCandidateId(candidateId: string) {
  return db
    .select()
    .from(applications)
    .where(eq(applications.candidateId, candidateId))
    .orderBy(desc(applications.dateApplied));
}

export async function getCandidateVisibleApplicationsByCandidateId(candidateId: string) {
  return db
    .select({
      ...getTableColumns(applications),
      internalNotes: sql<string | null>`null`,
    })
    .from(applications)
    .where(and(eq(applications.candidateId, candidateId), ne(applications.status, "draft")))
    .orderBy(desc(applications.dateApplied));
}

export async function getUpcomingByCandidateId(candidateId: string) {
  return db
    .select({
      ...getTableColumns(applications),
      internalNotes: sql<string | null>`null`,
    })
    .from(applications)
    .where(
      and(
        eq(applications.candidateId, candidateId),
        ne(applications.status, "draft"),
        isNotNull(applications.upcomingWhen),
      ),
    )
    .orderBy(applications.upcomingWhen);
}

export async function getApplicationById(id: string) {
  const [row] = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  return row ?? null;
}
