"use server";

import { randomBytes } from "node:crypto";
import { and, count, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hashPassword, logAudit } from "@/lib/auth/password";
import { requireAdminAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  candidateJourneyEvents,
  candidateRecruiterAssignments,
  candidateTrainings,
  candidates,
  leads,
  staffProfiles,
  trainings,
  users,
} from "@/lib/db/schema";
import { sendCandidateInviteEmail } from "@/lib/email";
import { serverFeatures } from "@/lib/config/features";
import { createCandidateInvite } from "@/lib/services/candidate-invites";
import { assignRecruiterAction, unassignRecruiterAction } from "@/lib/actions/recruiter-assignments";
import { updateCandidateJourneyStageAction } from "@/lib/actions/marketing";

const createSchema = z.object({
  leadId: z.string().uuid(),
  fullName: z.string().trim().min(1).max(120),
  optType: z.enum(["OPT", "STEM_OPT"]),
  recruiterId: z.string().uuid().optional(),
});

export async function createCandidateFromLead(data: z.infer<typeof createSchema>) {
  const admin = await requireAdminAuth();
  if (!serverFeatures.secureInvites) {
    return { error: "Secure invitations are disabled. Enable ENABLE_SECURE_INVITES." };
  }
  const parsed = createSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid input." };

  const [lead] = await db.select().from(leads).where(eq(leads.id, parsed.data.leadId)).limit(1);
  if (!lead || lead.status !== "qualified") {
    return { error: "Enquiry must be approved before portal access is created." };
  }

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, lead.email.toLowerCase()))
    .limit(1);
  if (existingUser) return { error: "A portal user already exists for this email address." };

  let recruiterId: string | null = null;
  if (parsed.data.recruiterId) {
    const [recruiter] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, parsed.data.recruiterId))
      .limit(1);
    if (!recruiter || recruiter.role !== "recruiter") {
      return { error: "Select a valid recruiter." };
    }
    recruiterId = recruiter.id;
  }

  // The account cannot authenticate with this generated value. The candidate sets a real
  // password only through the single-use invitation flow.
  const unusablePasswordHash = await hashPassword(randomBytes(48).toString("base64url"));

  const result = await db.transaction(async (tx) => {
    if (recruiterId) {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${recruiterId}, 3))`);
      await tx.execute(sql`select id from users where id = ${recruiterId} for update`);
      const [profile] = await tx
        .select({
          maxActiveCandidates: staffProfiles.maxActiveCandidates,
          isAvailable: staffProfiles.isAvailable,
        })
        .from(staffProfiles)
        .where(eq(staffProfiles.userId, recruiterId))
        .limit(1);
      const [active] = await tx
        .select({ count: count() })
        .from(candidateRecruiterAssignments)
        .where(
          and(
            eq(candidateRecruiterAssignments.recruiterId, recruiterId),
            eq(candidateRecruiterAssignments.status, "active"),
          ),
        );
      const capacity = profile?.maxActiveCandidates ?? 20;
      if (profile?.isAvailable === false) {
        throw new Error("The selected recruiter is not accepting new assignments.");
      }
      if (Number(active?.count ?? 0) >= capacity) {
        throw new Error(`The selected recruiter is at capacity (${capacity}).`);
      }
    }

    const [user] = await tx
      .insert(users)
      .values({
        email: lead.email.toLowerCase(),
        passwordHash: unusablePasswordHash,
        role: "candidate",
        firstLogin: true,
        accountState: "pending_setup",
      })
      .returning();

    const [candidate] = await tx
      .insert(candidates)
      .values({
        userId: user.id,
        fullName: parsed.data.fullName,
        phone: lead.phone,
        optType: parsed.data.optType,
        recruiterId,
      })
      .returning();

    await tx
      .update(leads)
      .set({
        status: "converted",
        convertedCandidateId: candidate.id,
        approvedAt: lead.approvedAt ?? new Date(),
        reviewedAt: lead.reviewedAt ?? new Date(),
        reviewedBy: lead.reviewedBy ?? admin.userId,
      })
      .where(eq(leads.id, parsed.data.leadId));

    await tx.insert(candidateJourneyEvents).values({
      candidateId: candidate.id,
      stage: 0,
      eventType: "stage_reached",
      note: "Candidate portal account created; secure setup pending",
      createdBy: admin.userId,
    });

    if (recruiterId) {
      await tx.insert(candidateRecruiterAssignments).values({
        candidateId: candidate.id,
        recruiterId,
        assignedBy: admin.userId,
        status: "active",
        reason: "Initial candidate assignment",
      });
      await tx.update(candidates).set({ journeyStage: 1 }).where(eq(candidates.id, candidate.id));
      await tx.insert(candidateJourneyEvents).values({
        candidateId: candidate.id,
        stage: 1,
        previousStage: 0,
        eventType: "stage_reached",
        source: "assignment",
        note: "Recruiter assigned to candidate",
        candidateVisible: true,
        createdBy: admin.userId,
      });
    }

    const catalog = await tx.select({ id: trainings.id }).from(trainings);
    if (catalog.length) {
      await tx
        .insert(candidateTrainings)
        .values(
          catalog.map((training) => ({
            candidateId: candidate.id,
            trainingId: training.id,
            status: "upcoming" as const,
          })),
        )
        .onConflictDoNothing();
    }

    return { user, candidate };
  });

  await logAudit({
    actorUserId: admin.userId,
    action: "create_candidate_from_lead",
    targetTable: "candidates",
    targetId: result.candidate.id,
  });

  let inviteResult:
    | {
        delivery: "logged" | "resend" | "error";
        expiresAt: string;
        previewUrl?: string;
      }
    | undefined;
  let warning: string | undefined;

  try {
    const invite = await createCandidateInvite({
      candidateId: result.candidate.id,
      createdBy: admin.userId,
    });
    const delivery = await sendCandidateInviteEmail({
      to: result.user.email,
      fullName: parsed.data.fullName,
      candidateId: result.candidate.id,
      inviteId: invite.id,
      token: invite.token,
      expiresAt: invite.expiresAt,
    });
    inviteResult = {
      delivery: delivery.mode,
      expiresAt: invite.expiresAt.toISOString(),
      previewUrl: delivery.previewUrl,
    };
    if (delivery.mode === "error") {
      warning = "Account created, but invitation email delivery failed. Resend it from Account & Security.";
    }
  } catch (error) {
    console.error("[candidate-create] secure invitation failed", error);
    warning = "Account created, but the secure invitation could not be issued. Resend it from Account & Security.";
  }

  revalidatePath("/admin/leads");
  revalidatePath("/admin/candidates");
  revalidatePath("/admin/dashboard");

  return {
    email: result.user.email,
    candidateId: result.candidate.id,
    invite: inviteResult,
    warning,
  };
}

export async function updateJourneyStage(
  candidateId: string,
  journeyStage: number,
  note?: string,
  candidateVisible = true,
) {
  return updateCandidateJourneyStageAction({
    candidateId,
    stage: journeyStage,
    note,
    candidateVisible,
  });
}

export async function reassignRecruiter(
  candidateId: string,
  recruiterId: string,
  reason = "Updated from candidate profile",
) {
  if (!recruiterId) {
    return unassignRecruiterAction({ candidateId, reason });
  }
  return assignRecruiterAction({ candidateId, recruiterId, reason });
}
