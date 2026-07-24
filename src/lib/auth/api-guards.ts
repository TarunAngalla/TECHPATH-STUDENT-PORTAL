import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import type { UserRole } from "@/lib/auth/session-config";

export type ApiPrincipal = {
  userId: string;
  email: string;
  role: UserRole;
  candidateId?: string;
};

export async function getApiPrincipal(allowedRoles: readonly UserRole[]): Promise<ApiPrincipal | null> {
  const session = await getCurrentUser();
  if (!session?.isLoggedIn || !allowedRoles.includes(session.role)) return null;

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      accountState: users.accountState,
      sessionVersion: users.sessionVersion,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (
    !user ||
    user.accountState === "suspended" ||
    user.role !== session.role ||
    session.sessionVersion === undefined ||
    user.sessionVersion !== session.sessionVersion ||
    !allowedRoles.includes(user.role as UserRole)
  ) return null;

  return {
    userId: user.id,
    email: user.email,
    role: user.role as UserRole,
    candidateId: session.candidateId,
  };
}
