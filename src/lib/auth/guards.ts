import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCandidateAccessState } from "./candidate-access";
import { getCurrentUser } from "./session";
import type { UserRole } from "./session-config";

export async function requireAuth(allowedRoles?: UserRole[]) {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  const [dbUser] = await db
    .select({
      id: users.id,
      role: users.role,
      email: users.email,
      firstLogin: users.firstLogin,
      accountState: users.accountState,
      sessionVersion: users.sessionVersion,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!dbUser) redirect("/api/auth/logout?next=/login");
  if (
    session.sessionVersion === undefined ||
    session.sessionVersion !== dbUser.sessionVersion ||
    session.role !== dbUser.role
  ) {
    redirect("/api/auth/logout?next=/login");
  }
  if (dbUser.accountState === "suspended") {
    if (dbUser.role === "candidate") redirect("/account-suspended");
    redirect("/api/auth/logout?next=/login");
  }
  if (allowedRoles && !allowedRoles.includes(dbUser.role as UserRole)) redirect("/login");
  return {
    ...session,
    role: dbUser.role as UserRole,
    email: dbUser.email,
    firstLogin: dbUser.firstLogin,
    accountState: dbUser.accountState,
    sessionVersion: dbUser.sessionVersion,
  };
}

export async function requireCandidateAuth() {
  const user = await requireAuth(["candidate"]);
  if (!user.candidateId) redirect("/login");
  return user;
}
export async function requireCandidatePortalAccess() {
  const user = await requireCandidateAuth();
  const access = await getCandidateAccessState(user.userId);
  if (!access) redirect("/api/auth/logout?next=/login");
  if (access.state === "ACCOUNT_SETUP_REQUIRED") redirect("/reset-password");
  if (access.state === "NDA_REQUIRED") redirect("/nda");
  if (access.state === "SUSPENDED") redirect("/account-suspended");
  return { ...user, access };
}
export async function requireStaffAuth() {
  return requireAuth(["recruiter", "admin"]);
}
export async function requireAdminAuth() {
  return requireAuth(["admin"]);
}
export async function redirectIfAuthenticated(portal: "candidate" | "admin") {
  const session = await getCurrentUser();
  if (!session) return;
  const [dbUser] = await db
    .select({ id: users.id, role: users.role, sessionVersion: users.sessionVersion })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (
    !dbUser ||
    session.sessionVersion === undefined ||
    session.sessionVersion !== dbUser.sessionVersion ||
    session.role !== dbUser.role
  ) {
    redirect("/api/auth/logout?next=/login");
  }
  if (portal === "candidate" && dbUser.role === "candidate") {
    const access = await getCandidateAccessState(session.userId);
    if (!access) redirect("/api/auth/logout?next=/login");
    if (access.state === "ACCOUNT_SETUP_REQUIRED") redirect("/reset-password");
    if (access.state === "NDA_REQUIRED") redirect("/nda");
    if (access.state === "SUSPENDED") redirect("/account-suspended");
    redirect("/dashboard");
  }
  if (portal === "admin" && (dbUser.role === "recruiter" || dbUser.role === "admin")) {
    redirect("/admin/dashboard");
  }
}
