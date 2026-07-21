import { createHash, randomBytes } from "node:crypto";
import { and, desc, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  candidateInvites,
  candidates,
  passwordChangeLog,
  users,
  type AccountState,
} from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";

const DEFAULT_INVITE_TTL_HOURS = 48;

export function hashCandidateInviteToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function inviteTtlHours(value?: number) {
  const configured = value ?? Number(process.env.CANDIDATE_INVITE_TTL_HOURS ?? DEFAULT_INVITE_TTL_HOURS);
  if (!Number.isFinite(configured) || configured <= 0 || configured > 168) {
    throw new Error("Invite TTL must be between 1 and 168 hours");
  }
  return configured;
}

export async function createCandidateInvite(input: {
  candidateId: string;
  createdBy: string;
  ttlHours?: number;
}) {
  const ttlHours = inviteTtlHours(input.ttlHours);
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashCandidateInviteToken(token);
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

  const invite = await db.transaction(async (tx) => {
    await tx
      .update(candidateInvites)
      .set({ revokedAt: new Date() })
      .where(
        and(
          eq(candidateInvites.candidateId, input.candidateId),
          isNull(candidateInvites.usedAt),
          isNull(candidateInvites.revokedAt),
        ),
      );

    const [created] = await tx
      .insert(candidateInvites)
      .values({
        candidateId: input.candidateId,
        tokenHash,
        expiresAt,
        createdBy: input.createdBy,
      })
      .returning({
        id: candidateInvites.id,
        candidateId: candidateInvites.candidateId,
        expiresAt: candidateInvites.expiresAt,
      });
    return created;
  });

  return { ...invite, token };
}

export async function getValidCandidateInvite(token: string) {
  if (!token || token.length > 256) return null;
  const tokenHash = hashCandidateInviteToken(token);
  const [invite] = await db
    .select({
      id: candidateInvites.id,
      candidateId: candidateInvites.candidateId,
      expiresAt: candidateInvites.expiresAt,
      fullName: candidates.fullName,
      email: users.email,
    })
    .from(candidateInvites)
    .innerJoin(candidates, eq(candidates.id, candidateInvites.candidateId))
    .innerJoin(users, eq(users.id, candidates.userId))
    .where(
      and(
        eq(candidateInvites.tokenHash, tokenHash),
        gt(candidateInvites.expiresAt, new Date()),
        isNull(candidateInvites.usedAt),
        isNull(candidateInvites.revokedAt),
        eq(users.role, "candidate"),
        eq(users.accountState, "pending_setup"),
      ),
    )
    .limit(1);
  return invite ?? null;
}

export async function completeCandidateInvite(input: {
  token: string;
  newPassword: string;
  nextAccountState: AccountState;
}) {
  const tokenHash = hashCandidateInviteToken(input.token);
  const passwordHash = await hashPassword(input.newPassword);
  const now = new Date();

  return db.transaction(async (tx) => {
    const [invite] = await tx
      .update(candidateInvites)
      .set({ usedAt: now })
      .where(
        and(
          eq(candidateInvites.tokenHash, tokenHash),
          gt(candidateInvites.expiresAt, now),
          isNull(candidateInvites.usedAt),
          isNull(candidateInvites.revokedAt),
        ),
      )
      .returning({
        id: candidateInvites.id,
        candidateId: candidateInvites.candidateId,
      });

    if (!invite) return null;

    const [candidate] = await tx
      .select({
        candidateId: candidates.id,
        userId: users.id,
        email: users.email,
        role: users.role,
        accountState: users.accountState,
      })
      .from(candidates)
      .innerJoin(users, eq(users.id, candidates.userId))
      .where(eq(candidates.id, invite.candidateId))
      .limit(1);

    if (!candidate || candidate.role !== "candidate" || candidate.accountState !== "pending_setup") {
      throw new Error("Candidate account is not eligible for setup");
    }

    const [updatedUser] = await tx
      .update(users)
      .set({
        passwordHash,
        firstLogin: false,
        accountState: input.nextAccountState,
        sessionVersion: sql`${users.sessionVersion} + 1`,
      })
      .where(eq(users.id, candidate.userId))
      .returning({
        sessionVersion: users.sessionVersion,
        accountState: users.accountState,
      });

    await tx.insert(passwordChangeLog).values({
      userId: candidate.userId,
      method: "secure_invite",
      changedByUserId: candidate.userId,
    });

    await tx
      .update(candidateInvites)
      .set({ revokedAt: now })
      .where(
        and(
          eq(candidateInvites.candidateId, candidate.candidateId),
          isNull(candidateInvites.usedAt),
          isNull(candidateInvites.revokedAt),
        ),
      );

    return {
      userId: candidate.userId,
      candidateId: candidate.candidateId,
      email: candidate.email,
      role: "candidate" as const,
      firstLogin: false,
      accountState: updatedUser.accountState,
      sessionVersion: updatedUser.sessionVersion,
    };
  });
}

export async function revokeCandidateInvites(candidateId: string) {
  const revoked = await db
    .update(candidateInvites)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(candidateInvites.candidateId, candidateId),
        isNull(candidateInvites.usedAt),
        isNull(candidateInvites.revokedAt),
      ),
    )
    .returning({ id: candidateInvites.id });
  return revoked.length;
}

export async function getLatestCandidateInvite(candidateId: string) {
  const [invite] = await db
    .select({
      id: candidateInvites.id,
      expiresAt: candidateInvites.expiresAt,
      usedAt: candidateInvites.usedAt,
      revokedAt: candidateInvites.revokedAt,
      createdAt: candidateInvites.createdAt,
    })
    .from(candidateInvites)
    .where(eq(candidateInvites.candidateId, candidateId))
    .orderBy(desc(candidateInvites.createdAt))
    .limit(1);
  if (!invite) return null;

  const now = Date.now();
  const status = invite.usedAt
    ? "used"
    : invite.revokedAt
      ? "revoked"
      : invite.expiresAt.getTime() <= now
        ? "expired"
        : "active";
  return { ...invite, status } as const;
}
