import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  candidateNdaAgreements,
  candidates,
  ndaTemplates,
  users,
} from "@/lib/db/schema";

export async function getNdaAdminData() {
  const [templates, agreements, candidateAccounts] = await Promise.all([
    db
      .select({
        id: ndaTemplates.id,
        version: ndaTemplates.version,
        title: ndaTemplates.title,
        documentHash: ndaTemplates.documentHash,
        effectiveFrom: ndaTemplates.effectiveFrom,
        isActive: ndaTemplates.isActive,
        createdAt: ndaTemplates.createdAt,
        createdByEmail: users.email,
      })
      .from(ndaTemplates)
      .innerJoin(users, eq(users.id, ndaTemplates.createdBy))
      .orderBy(desc(ndaTemplates.createdAt)),
    db
      .select({
        id: candidateNdaAgreements.id,
        candidateId: candidateNdaAgreements.candidateId,
        candidateName: candidates.fullName,
        candidateEmail: users.email,
        templateId: candidateNdaAgreements.templateId,
        templateVersion: ndaTemplates.version,
        templateTitle: ndaTemplates.title,
        status: candidateNdaAgreements.status,
        presentedAt: candidateNdaAgreements.presentedAt,
        acceptedAt: candidateNdaAgreements.acceptedAt,
        signerName: candidateNdaAgreements.signerName,
        signingProvider: candidateNdaAgreements.signingProvider,
        signedDocumentPath: candidateNdaAgreements.signedDocumentPath,
        emailSentAt: candidateNdaAgreements.emailSentAt,
      })
      .from(candidateNdaAgreements)
      .innerJoin(candidates, eq(candidates.id, candidateNdaAgreements.candidateId))
      .innerJoin(users, eq(users.id, candidates.userId))
      .innerJoin(ndaTemplates, eq(ndaTemplates.id, candidateNdaAgreements.templateId))
      .orderBy(desc(candidateNdaAgreements.createdAt)),
    db
      .select({
        candidateId: candidates.id,
        candidateName: candidates.fullName,
        candidateEmail: users.email,
        accountState: users.accountState,
      })
      .from(candidates)
      .innerJoin(users, eq(users.id, candidates.userId))
      .where(inArray(users.accountState, ["nda_pending", "active"])),
  ]);

  const activeTemplate = templates.find((template) => template.isActive) ?? null;
  const activeAgreements = activeTemplate
    ? agreements.filter((agreement) => agreement.templateId === activeTemplate.id)
    : [];
  const signedCandidateIds = new Set(
    activeAgreements.filter((agreement) => agreement.status === "signed").map((agreement) => agreement.candidateId),
  );
  const pendingCandidates = candidateAccounts.filter(
    (candidate) => candidate.accountState === "nda_pending" && !signedCandidateIds.has(candidate.candidateId),
  );

  return {
    templates: templates.map((template) => ({
      ...template,
      signedCount: agreements.filter(
        (agreement) => agreement.templateId === template.id && agreement.status === "signed",
      ).length,
      supersededCount: agreements.filter(
        (agreement) => agreement.templateId === template.id && agreement.status === "superseded",
      ).length,
    })),
    agreements,
    activeTemplate,
    pendingCandidates,
    summary: {
      pending: pendingCandidates.length,
      signedActive: activeAgreements.filter((agreement) => agreement.status === "signed").length,
      totalSigned: agreements.filter((agreement) => ["signed", "superseded"].includes(agreement.status)).length,
      templates: templates.length,
    },
  };
}
