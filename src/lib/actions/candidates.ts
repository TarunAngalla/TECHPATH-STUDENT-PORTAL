"use server";

import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hashPassword, logAudit } from "@/lib/auth/password";
import { requireAdminAuth, requireStaffAuth } from "@/lib/auth/guards";
import { getStaffScope } from "@/lib/auth/staff-scope";
import { db } from "@/lib/db";
import { assertCandidateInScope } from "@/lib/db/queries/admin/candidates";
import {
  candidateJourneyEvents,
  candidateRecruiterAssignments,
  candidateTrainings,
  candidates,
  leads,
  trainings,
  users,
} from "@/lib/db/schema";
import { sendCandidateInviteEmail } from "@/lib/email";
import { serverFeatures } from "@/lib/config/features";
import { createCandidateInvite } from "@/lib/services/candidate-invites";

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

export async function updateJourneyStage(candidateId: string, journeyStage: number) {
  const session = await requireStaffAuth();
  if (!(await assertCandidateInScope(candidateId, getStaffScope(session)))) {
    return { error: "Forbidden" };
  }
  if (!Number.isInteger(journeyStage) || journeyStage < 0 || journeyStage > 3) {
    return { error: "Invalid journey stage" };
  }

  await db.transaction(async (tx) => {
    const [candidate] = await tx
      .select({ journeyStage: candidates.journeyStage })
      .from(candidates)
      .where(eq(candidates.id, candidateId))
      .limit(1);
    if (!candidate) throw new Error("Candidate not found");

    await tx.update(candidates).set({ journeyStage }).where(eq(candidates.id, candidateId));
    await tx.insert(candidateJourneyEvents).values({
      candidateId,
      stage: journeyStage,
      eventType: journeyStage < candidate.journeyStage ? "stage_reopened" : "stage_reached",
      createdBy: session.userId,
    });
  });

  revalidatePath(`/admin/candidates/${candidateId}`);
  revalidatePath("/admin/candidates");
  revalidatePath("/admin/dashboard");
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  return {};
}

export async function reassignRecruiter(candidateId: string, recruiterId: string) {
  const admin = await requireAdminAuth();
  const [recruiter] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, recruiterId))
    .limit(1);
  if (!recruiter || recruiter.role !== "recruiter") {
    return { error: "Select a valid recruiter" };
  }

  await db.transaction(async (tx) => {
    const [candidate] = await tx
      .select({ id: candidates.id, recruiterId: candidates.recruiterId })
      .from(candidates)
      .where(eq(candidates.id, candidateId))
      .limit(1);
    if (!candidate) throw new Error("Candidate not found");
    if (candidate.recruiterId === recruiterId) return;

    await tx
      .update(candidateRecruiterAssignments)
      .set({ status: "ended", endedAt: new Date() })
      .where(
        and(
          eq(candidateRecruiterAssignments.candidateId, candidateId),
          eq(candidateRecruiterAssignments.status, "active"),
        ),
      );
    await tx.update(candidates).set({ recruiterId }).where(eq(candidates.id, candidateId));
    await tx.insert(candidateRecruiterAssignments).values({
      candidateId,
      recruiterId,
      assignedBy: admin.userId,
      status: "active",
      reason: candidate.recruiterId ? "Recruiter reassignment" : "Recruiter assigned",
    });
  });

  await logAudit({
    actorUserId: admin.userId,
    action: "reassign_candidate_recruiter",
    targetTable: "candidates",
    targetId: candidateId,
  });
  revalidatePath(`/admin/candidates/${candidateId}`);
  revalidatePath("/admin/candidates");
  revalidatePath("/admin/dashboard");
  revalidatePath("/dashboard");
  return {};
}
