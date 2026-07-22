"use server";

import { and, count, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth/guards";
import { logAudit } from "@/lib/auth/password";
import { db } from "@/lib/db";
import {
  candidates,
  candidateJourneyEvents,
  candidateRecruiterAssignments,
} from "@/lib/db/schema";

const assignmentSchema = z.object({
  candidateId: z.string().uuid(),
  recruiterId: z.string().uuid(),
  reason: z.string().trim().min(3).max(500),
});

const unassignSchema = z.object({
  candidateId: z.string().uuid(),
  reason: z.string().trim().min(3).max(500),
});

function revalidateAssignmentViews(candidateId: string) {
  revalidatePath(`/admin/candidates/${candidateId}`);
  revalidatePath("/admin/candidates");
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/dashboard");
  revalidatePath("/dashboard");
  revalidatePath("/progress");
}

export async function assignRecruiterAction(input: z.infer<typeof assignmentSchema>) {
  const admin = await requireAdminAuth();
  const parsed = assignmentSchema.safeParse(input);
  if (!parsed.success) return { error: "Candidate, recruiter, and assignment reason are required." };

  try {
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${parsed.data.recruiterId}, 3))`);
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${parsed.data.candidateId}, 4))`);
      const recruiterRows = await tx.execute(sql`
        select u.id, u.email, u.role,
               coalesce(sp.full_name, initcap(replace(split_part(u.email, '@', 1), '.', ' '))) as full_name,
               coalesce(sp.max_active_candidates, 20) as max_active_candidates,
               coalesce(sp.is_available, true) as is_available
        from users u
        left join staff_profiles sp on sp.user_id = u.id
        where u.id = ${parsed.data.recruiterId}
        for update of u
      `);
      const recruiter = recruiterRows[0] as
        | {
            id: string;
            email: string;
            role: string;
            full_name: string;
            max_active_candidates: number;
            is_available: boolean;
          }
        | undefined;
      if (!recruiter || recruiter.role !== "recruiter") throw new Error("Select a valid recruiter.");
      if (!recruiter.is_available) throw new Error("This recruiter is not accepting new assignments.");

      const [workload] = await tx
        .select({ count: count() })
        .from(candidateRecruiterAssignments)
        .where(
          and(
            eq(candidateRecruiterAssignments.recruiterId, recruiter.id),
            eq(candidateRecruiterAssignments.status, "active"),
          ),
        );
      const activeCount = Number(workload?.count ?? 0);

      const candidateRows = await tx.execute(sql`
        select id, recruiter_id, journey_stage, marketing_status
        from candidates
        where id = ${parsed.data.candidateId}
        for update
      `);
      const candidate = candidateRows[0] as
        | {
            id: string;
            recruiter_id: string | null;
            journey_stage: number;
            marketing_status: string;
          }
        | undefined;
      if (!candidate) throw new Error("Candidate not found.");
      if (candidate.recruiter_id === recruiter.id) {
        return { unchanged: true, recruiterName: recruiter.full_name };
      }
      if (activeCount >= Number(recruiter.max_active_candidates)) {
        throw new Error(
          `${recruiter.full_name} is at capacity (${activeCount}/${recruiter.max_active_candidates}).`,
        );
      }

      if (candidate.recruiter_id) {
        await tx
          .update(candidateRecruiterAssignments)
          .set({
            status: "ended",
            endedAt: new Date(),
            endedBy: admin.userId,
            endReason: `Reassigned: ${parsed.data.reason}`,
          })
          .where(
            and(
              eq(candidateRecruiterAssignments.candidateId, candidate.id),
              eq(candidateRecruiterAssignments.status, "active"),
            ),
          );
      }

      await tx.update(candidates).set({ recruiterId: recruiter.id }).where(eq(candidates.id, candidate.id));
      await tx.insert(candidateRecruiterAssignments).values({
        candidateId: candidate.id,
        recruiterId: recruiter.id,
        assignedBy: admin.userId,
        reason: parsed.data.reason,
        status: "active",
      });

      if (candidate.journey_stage < 1) {
        await tx.update(candidates).set({ journeyStage: 1 }).where(eq(candidates.id, candidate.id));
        await tx.insert(candidateJourneyEvents).values({
          candidateId: candidate.id,
          stage: 1,
          previousStage: candidate.journey_stage,
          eventType: "stage_reached",
          source: "assignment",
          note: `Recruiter assigned: ${recruiter.full_name}`,
          candidateVisible: true,
          createdBy: admin.userId,
        });
      } else {
        await tx.insert(candidateJourneyEvents).values({
          candidateId: candidate.id,
          stage: candidate.journey_stage,
          previousStage: candidate.journey_stage,
          eventType: "note",
          source: "assignment",
          note: `Recruiter changed to ${recruiter.full_name}`,
          candidateVisible: true,
          createdBy: admin.userId,
        });
      }

      return { unchanged: false, recruiterName: recruiter.full_name };
    });

    await logAudit({
      actorUserId: admin.userId,
      action: "assign_candidate_recruiter",
      targetTable: "candidates",
      targetId: parsed.data.candidateId,
    });
    revalidateAssignmentViews(parsed.data.candidateId);
    return { result };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Recruiter assignment failed." };
  }
}

export async function unassignRecruiterAction(input: z.infer<typeof unassignSchema>) {
  const admin = await requireAdminAuth();
  const parsed = unassignSchema.safeParse(input);
  if (!parsed.success) return { error: "Candidate and unassignment reason are required." };

  try {
    await db.transaction(async (tx) => {
      const rows = await tx.execute(sql`
        select id, recruiter_id, journey_stage, marketing_status
        from candidates
        where id = ${parsed.data.candidateId}
        for update
      `);
      const candidate = rows[0] as
        | {
            id: string;
            recruiter_id: string | null;
            journey_stage: number;
            marketing_status: string;
          }
        | undefined;
      if (!candidate) throw new Error("Candidate not found.");
      if (!candidate.recruiter_id) throw new Error("Candidate has no active recruiter assignment.");
      if (candidate.marketing_status === "live") {
        throw new Error("Pause marketing or assign a replacement recruiter before unassigning.");
      }

      await tx
        .update(candidateRecruiterAssignments)
        .set({
          status: "ended",
          endedAt: new Date(),
          endedBy: admin.userId,
          endReason: parsed.data.reason,
        })
        .where(
          and(
            eq(candidateRecruiterAssignments.candidateId, candidate.id),
            eq(candidateRecruiterAssignments.status, "active"),
          ),
        );

      const nextStage = candidate.journey_stage === 1 ? 0 : candidate.journey_stage;
      await tx
        .update(candidates)
        .set({ recruiterId: null, ...(nextStage !== candidate.journey_stage ? { journeyStage: nextStage } : {}) })
        .where(eq(candidates.id, candidate.id));
      await tx.insert(candidateJourneyEvents).values({
        candidateId: candidate.id,
        stage: nextStage,
        previousStage: candidate.journey_stage,
        eventType: nextStage < candidate.journey_stage ? "stage_reopened" : "note",
        source: "assignment",
        note: `Recruiter unassigned: ${parsed.data.reason}`,
        candidateVisible: true,
        createdBy: admin.userId,
      });
    });

    await logAudit({
      actorUserId: admin.userId,
      action: "unassign_candidate_recruiter",
      targetTable: "candidates",
      targetId: parsed.data.candidateId,
    });
    revalidateAssignmentViews(parsed.data.candidateId);
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Recruiter unassignment failed." };
  }
}
