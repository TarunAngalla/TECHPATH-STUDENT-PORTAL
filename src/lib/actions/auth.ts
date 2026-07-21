"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  authenticateUser,
  changePassword,
  isAdminEmail,
  logAudit,
} from "@/lib/auth/password";
import { getCandidateAccessState } from "@/lib/auth/candidate-access";
import { requireCandidateAuth } from "@/lib/auth/guards";
import { createSession, destroySession, updateCandidateSessionState } from "@/lib/auth/session";
import { serverFeatures } from "@/lib/config/features";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
export type AuthActionState = { error?: string; success?: boolean };

export async function candidateLoginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter both email and password to continue." };
  const user = await authenticateUser(parsed.data.email, parsed.data.password);
  if (!user) return { error: "Invalid email or password." };

  if (user.role === "candidate") {
    if (!user.candidateId) return { error: "Candidate profile is not configured." };
    if (user.accountState === "suspended") {
      return { error: "This account is suspended. Contact TechPath support." };
    }
    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      candidateId: user.candidateId,
      firstLogin: user.firstLogin,
      accountState: user.accountState,
      sessionVersion: user.sessionVersion,
    });
    const access = await getCandidateAccessState(user.id);
    if (!access) return { error: "Candidate profile is not configured." };
    if (access.state === "ACCOUNT_SETUP_REQUIRED") redirect("/reset-password");
    if (access.state === "NDA_REQUIRED") redirect("/nda");
    if (access.state === "SUSPENDED") redirect("/account-suspended");
    redirect("/dashboard");
  }

  if (user.role === "recruiter" || user.role === "admin") {
    if (!isAdminEmail(user.email)) return { error: "Staff accounts must use a company email address." };
    if (user.accountState === "suspended") return { error: "This staff account is suspended." };
    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
      firstLogin: false,
      accountState: user.accountState,
      sessionVersion: user.sessionVersion,
    });
    await logAudit({ actorUserId: user.id, action: "admin_sign_in", targetTable: "users", targetId: user.id });
    redirect("/admin/dashboard");
  }
  return { error: "Invalid user role." };
}

export async function adminLoginAction(prev: AuthActionState, formData: FormData) {
  return candidateLoginAction(prev, formData);
}

const passwordSchema = z.object({ newPassword: z.string().min(8), confirmPassword: z.string().min(8) });
export async function forcedFirstLoginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const session = await requireCandidateAuth();
  if (!session.firstLogin && session.accountState !== "pending_setup") redirect("/dashboard");
  const parsed = passwordSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: "Password must be at least 8 characters." };
  if (parsed.data.newPassword !== parsed.data.confirmPassword) return { error: "Passwords don't match." };
  const nextAccountState = serverFeatures.ndaGate ? "nda_pending" : "active";
  await changePassword({
    userId: session.userId,
    newPassword: parsed.data.newPassword,
    method: "forced_first_login",
    changedByUserId: session.userId,
    clearFirstLogin: true,
    nextAccountState,
  });
  await updateCandidateSessionState({ firstLogin: false, accountState: nextAccountState });
  if (serverFeatures.ndaGate) redirect("/nda");
  redirect("/dashboard");
}

export async function candidateChangePasswordAction(data: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}) {
  const session = await requireCandidateAuth();
  if (session.firstLogin) return { error: "Complete first-login reset first." };
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

async function logoutAction() {
  await destroySession();
  redirect("/login");
}
export async function candidateLogoutAction() { return logoutAction(); }
export async function adminLogoutAction() { return logoutAction(); }
