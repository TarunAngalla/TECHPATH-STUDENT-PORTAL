"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  authenticateUser,
  changePassword,
  generateTempPassword,
  isAdminEmail,
  logAudit,
} from "@/lib/auth/password";
import { requireCandidateAuth, requireStaffAuth } from "@/lib/auth/guards";
import { createSession, destroySession, updateSessionFirstLogin } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type AuthActionState = {
  error?: string;
  success?: boolean;
};

export async function candidateLoginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter both email and password to continue." };
  }

  const user = await authenticateUser(parsed.data.email, parsed.data.password);
  if (!user) {
    return { error: "Invalid email or password." };
  }

  if (user.role === "candidate") {
    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      candidateId: user.candidateId,
      firstLogin: user.firstLogin,
    });
    if (user.firstLogin) {
      redirect("/reset-password");
    }
    redirect("/dashboard");
  } else if (user.role === "recruiter" || user.role === "admin") {
    if (!isAdminEmail(user.email)) {
      return { error: "Staff accounts must use a company email address." };
    }
    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      firstLogin: false,
    });
    await logAudit({
      actorUserId: user.id,
      action: "admin_sign_in",
      targetTable: "users",
      targetId: user.id,
    });
    redirect("/admin/dashboard");
  } else {
    return { error: "Invalid user role." };
  }
}

export async function adminLoginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  return candidateLoginAction(_prev, formData);
}

const passwordSchema = z.object({
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
});

export async function forcedFirstLoginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const session = await requireCandidateAuth();
  if (!session.firstLogin) {
    redirect("/dashboard");
  }

  const parsed = passwordSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: "Password must be at least 8 characters." };
  }
  if (parsed.data.newPassword !== parsed.data.confirmPassword) {
    return { error: "Passwords don't match." };
  }

  await changePassword({
    userId: session.userId,
    newPassword: parsed.data.newPassword,
    method: "forced_first_login",
    changedByUserId: session.userId,
    clearFirstLogin: true,
  });
  await updateSessionFirstLogin(false);
  redirect("/dashboard");
}

export async function candidateChangePasswordAction(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const session = await requireCandidateAuth();
  if (session.firstLogin) {
    return { error: "Complete first-login reset first." };
  }
  if (data.newPassword.length < 8) return { error: "Password must be at least 8 characters." };
  if (data.newPassword !== data.confirmPassword) return { error: "Passwords don't match." };

  const user = await authenticateUser(session.email, data.currentPassword);
  if (!user) return { error: "Current password is incorrect." };

  await changePassword({
    userId: session.userId,
    newPassword: data.newPassword,
    method: "self_service",
    changedByUserId: session.userId,
  });

  return { success: true };
}

export async function adminResetCandidatePassword(candidateUserId: string) {
  const staff = await requireStaffAuth();
  const newPassword = generateTempPassword();

  await changePassword({
    userId: candidateUserId,
    newPassword,
    method: "admin_reset",
    changedByUserId: staff.userId,
    clearFirstLogin: false,
  });

  // Force first-login again after admin reset
  const { db } = await import("@/lib/db");
  const { users } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");
  await db.update(users).set({ firstLogin: true }).where(eq(users.id, candidateUserId));

  await logAudit({
    actorUserId: staff.userId,
    action: "admin_reset_candidate_password",
    targetTable: "users",
    targetId: candidateUserId,
  });

  return { password: newPassword };
}

async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function candidateLogoutAction() {
  return logoutAction();
}

export async function adminLogoutAction() {
  return logoutAction();
}
