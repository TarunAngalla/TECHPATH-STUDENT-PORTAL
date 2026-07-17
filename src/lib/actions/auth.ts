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
import { requireStaffAuth } from "@/lib/auth/guards";
import { createSession, destroySession } from "@/lib/auth/session";

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
  if (!user || user.role !== "candidate") {
    return { error: "Invalid email or password." };
  }

  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    candidateId: user.candidateId,
  });

  redirect("/dashboard");
}

export async function adminLoginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter both your work email and password to continue." };
  }

  if (!isAdminEmail(parsed.data.email)) {
    return { error: "Use your thetechpath.com work email to sign in." };
  }

  const user = await authenticateUser(parsed.data.email, parsed.data.password);
  if (!user || (user.role !== "recruiter" && user.role !== "admin")) {
    return { error: "Invalid email or password." };
  }

  await createSession({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  await logAudit({
    actorUserId: user.id,
    action: "admin_sign_in",
    targetTable: "users",
    targetId: user.id,
  });

  redirect("/admin/dashboard");
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

  await logAudit({
    actorUserId: staff.userId,
    action: "admin_reset_candidate_password",
    targetTable: "users",
    targetId: candidateUserId,
  });

  return { password: newPassword };
}

async function logoutAction(portal: "candidate" | "admin") {
  await destroySession();
  redirect(portal === "admin" ? "/admin/login" : "/login");
}

export async function candidateLogoutAction() {
  return logoutAction("candidate");
}

export async function adminLogoutAction() {
  return logoutAction("admin");
}
