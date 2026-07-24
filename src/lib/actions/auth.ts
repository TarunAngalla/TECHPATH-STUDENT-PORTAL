"use server";

import { headers } from "next/headers";
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
import { enforceLoginRateLimit } from "@/lib/services/public-enquiries";

const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
export type AuthActionState = { error?: string; success?: boolean };

const strongPasswordSchema = z
  .object({
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
    message: "Passwords don't match.",
  });

function clientKeyFromHeaders(values: Headers) {
  const forwarded = values.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = values.get("x-real-ip")?.trim();
  const ip = forwarded || realIp;
  if (ip) return ip;
  return `unknown:${values.get("user-agent") ?? "no-user-agent"}`;
}

export async function candidateLoginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter both email and password to continue." };

  const requestHeaders = await headers();
  const allowed = await enforceLoginRateLimit({
    clientKey: clientKeyFromHeaders(requestHeaders),
    email: parsed.data.email,
  });
  if (!allowed) {
    return { error: "Too many sign-in attempts. Please wait a few minutes and try again." };
  }

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

export async function forcedFirstLoginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const session = await requireCandidateAuth();
  if (!session.firstLogin && session.accountState !== "pending_setup") redirect("/dashboard");
  const parsed = strongPasswordSchema.safeParse({
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a stronger password." };
  }
  const nextAccountState = serverFeatures.ndaGate ? "nda_pending" : "active";
  const updated = await changePassword({
    userId: session.userId,
    newPassword: parsed.data.newPassword,
    method: "forced_first_login",
    changedByUserId: session.userId,
    clearFirstLogin: true,
    nextAccountState,
    invalidateSessions: true,
  });
  await updateCandidateSessionState({
    firstLogin: false,
    accountState: nextAccountState,
    sessionVersion: updated.sessionVersion,
  });
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
  const parsed = strongPasswordSchema.safeParse({
    newPassword: data.newPassword,
    confirmPassword: data.confirmPassword,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Enter a stronger password." };
  }
  const user = await authenticateUser(session.email, data.currentPassword);
  if (!user) return { error: "Current password is incorrect." };
  const updated = await changePassword({
    userId: session.userId,
    newPassword: parsed.data.newPassword,
    method: "self_service",
    changedByUserId: session.userId,
    invalidateSessions: true,
  });
  await updateCandidateSessionState({ sessionVersion: updated.sessionVersion });
  return { success: true };
}

async function logoutAction() {
  await destroySession();
  redirect("/login");
}
export async function candidateLogoutAction() { return logoutAction(); }
export async function adminLogoutAction() { return logoutAction(); }
