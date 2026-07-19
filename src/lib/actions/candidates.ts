"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateTempPassword, hashPassword, logAudit } from "@/lib/auth/password";
import { requireStaffAuth } from "@/lib/auth/guards";
import { getStaffScope } from "@/lib/auth/staff-scope";
import { assertCandidateInScope } from "@/lib/db/queries/admin/candidates";
import { defaultPortalLoginUrl, sendCandidateCredentialsEmail } from "@/lib/email";
import { db } from "@/lib/db";
import {
  candidateTrainings,
  candidates,
  leads,
  passwordChangeLog,
  trainings,
  users,
} from "@/lib/db/schema";

const createSchema = z.object({
  leadId: z.string().uuid(),
  fullName: z.string().min(1),
  optType: z.enum(["OPT", "STEM_OPT"]),
  recruiterId: z.string().uuid().optional(),
  password: z.string().min(8),
});

export async function createCandidateFromLead(data: z.infer<typeof createSchema>) {
  const staff = await requireStaffAuth();
  const parsed = createSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid input" };

  const [lead] = await db.select().from(leads).where(eq(leads.id, parsed.data.leadId)).limit(1);
  if (!lead || lead.status !== "qualified") return { error: "Lead must be qualified" };

  const passwordHash = await hashPassword(parsed.data.password);
  const recruiterId = parsed.data.recruiterId ?? staff.userId;

  const result = await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        email: lead.email.toLowerCase(),
        passwordHash,
        role: "candidate",
        firstLogin: true,
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
      .set({ status: "converted", convertedCandidateId: candidate.id })
      .where(eq(leads.id, parsed.data.leadId));

    await tx.insert(passwordChangeLog).values({
      userId: user.id,
      method: "admin_reset",
      changedByUserId: staff.userId,
    });

    // Assign every existing training module to the new candidate.
    const catalog = await tx.select({ id: trainings.id }).from(trainings);
    if (catalog.length > 0) {
      await tx
        .insert(candidateTrainings)
        .values(
          catalog.map((t) => ({
            candidateId: candidate.id,
            trainingId: t.id,
            status: "upcoming" as const,
          })),
        )
        .onConflictDoNothing();
    }

    return { user, candidate };
  });

  await logAudit({
    actorUserId: staff.userId,
    action: "create_candidate_from_lead",
    targetTable: "candidates",
    targetId: result.candidate.id,
  });

  const emailResult = await sendCandidateCredentialsEmail({
    to: result.user.email,
    fullName: parsed.data.fullName,
    password: parsed.data.password,
    portalUrl: defaultPortalLoginUrl(),
  });

  revalidatePath("/admin/leads");
  revalidatePath("/admin/candidates");
  return {
    email: result.user.email,
    password: parsed.data.password,
    candidateId: result.candidate.id,
    emailDelivery: emailResult.mode,
  };
}

export async function updateJourneyStage(candidateId: string, journeyStage: number) {
  const session = await requireStaffAuth();
  const scope = getStaffScope(session);
  if (!(await assertCandidateInScope(candidateId, scope))) {
    return { error: "Forbidden" };
  }
  await db.update(candidates).set({ journeyStage }).where(eq(candidates.id, candidateId));
  revalidatePath(`/admin/candidates/${candidateId}`);
  revalidatePath("/admin/candidates");
  revalidatePath("/admin/dashboard");
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  return {};
}

export async function reassignRecruiter(candidateId: string, recruiterId: string) {
  const session = await requireStaffAuth();
  const scope = getStaffScope(session);
  if (!scope.seesAllCandidates) return { error: "Admin only" };
  await db.update(candidates).set({ recruiterId }).where(eq(candidates.id, candidateId));
  revalidatePath(`/admin/candidates/${candidateId}`);
  revalidatePath("/admin/candidates");
  revalidatePath("/admin/dashboard");
  revalidatePath("/dashboard");
  return {};
}

export async function generateCandidatePassword() {
  return { password: generateTempPassword() };
}
