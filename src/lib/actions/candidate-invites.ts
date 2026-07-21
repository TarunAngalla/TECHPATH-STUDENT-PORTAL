"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { logAudit } from "@/lib/auth/password";
import { requireAdminAuth } from "@/lib/auth/guards";
import { createSession } from "@/lib/auth/session";
import { serverFeatures } from "@/lib/config/features";
import { db } from "@/lib/db";
import { candidates, users } from "@/lib/db/schema";
import { sendCandidateInviteEmail } from "@/lib/email";
import {
  completeCandidateInvite,
  createCandidateInvite,
  revokeCandidateInvites,
} from "@/lib/services/candidate-invites";

export type AccountSetupActionState = { error?: string };

const setupSchema = z
  .object({
    token: z.string().min(20).max(256),
    newPassword: z
      .string()
      .min(10, "Password must be at least 10 characters.")
      .max(128)
      .regex(/[A-Z]/, "Include at least one uppercase letter.")
      .regex(/[a-z]/, "Include at least one lowercase letter.")
      .regex(/[0-9]/, "Include at least one number."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export async function completeAccountSetupAction(
  _previous: AccountSetupActionState,
  formData: FormData,
): Promise<AccountSetupActionState> {
  const parsed = setupSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a valid password." };
  }

  const nextAccountState = serverFeatures.ndaGate ? "nda_pending" : "active";
  const result = await completeCandidateInvite({
    token: parsed.data.token,
    newPassword: parsed.data.newPassword,
    nextAccountState,
  });
  if (!result) return { error: "This setup link is invalid, expired, or already used." };

  await createSession({
    userId: result.userId,
    email: result.email,
    role: result.role,
    candidateId: result.candidateId,
    firstLogin: result.firstLogin,
    accountState: result.accountState,
    sessionVersion: result.sessionVersion,
  });

  if (nextAccountState === "nda_pending") redirect("/nda");
  redirect("/dashboard");
}

async function candidateForInvite(candidateId: string) {
  const [candidate] = await db
    .select({
      candidateId: candidates.id,
      fullName: candidates.fullName,
      email: users.email,
      accountState: users.accountState,
    })
    .from(candidates)
    .innerJoin(users, eq(users.id, candidates.userId))
    .where(eq(candidates.id, candidateId))
    .limit(1);
  return candidate ?? null;
}

export async function resendCandidateInviteAction(candidateId: string) {
  const admin = await requireAdminAuth();
  if (!serverFeatures.secureInvites) {
    return { error: "Secure invitations are disabled. Enable ENABLE_SECURE_INVITES." };
  }
  const candidate = await candidateForInvite(candidateId);
  if (!candidate) return { error: "Candidate not found." };
  if (candidate.accountState !== "pending_setup") {
    return { error: "This candidate has already completed account setup." };
  }

  const invite = await createCandidateInvite({ candidateId, createdBy: admin.userId });
  const delivery = await sendCandidateInviteEmail({
    to: candidate.email,
    fullName: candidate.fullName,
    candidateId,
    inviteId: invite.id,
    token: invite.token,
    expiresAt: invite.expiresAt,
    resend: true,
  });
  await logAudit({
    actorUserId: admin.userId,
    action: "resend_candidate_invite",
    targetTable: "candidates",
    targetId: candidateId,
  });
  revalidatePath(`/admin/candidates/${candidateId}`);
  return {
    success: true,
    delivery: delivery.mode,
    expiresAt: invite.expiresAt.toISOString(),
    previewUrl: delivery.previewUrl,
  };
}

export async function revokeCandidateInvitesAction(candidateId: string) {
  const admin = await requireAdminAuth();
  const count = await revokeCandidateInvites(candidateId);
  await logAudit({
    actorUserId: admin.userId,
    action: "revoke_candidate_invites",
    targetTable: "candidates",
    targetId: candidateId,
  });
  revalidatePath(`/admin/candidates/${candidateId}`);
  return { success: true, count };
}
