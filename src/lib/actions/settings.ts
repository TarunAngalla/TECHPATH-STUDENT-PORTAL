"use server";

import { and, count, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { changePassword } from "@/lib/auth/password";
import { requireAdminAuth, requireCandidatePortalAccess, requireStaffAuth } from "@/lib/auth/guards";
import { serverFeatures } from "@/lib/config/features";
import { db } from "@/lib/db";
import { candidates, candidateRecruiterAssignments, staffProfiles, users } from "@/lib/db/schema";

export async function updateCandidatePhone(phone: string) {
  const session = await requireCandidatePortalAccess();
  if (!serverFeatures.candidatePhoneEdit) return { error: "Profile updates are managed by TechPath staff." };
  const parsed = z.string().trim().max(40).safeParse(phone);
  if (!parsed.success) return { error: "Invalid phone number." };
  await db.update(candidates).set({ phone: parsed.data }).where(eq(candidates.userId, session.userId));
  revalidatePath("/settings");
  return {};
}

export async function uploadCandidateAvatar(formData: FormData) {
  const session = await requireCandidatePortalAccess();
  if (!session.candidateId) return { error: "Candidate profile not found." };

  const file = formData.get("avatar");
  if (!(file instanceof File)) return { error: "Choose a photo to upload." };

  const { validateAvatarFile, storeCandidateAvatar, resolveAvatarUrl } = await import("@/lib/storage/avatars");
  const validation = validateAvatarFile(file);
  if ("error" in validation && validation.error) return { error: validation.error };

  const [existing] = await db
    .select({ id: candidates.id, avatarPath: candidates.avatarPath })
    .from(candidates)
    .where(eq(candidates.id, session.candidateId))
    .limit(1);
  if (!existing) return { error: "Candidate profile not found." };

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const stored = await storeCandidateAvatar({
      candidateId: existing.id,
      buffer,
      contentType: file.type,
      previousPath: existing.avatarPath,
    });
    await db
      .update(candidates)
      .set({ avatarPath: stored.path })
      .where(eq(candidates.id, existing.id));
    const avatarUrl = await resolveAvatarUrl(stored.path);
    revalidatePath("/settings");
    revalidatePath("/", "layout");
    return { success: true as const, avatarUrl, storage: stored.mode };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Could not upload photo. Try again.",
    };
  }
}

export async function removeCandidateAvatar() {
  const session = await requireCandidatePortalAccess();
  if (!session.candidateId) return { error: "Candidate profile not found." };

  const [existing] = await db
    .select({ id: candidates.id, avatarPath: candidates.avatarPath })
    .from(candidates)
    .where(eq(candidates.id, session.candidateId))
    .limit(1);
  if (!existing) return { error: "Candidate profile not found." };
  if (!existing.avatarPath) return { success: true as const };

  const { removeStoredAvatar } = await import("@/lib/storage/avatars");
  await removeStoredAvatar(existing.avatarPath).catch(() => undefined);
  await db.update(candidates).set({ avatarPath: null }).where(eq(candidates.id, existing.id));
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true as const };
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
  const { hashPassword, isAdminEmail, logAudit } = await import("@/lib/auth/password");
  const normalizedEmail = String(email ?? "").trim().toLowerCase();
  const normalizedPassword = String(password ?? "");

  if (!normalizedEmail.includes("@")) {
    return { error: "Enter a valid staff email address." };
  }
  if (!isAdminEmail(normalizedEmail)) {
    try {
      const { getOrgEmailDomain } = await import("@/lib/config/org");
      const domain = getOrgEmailDomain();
      return { error: `Staff accounts must use an @${domain} email address.` };
    } catch {
      return {
        error: "Company email domain is not configured. Set ORG_EMAIL_DOMAIN in the environment.",
      };
    }
  }
  if (normalizedPassword.trim().length < 10) {
    return { error: "Password must be at least 10 characters." };
  }

  try {
    const passwordHash = await hashPassword(normalizedPassword);
    const [user] = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(users)
        .values({ email: normalizedEmail, passwordHash, role, firstLogin: false })
        .returning();
      const localName = created.email
        .split("@")[0]
        .replaceAll(".", " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
      await tx.insert(staffProfiles).values({
        userId: created.id,
        fullName: localName,
        title: role === "admin" ? "Administrator" : "Talent Marketing Specialist",
      });
      return [created];
    });

    await logAudit({
      actorUserId: session.userId,
      action: `create_staff_${role}`,
      targetTable: "users",
      targetId: user.id,
    });

    revalidatePath("/admin/team");
    return { id: user.id };
  } catch {
    return { error: "Could not create this staff account. The email may already be in use." };
  }
}

export async function updateStaffRole(userId: string, role: "recruiter" | "admin") {
  const session = await requireAdminAuth();
  if (session.userId === userId) return { error: "You cannot change your own active role." };

  const [existing] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!existing || !["recruiter", "admin"].includes(existing.role)) {
    return { error: "Staff user not found." };
  }
  if (existing.role === "recruiter" && role === "admin") {
    const [active] = await db
      .select({ count: count() })
      .from(candidateRecruiterAssignments)
      .where(
        and(
          eq(candidateRecruiterAssignments.recruiterId, userId),
          eq(candidateRecruiterAssignments.status, "active"),
        ),
      );
    if (Number(active?.count ?? 0) > 0) {
      return { error: "Reassign this recruiter's active candidates before changing the role." };
    }
  }

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

export async function deleteStaffUser(userId: string): Promise<{ error?: string }> {
  const session = await requireAdminAuth();
  if (session.userId === userId) {
    return { error: "You cannot delete your own account." };
  }

  const [existing] = await db
    .select({
      id: users.id,
      role: users.role,
      accountState: users.accountState,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!existing || !["recruiter", "admin"].includes(existing.role)) {
    return { error: "Staff user not found." };
  }
  if (existing.role === "admin") {
    return { error: "Admin accounts cannot be deleted. Demote or keep at least one admin." };
  }
  if (existing.accountState === "suspended") {
    return { error: "This staff account is already removed." };
  }

  const [active] = await db
    .select({ count: count() })
    .from(candidateRecruiterAssignments)
    .where(
      and(
        eq(candidateRecruiterAssignments.recruiterId, userId),
        eq(candidateRecruiterAssignments.status, "active"),
      ),
    );
  if (Number(active?.count ?? 0) > 0) {
    return { error: "Reassign this recruiter's active candidates before deleting the account." };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        accountState: "suspended",
        sessionVersion: sql`${users.sessionVersion} + 1`,
      })
      .where(eq(users.id, userId));
    await tx
      .update(staffProfiles)
      .set({ isAvailable: false, updatedAt: new Date() })
      .where(eq(staffProfiles.userId, userId));
  });

  const { logAudit } = await import("@/lib/auth/password");
  await logAudit({
    actorUserId: session.userId,
    action: "delete_staff_user",
    targetTable: "users",
    targetId: userId,
  });

  revalidatePath("/admin/team");
  revalidatePath("/admin/assignments");
  revalidatePath("/admin/dashboard");
  return {};
}
