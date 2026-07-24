import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { candidates, users } from "@/lib/db/schema";

export async function getCandidateByUserId(userId: string) {
  const [row] = await db
    .select({
      id: candidates.id,
      fullName: candidates.fullName,
      phone: candidates.phone,
      optType: candidates.optType,
      journeyStage: candidates.journeyStage,
      recruiterId: candidates.recruiterId,
      marketingStatus: candidates.marketingStatus,
      marketingReadyAt: candidates.marketingReadyAt,
      marketingLiveAt: candidates.marketingLiveAt,
      marketingPausedAt: candidates.marketingPausedAt,
      marketingCompletedAt: candidates.marketingCompletedAt,
      marketingNotes: candidates.marketingNotes,
      avatarPath: candidates.avatarPath,
      userId: candidates.userId,
      email: users.email,
      firstLogin: users.firstLogin,
      createdAt: candidates.createdAt,
    })
    .from(candidates)
    .innerJoin(users, eq(candidates.userId, users.id))
    .where(eq(candidates.userId, userId))
    .limit(1);

  return row ?? null;
}
