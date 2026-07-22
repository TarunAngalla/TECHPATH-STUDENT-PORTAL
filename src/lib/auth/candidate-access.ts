import { and, desc, eq, lte } from "drizzle-orm";
import { serverFeatures } from "@/lib/config/features";
import { db } from "@/lib/db";
import {
  candidateNdaAgreements,
  candidates,
  ndaTemplates,
  users,
  type AccountState,
} from "@/lib/db/schema";

export const candidateAccessStates = [
  "ACCOUNT_SETUP_REQUIRED",
  "NDA_REQUIRED",
  "PORTAL_ACTIVE",
  "SUSPENDED",
] as const;
export type CandidateAccessState = (typeof candidateAccessStates)[number];

export type CandidateAccessResult = {
  state: CandidateAccessState;
  userId: string;
  candidateId: string;
  accountState: AccountState;
  firstLogin: boolean;
  activeNdaTemplateId: string | null;
  signedActiveNda: boolean;
};

export async function getCandidateAccessState(userId: string): Promise<CandidateAccessResult | null> {
  const [candidate] = await db
    .select({
      userId: users.id,
      role: users.role,
      firstLogin: users.firstLogin,
      accountState: users.accountState,
      candidateId: candidates.id,
    })
    .from(users)
    .innerJoin(candidates, eq(candidates.userId, users.id))
    .where(eq(users.id, userId))
    .limit(1);
  if (!candidate || candidate.role !== "candidate") return null;

  const base = {
    userId: candidate.userId,
    candidateId: candidate.candidateId,
    accountState: candidate.accountState,
    firstLogin: candidate.firstLogin,
  };

  if (candidate.accountState === "suspended") {
    return { ...base, state: "SUSPENDED", activeNdaTemplateId: null, signedActiveNda: false };
  }
  if (candidate.firstLogin || candidate.accountState === "pending_setup") {
    return {
      ...base,
      state: "ACCOUNT_SETUP_REQUIRED",
      activeNdaTemplateId: null,
      signedActiveNda: false,
    };
  }
  if (!serverFeatures.ndaGate) {
    return { ...base, state: "PORTAL_ACTIVE", activeNdaTemplateId: null, signedActiveNda: true };
  }

  const [activeTemplate] = await db
    .select({ id: ndaTemplates.id })
    .from(ndaTemplates)
    .where(and(eq(ndaTemplates.isActive, true), lte(ndaTemplates.effectiveFrom, new Date())))
    .orderBy(desc(ndaTemplates.effectiveFrom))
    .limit(1);
  if (!activeTemplate) {
    return { ...base, state: "NDA_REQUIRED", activeNdaTemplateId: null, signedActiveNda: false };
  }

  const [agreement] = await db
    .select({ id: candidateNdaAgreements.id })
    .from(candidateNdaAgreements)
    .where(
      and(
        eq(candidateNdaAgreements.candidateId, candidate.candidateId),
        eq(candidateNdaAgreements.templateId, activeTemplate.id),
        eq(candidateNdaAgreements.status, "signed"),
      ),
    )
    .limit(1);
  const signedActiveNda = Boolean(agreement);
  return {
    ...base,
    state: signedActiveNda ? "PORTAL_ACTIVE" : "NDA_REQUIRED",
    activeNdaTemplateId: activeTemplate.id,
    signedActiveNda,
  };
}
