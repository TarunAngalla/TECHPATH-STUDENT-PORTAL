import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCurrentUser } from "./session";
import type { UserRole } from "./session-config";

export async function requireAuth(allowedRoles?: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Session can outlive a DB reset/reseed — clear cookie via route handler (not during RSC render).
  const [dbUser] = await db
    .select({ id: users.id, role: users.role, email: users.email })
    .from(users)
    .where(eq(users.id, user.userId))
    .limit(1);

  if (!dbUser) {
    redirect("/api/auth/logout?next=/login");
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect("/login");
  }

  return {
    ...user,
    role: dbUser.role as UserRole,
    email: dbUser.email,
  };
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

  const [dbUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, user.userId))
    .limit(1);

  if (!dbUser) {
    redirect("/api/auth/logout?next=/login");
  }

  if (portal === "candidate" && user.role === "candidate") {
    redirect("/dashboard");
  }

  if (portal === "admin" && (user.role === "recruiter" || user.role === "admin")) {
    redirect("/admin/dashboard");
  }
}
