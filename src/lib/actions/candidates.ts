"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { generateTempPassword, hashPassword, logAudit } from "@/lib/auth/password";
import { requireStaffAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { candidates, leads, passwordChangeLog, users } from "@/lib/db/schema";

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

  const result = await db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        email: lead.email.toLowerCase(),
        passwordHash,
        role: "candidate",
        firstLogin: false,
      })
      .returning();

    const [candidate] = await tx
      .insert(candidates)
      .values({
        userId: user.id,
        fullName: parsed.data.fullName,
        phone: lead.phone,
        optType: parsed.data.optType,
        recruiterId: parsed.data.recruiterId ?? staff.userId,
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

    return { user, candidate };
  });

  await logAudit({
    actorUserId: staff.userId,
    action: "create_candidate_from_lead",
    targetTable: "candidates",
    targetId: result.candidate.id,
  });

  revalidatePath("/admin/leads");
  revalidatePath("/admin/candidates");
  return { email: result.user.email, password: parsed.data.password, candidateId: result.candidate.id };
}

export async function updateJourneyStage(candidateId: string, journeyStage: number) {
  await requireStaffAuth();
  await db.update(candidates).set({ journeyStage }).where(eq(candidates.id, candidateId));
  revalidatePath(`/admin/candidates/${candidateId}`);
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  return {};
}

export async function reassignRecruiter(candidateId: string, recruiterId: string) {
  await requireStaffAuth();
  await db.update(candidates).set({ recruiterId }).where(eq(candidates.id, candidateId));
  revalidatePath(`/admin/candidates/${candidateId}`);
  revalidatePath("/dashboard");
  return {};
}

export async function generateCandidatePassword() {
  return { password: generateTempPassword() };
}
