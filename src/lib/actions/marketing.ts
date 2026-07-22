"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaffAuth } from "@/lib/auth/guards";
import { getStaffScope } from "@/lib/auth/staff-scope";
import { logAudit } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { assertCandidateInScope } from "@/lib/db/queries/admin/candidates";
import { candidates, candidateJourneyEvents, type MarketingStatus } from "@/lib/db/schema";
import { getMarketingReadiness, hasInterviewOrAssessmentEvidence } from "@/lib/services/candidate-journey";
import { assertMarketingTransition } from "@/lib/constants/marketing";

const marketingSchema = z.object({
  candidateId: z.string().uuid(),
  nextStatus: z.enum(["not_ready", "ready", "live", "paused", "completed"]),
  note: z.string().trim().max(1000).optional(),
});

const journeySchema = z.object({
  candidateId: z.string().uuid(),
  stage: z.number().int().min(0).max(3),
  note: z.string().trim().max(1000).optional(),
  candidateVisible: z.boolean().default(true),
});

function revalidateCandidate(candidateId: string) {
  revalidatePath(`/admin/candidates/${candidateId}`);
  revalidatePath("/admin/candidates");
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/dashboard");
  revalidatePath("/dashboard");
  revalidatePath("/progress");
}

export async function updateMarketingStatusAction(input: z.infer<typeof marketingSchema>) {
  const session = await requireStaffAuth();
  const parsed = marketingSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid marketing status update." };
  const scope = getStaffScope(session);
  if (!(await assertCandidateInScope(parsed.data.candidateId, scope))) return { error: "Forbidden" };

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${parsed.data.candidateId}, 1))`);
      const rows = await tx.execute(sql`
        select id, journey_stage, recruiter_id, marketing_status, marketing_live_at
        from candidates
        where id = ${parsed.data.candidateId}
        for update
      `);
      const current = rows[0] as
        | {
            id: string;
            journey_stage: number;
            recruiter_id: string | null;
            marketing_status: MarketingStatus;
            marketing_live_at: Date | null;
          }
        | undefined;
      if (!current) throw new Error("Candidate not found.");
      if (current.marketing_status === parsed.data.nextStatus) return;
      assertMarketingTransition(current.marketing_status, parsed.data.nextStatus);

      if (["ready", "live"].includes(parsed.data.nextStatus)) {
        const readiness = await getMarketingReadiness(parsed.data.candidateId, tx);
        if (!readiness?.ready) {
          throw new Error(
            `Marketing requirements incomplete: ${(readiness?.missing ?? ["Candidate not found."]).join(", ")}.`,
          );
        }
        if (!current.recruiter_id) {
          throw new Error("An active recruiter must be assigned before marketing can become ready or live.");
        }
      }
      if (["paused", "completed", "not_ready"].includes(parsed.data.nextStatus) && !parsed.data.note) {
        throw new Error("A reason is required for this marketing status change.");
      }

      const now = new Date();
      const update: Partial<typeof candidates.$inferInsert> = {
        marketingStatus: parsed.data.nextStatus,
        marketingNotes: parsed.data.note || null,
      };
      if (parsed.data.nextStatus === "ready") update.marketingReadyAt = now;
      if (parsed.data.nextStatus === "live") {
        if (!current.marketing_live_at) update.marketingLiveAt = now;
        update.marketingPausedAt = null;
      }
      if (parsed.data.nextStatus === "paused") update.marketingPausedAt = now;
      if (parsed.data.nextStatus === "completed") update.marketingCompletedAt = now;

      let nextStage = current.journey_stage;
      if (parsed.data.nextStatus === "live" && current.journey_stage < 2) nextStage = 2;
      if (parsed.data.nextStatus === "not_ready" && current.journey_stage >= 2) {
        nextStage = current.recruiter_id ? 1 : 0;
      }
      if (nextStage !== current.journey_stage) update.journeyStage = nextStage;

      await tx.update(candidates).set(update).where(eq(candidates.id, current.id));
      await tx.insert(candidateJourneyEvents).values({
        candidateId: current.id,
        stage: nextStage,
        previousStage: current.journey_stage,
        eventType:
          nextStage < current.journey_stage
            ? "stage_reopened"
            : nextStage > current.journey_stage
              ? "stage_reached"
              : "note",
        source: "marketing",
        note:
          parsed.data.note ||
          (parsed.data.nextStatus === "live"
            ? "Candidate marketing launched"
            : `Marketing status changed to ${parsed.data.nextStatus.replaceAll("_", " ")}`),
        candidateVisible: true,
        createdBy: session.userId,
      });
    });

    await logAudit({
      actorUserId: session.userId,
      action: `candidate_marketing_${parsed.data.nextStatus}`,
      targetTable: "candidates",
      targetId: parsed.data.candidateId,
    });
    revalidateCandidate(parsed.data.candidateId);
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Marketing status update failed." };
  }
}

export async function updateCandidateJourneyStageAction(input: z.infer<typeof journeySchema>) {
  const session = await requireStaffAuth();
  const parsed = journeySchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid journey update." };
  const scope = getStaffScope(session);
  if (!(await assertCandidateInScope(parsed.data.candidateId, scope))) return { error: "Forbidden" };

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${parsed.data.candidateId}, 2))`);
      const rows = await tx.execute(sql`
        select id, journey_stage, recruiter_id, marketing_status
        from candidates
        where id = ${parsed.data.candidateId}
        for update
      `);
      const candidate = rows[0] as
        | {
            id: string;
            journey_stage: number;
            recruiter_id: string | null;
            marketing_status: MarketingStatus;
          }
        | undefined;
      if (!candidate) throw new Error("Candidate not found.");
      if (parsed.data.stage === candidate.journey_stage) return;
      if (parsed.data.stage > candidate.journey_stage + 1) {
        throw new Error("Journey stages must be advanced in order.");
      }
      if (parsed.data.stage < candidate.journey_stage && !parsed.data.note) {
        throw new Error("A reason is required when reopening an earlier stage.");
      }
      if (parsed.data.stage >= 1 && !candidate.recruiter_id) {
        throw new Error("Assign a recruiter before advancing this journey stage.");
      }
      if (parsed.data.stage >= 2 && candidate.marketing_status !== "live") {
        throw new Error("Marketing must be live before advancing to Marketing launched.");
      }
      if (parsed.data.stage === 3 && !(await hasInterviewOrAssessmentEvidence(parsed.data.candidateId))) {
        throw new Error("Add a scheduled interview or assessment before advancing to this stage.");
      }

      await tx
        .update(candidates)
        .set({ journeyStage: parsed.data.stage })
        .where(eq(candidates.id, parsed.data.candidateId));
      await tx.insert(candidateJourneyEvents).values({
        candidateId: parsed.data.candidateId,
        stage: parsed.data.stage,
        previousStage: candidate.journey_stage,
        eventType: parsed.data.stage < candidate.journey_stage ? "stage_reopened" : "stage_reached",
        source: "manual",
        note: parsed.data.note || null,
        candidateVisible: parsed.data.candidateVisible,
        createdBy: session.userId,
      });
    });

    await logAudit({
      actorUserId: session.userId,
      action: "update_candidate_journey_stage",
      targetTable: "candidates",
      targetId: parsed.data.candidateId,
    });
    revalidateCandidate(parsed.data.candidateId);
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Journey update failed." };
  }
}
