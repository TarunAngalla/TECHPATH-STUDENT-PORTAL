import { redirect } from "next/navigation";
import { getCurrentUser } from "./session";
import type { UserRole } from "./session-config";

export async function requireAuth(allowedRoles?: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect("/login");
  }

  return user;
}

export async function requireCandidateAuth() {
  const user = await requireAuth(["candidate"]);
  if (!user.candidateId) redirect("/login");
  return user;
}

export async function requireStaffAuth() {
  return requireAuth(["recruiter", "admin"]);
}

export async function redirectIfAuthenticated(portal: "candidate" | "admin") {
  const user = await getCurrentUser();
  if (!user) return;

  if (portal === "candidate" && user.role === "candidate") {
    redirect("/dashboard");
  }

  if (portal === "admin" && (user.role === "recruiter" || user.role === "admin")) {
    redirect("/admin/dashboard");
  }
}
