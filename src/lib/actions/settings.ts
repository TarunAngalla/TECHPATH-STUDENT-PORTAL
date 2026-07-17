"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { changePassword } from "@/lib/auth/password";
import { requireCandidateAuth, requireStaffAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { candidates, users } from "@/lib/db/schema";

export async function updateCandidatePhone(phone: string) {
  const session = await requireCandidateAuth();
  await db.update(candidates).set({ phone }).where(eq(candidates.userId, session.userId));
  revalidatePath("/settings");
  return {};
}

const staffPwSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
});

export async function updateStaffPassword(data: z.infer<typeof staffPwSchema>) {
  const session = await requireStaffAuth();
  const parsed = staffPwSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid input" };
  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    return { error: "Passwords don't match" };
  }

  const { authenticateUser } = await import("@/lib/auth/password");
  const user = await authenticateUser(session.email, parsed.data.currentPassword);
  if (!user) return { error: "Current password is incorrect" };

  await changePassword({
    userId: session.userId,
    newPassword: parsed.data.newPassword,
    method: "self_service",
    changedByUserId: session.userId,
  });

  revalidatePath("/admin/settings");
  return {};
}

export async function createStaffUser(email: string, role: "recruiter" | "admin", password: string) {
  const session = await requireStaffAuth();
  if (session.role !== "admin") return { error: "Admin only" };

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
  const session = await requireStaffAuth();
  if (session.role !== "admin") return { error: "Admin only" };

  await db.update(users).set({ role }).where(eq(users.id, userId));

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
