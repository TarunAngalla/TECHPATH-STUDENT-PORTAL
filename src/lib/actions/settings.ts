"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { changePassword } from "@/lib/auth/password";
import { requireAdminAuth, requireCandidatePortalAccess, requireStaffAuth } from "@/lib/auth/guards";
import { serverFeatures } from "@/lib/config/features";
import { db } from "@/lib/db";
import { candidates, users } from "@/lib/db/schema";

export async function updateCandidatePhone(phone: string) {
  const session = await requireCandidatePortalAccess();
  if (!serverFeatures.candidatePhoneEdit) return { error: "Profile updates are managed by TechPath staff." };
  const parsed = z.string().trim().max(40).safeParse(phone);
  if (!parsed.success) return { error: "Invalid phone number." };
  await db.update(candidates).set({ phone: parsed.data }).where(eq(candidates.userId, session.userId));
  revalidatePath("/settings");
  return {};
}

const staffPwSchema = z
  .object({
    currentPassword: z.string().min(1),
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
    message: "Passwords don't match",
  });

export async function updateStaffPassword(data: z.infer<typeof staffPwSchema>) {
  const session = await requireStaffAuth();
  const parsed = staffPwSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { authenticateUser } = await import("@/lib/auth/password");
  const user = await authenticateUser(session.email, parsed.data.currentPassword);
  if (!user) return { error: "Current password is incorrect" };

  const updated = await changePassword({
    userId: session.userId,
    newPassword: parsed.data.newPassword,
    method: "self_service",
    changedByUserId: session.userId,
    invalidateSessions: true,
  });

  const { updateCandidateSessionState } = await import("@/lib/auth/session");
  await updateCandidateSessionState({ sessionVersion: updated.sessionVersion });

  revalidatePath("/admin/settings");
  return {};
}

export async function createStaffUser(email: string, role: "recruiter" | "admin", password: string): Promise<{ id?: string; error?: string }> {
  const session = await requireAdminAuth();

  const { hashPassword, logAudit } = await import("@/lib/auth/password");
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({ email: email.toLowerCase(), passwordHash, role, firstLogin: false })
    .returning();

  await logAudit({
    actorUserId: session.userId,
    action: `create_staff_${role}`,
    targetTable: "users",
    targetId: user.id,
  });

  revalidatePath("/admin/team");
  return { id: user.id };
}

export async function updateStaffRole(userId: string, role: "recruiter" | "admin") {
  const session = await requireAdminAuth();
  if (session.userId === userId) return { error: "You cannot change your own active role." };
  await db.update(users).set({ role, sessionVersion: sql`${users.sessionVersion} + 1` }).where(eq(users.id, userId));

  const { logAudit } = await import("@/lib/auth/password");
  await logAudit({
    actorUserId: session.userId,
    action: `update_staff_role_${role}`,
    targetTable: "users",
    targetId: userId,
  });

  revalidatePath("/admin/team");
  return {};
}
