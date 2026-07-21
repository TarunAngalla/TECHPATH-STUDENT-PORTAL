import bcrypt from "bcryptjs";
import { randomInt } from "crypto";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog, candidates, passwordChangeLog, users, type AccountState } from "@/lib/db/schema";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function changePassword({
  userId,
  newPassword,
  method,
  changedByUserId,
  clearFirstLogin = false,
  nextAccountState,
  invalidateSessions = true,
}: {
  userId: string;
  newPassword: string;
  method: "forced_first_login" | "self_service" | "admin_reset";
  changedByUserId: string;
  clearFirstLogin?: boolean;
  nextAccountState?: AccountState;
  invalidateSessions?: boolean;
}) {
  const passwordHash = await hashPassword(newPassword);

  const [updated] = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(users)
      .set({
        passwordHash,
        ...(clearFirstLogin ? { firstLogin: false } : {}),
        ...(nextAccountState ? { accountState: nextAccountState } : {}),
        ...(invalidateSessions ? { sessionVersion: sql`${users.sessionVersion} + 1` } : {}),
      })
      .where(eq(users.id, userId))
      .returning({ sessionVersion: users.sessionVersion, accountState: users.accountState });

    await tx.insert(passwordChangeLog).values({
      userId,
      method,
      changedByUserId,
    });
    return [row];
  });

  return {
    sessionVersion: updated.sessionVersion,
    accountState: updated.accountState,
  };
}

export async function authenticateUser(email: string, password: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (!user) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  let candidateId: string | undefined;
  if (user.role === "candidate") {
    const [candidate] = await db
      .select({ id: candidates.id })
      .from(candidates)
      .where(eq(candidates.userId, user.id))
      .limit(1);
    candidateId = candidate?.id;
  }

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstLogin: user.firstLogin,
    candidateId,
    accountState: user.accountState,
    sessionVersion: user.sessionVersion,
  };
}

export async function logAudit({
  actorUserId,
  action,
  targetTable,
  targetId,
}: {
  actorUserId: string;
  action: string;
  targetTable?: string;
  targetId?: string;
}) {
  await db.insert(auditLog).values({
    actorUserId,
    action,
    targetTable,
    targetId,
  });
}

export function isAdminEmail(email: string) {
  const domain = process.env.ADMIN_EMAIL_DOMAIN ?? "thetechpath.com";
  return email.toLowerCase().endsWith(`@${domain}`);
}

export function generateTempPassword(length = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[randomInt(chars.length)];
  }
  return result;
}
