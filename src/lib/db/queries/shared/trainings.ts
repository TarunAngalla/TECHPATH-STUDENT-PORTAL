import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { candidateTrainings, candidates, trainings } from "@/lib/db/schema";

export async function getTrainingsForCandidate(candidateId: string) {
  return db
    .select({
      id: candidateTrainings.id,
      status: candidateTrainings.status,
      completedAt: candidateTrainings.completedAt,
      trainingId: trainings.id,
      title: trainings.title,
      type: trainings.type,
      contentUrl: trainings.contentUrl,
    })
    .from(candidateTrainings)
    .innerJoin(trainings, eq(candidateTrainings.trainingId, trainings.id))
    .where(eq(candidateTrainings.candidateId, candidateId))
    .orderBy(desc(candidateTrainings.status));
}

export async function getTrainingCatalog() {
  return db.select().from(trainings).orderBy(trainings.title);
}

/** Idempotent: assign every catalog module to every candidate. */
export async function ensureAllCandidatesHaveCatalogTrainings() {
  const [allCandidates, catalog] = await Promise.all([
    db.select({ id: candidates.id }).from(candidates),
    db.select({ id: trainings.id }).from(trainings),
  ]);

  if (allCandidates.length === 0 || catalog.length === 0) return;

  await db
    .insert(candidateTrainings)
    .values(
      allCandidates.flatMap((c) =>
        catalog.map((t) => ({
          candidateId: c.id,
          trainingId: t.id,
          status: "upcoming" as const,
        })),
      ),
    )
    .onConflictDoNothing();
}

/** Idempotent: assign every catalog module to one candidate. */
export async function ensureCandidateHasCatalogTrainings(candidateId: string) {
  const catalog = await db.select({ id: trainings.id }).from(trainings);
  if (catalog.length === 0) return;

  await db
    .insert(candidateTrainings)
    .values(
      catalog.map((t) => ({
        candidateId,
        trainingId: t.id,
        status: "upcoming" as const,
      })),
    )
    .onConflictDoNothing();
}
