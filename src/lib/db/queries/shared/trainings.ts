import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { candidateTrainings, trainings } from "@/lib/db/schema";

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
