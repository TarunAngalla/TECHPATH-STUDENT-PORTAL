import { and, desc, eq, lt, lte, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  auditLog,
  candidateNdaAgreements,
  candidates,
  ndaTemplates,
  users,
} from "@/lib/db/schema";
import { sendNdaSignedEmail } from "@/lib/email";
import { deleteStorageFile, uploadSignedNdaPdf } from "@/lib/storage/supabase";
import { NDA_CONSENT_TEXT } from "@/lib/constants/nda";
import { hashNdaTemplate } from "./nda-template";
import { typedNameNdaSigningProvider } from "./typed-name-nda-provider";

const SIGNING_RECOVERY_MINUTES = 15;

export class NdaWorkflowError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "NdaWorkflowError";
  }
}

export async function getActiveNdaTemplate() {
  const [template] = await db
    .select()
    .from(ndaTemplates)
    .where(and(eq(ndaTemplates.isActive, true), lte(ndaTemplates.effectiveFrom, new Date())))
    .orderBy(desc(ndaTemplates.effectiveFrom))
    .limit(1);
  return template ?? null;
}

export async function getCandidateNdaView(userId: string) {
  const [candidate] = await db
    .select({
      candidateId: candidates.id,
      candidateName: candidates.fullName,
      candidateEmail: users.email,
      accountState: users.accountState,
      firstLogin: users.firstLogin,
    })
    .from(candidates)
    .innerJoin(users, eq(users.id, candidates.userId))
    .where(and(eq(users.id, userId), eq(users.role, "candidate")))
    .limit(1);
  if (!candidate) return null;

  const template = await getActiveNdaTemplate();
  if (!template) {
    return { ...candidate, template: null, agreement: null, signedHistory: [] };
  }

  await db
    .insert(candidateNdaAgreements)
    .values({ candidateId: candidate.candidateId, templateId: template.id, status: "pending" })
    .onConflictDoNothing({
      target: [candidateNdaAgreements.candidateId, candidateNdaAgreements.templateId],
    });

  const [agreement] = await db
    .select()
    .from(candidateNdaAgreements)
    .where(
      and(
        eq(candidateNdaAgreements.candidateId, candidate.candidateId),
        eq(candidateNdaAgreements.templateId, template.id),
      ),
    )
    .limit(1);

  const signedHistory = await db
    .select({
      id: candidateNdaAgreements.id,
      status: candidateNdaAgreements.status,
      acceptedAt: candidateNdaAgreements.acceptedAt,
      signedDocumentPath: candidateNdaAgreements.signedDocumentPath,
      templateVersion: ndaTemplates.version,
      templateTitle: ndaTemplates.title,
    })
    .from(candidateNdaAgreements)
    .innerJoin(ndaTemplates, eq(ndaTemplates.id, candidateNdaAgreements.templateId))
    .where(
      and(
        eq(candidateNdaAgreements.candidateId, candidate.candidateId),
        or(
          eq(candidateNdaAgreements.status, "signed"),
          eq(candidateNdaAgreements.status, "superseded"),
        ),
      ),
    )
    .orderBy(desc(candidateNdaAgreements.acceptedAt));

  return { ...candidate, template, agreement: agreement ?? null, signedHistory };
}

export async function createNdaTemplate(input: {
  actorUserId: string;
  version: string;
  title: string;
  content: string;
  effectiveFrom: Date;
  activateNow: boolean;
}) {
  const documentHash = hashNdaTemplate(input);
  return db.transaction(async (tx) => {
    const [template] = await tx
      .insert(ndaTemplates)
      .values({
        version: input.version,
        title: input.title,
        content: input.content,
        documentHash,
        effectiveFrom: input.effectiveFrom,
        isActive: false,
        createdBy: input.actorUserId,
      })
      .returning();

    await tx.insert(auditLog).values({
      actorUserId: input.actorUserId,
      action: "create_nda_template",
      targetTable: "nda_templates",
      targetId: template.id,
    });

    if (input.activateNow) {
      if (input.effectiveFrom > new Date()) {
        throw new NdaWorkflowError("NDA_EFFECTIVE_DATE_FUTURE", "A future NDA cannot be activated yet.");
      }
      await activateNdaTemplateInTransaction(tx, template.id, input.actorUserId);
    }
    return template;
  });
}

type NdaTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function activateNdaTemplateInTransaction(
  tx: NdaTransaction,
  templateId: string,
  actorUserId: string,
) {
  const [target] = await tx
    .select({ id: ndaTemplates.id, effectiveFrom: ndaTemplates.effectiveFrom })
    .from(ndaTemplates)
    .where(eq(ndaTemplates.id, templateId))
    .limit(1);
  if (!target) throw new NdaWorkflowError("NDA_TEMPLATE_NOT_FOUND", "NDA template not found.");
  if (target.effectiveFrom > new Date()) {
    throw new NdaWorkflowError("NDA_EFFECTIVE_DATE_FUTURE", "A future NDA cannot be activated yet.");
  }

  await tx.update(ndaTemplates).set({ isActive: false }).where(ne(ndaTemplates.id, templateId));
  await tx.update(ndaTemplates).set({ isActive: true }).where(eq(ndaTemplates.id, templateId));

  await tx
    .update(candidateNdaAgreements)
    .set({ status: "superseded" })
    .where(
      and(
        eq(candidateNdaAgreements.status, "signed"),
        ne(candidateNdaAgreements.templateId, templateId),
      ),
    );
  await tx
    .update(candidateNdaAgreements)
    .set({ status: "signed" })
    .where(
      and(
        eq(candidateNdaAgreements.status, "superseded"),
        eq(candidateNdaAgreements.templateId, templateId),
      ),
    );

  await tx.execute(sql`
    UPDATE users AS u
    SET account_state = CASE
          WHEN EXISTS (
            SELECT 1
            FROM candidates AS c2
            JOIN candidate_nda_agreements AS a
              ON a.candidate_id = c2.id
             AND a.template_id = ${templateId}
             AND a.status = 'signed'
            WHERE c2.user_id = u.id
          ) THEN 'active'
          ELSE 'nda_pending'
        END,
        session_version = u.session_version + 1
    FROM candidates AS c
    WHERE c.user_id = u.id
      AND u.role = 'candidate'
      AND u.account_state NOT IN ('pending_setup', 'suspended')
  `);

  await tx.insert(auditLog).values({
    actorUserId,
    action: "activate_nda_template",
    targetTable: "nda_templates",
    targetId: templateId,
  });
}

export async function activateNdaTemplate(input: { actorUserId: string; templateId: string }) {
  return db.transaction(async (tx) => {
    await activateNdaTemplateInTransaction(tx, input.templateId, input.actorUserId);
  });
}

export async function signActiveNda(input: {
  userId: string;
  candidateId: string;
  signerName: string;
  consentAccepted: boolean;
  signerIp?: string | null;
  signerUserAgent?: string | null;
}) {
  const acceptedAt = new Date();
  const staleBefore = new Date(acceptedAt.getTime() - SIGNING_RECOVERY_MINUTES * 60_000);

  const claim = await db.transaction(async (tx) => {
    const [candidate] = await tx
      .select({
        candidateId: candidates.id,
        candidateName: candidates.fullName,
        candidateEmail: users.email,
        accountState: users.accountState,
        firstLogin: users.firstLogin,
      })
      .from(candidates)
      .innerJoin(users, eq(users.id, candidates.userId))
      .where(and(eq(candidates.id, input.candidateId), eq(users.id, input.userId), eq(users.role, "candidate")))
      .limit(1);
    if (!candidate) throw new NdaWorkflowError("NDA_CANDIDATE_NOT_FOUND", "Candidate account not found.");
    if (candidate.accountState === "suspended") {
      throw new NdaWorkflowError("NDA_ACCOUNT_SUSPENDED", "This account is suspended.");
    }
    if (candidate.firstLogin || candidate.accountState === "pending_setup") {
      throw new NdaWorkflowError("NDA_ACCOUNT_SETUP_REQUIRED", "Complete account setup first.");
    }

    const [template] = await tx
      .select()
      .from(ndaTemplates)
      .where(and(eq(ndaTemplates.isActive, true), lte(ndaTemplates.effectiveFrom, acceptedAt)))
      .orderBy(desc(ndaTemplates.effectiveFrom))
      .limit(1);
    if (!template) throw new NdaWorkflowError("NDA_TEMPLATE_MISSING", "No active NDA is available.");
    if (hashNdaTemplate(template) !== template.documentHash) {
      throw new NdaWorkflowError("NDA_TEMPLATE_INTEGRITY_FAILED", "The active NDA failed its integrity check.");
    }

    await tx
      .insert(candidateNdaAgreements)
      .values({ candidateId: candidate.candidateId, templateId: template.id, status: "pending" })
      .onConflictDoNothing({
        target: [candidateNdaAgreements.candidateId, candidateNdaAgreements.templateId],
      });

    const [agreement] = await tx
      .select()
      .from(candidateNdaAgreements)
      .where(
        and(
          eq(candidateNdaAgreements.candidateId, candidate.candidateId),
          eq(candidateNdaAgreements.templateId, template.id),
        ),
      )
      .limit(1);
    if (!agreement) throw new NdaWorkflowError("NDA_AGREEMENT_MISSING", "NDA agreement could not be created.");
    if (agreement.status === "signed") {
      return { alreadySigned: true as const, agreementId: agreement.id, candidate, template };
    }

    const [claimed] = await tx
      .update(candidateNdaAgreements)
      .set({
        status: "signing",
        signingStartedAt: acceptedAt,
        signingProvider: typedNameNdaSigningProvider.name,
      })
      .where(
        and(
          eq(candidateNdaAgreements.id, agreement.id),
          or(
            eq(candidateNdaAgreements.status, "pending"),
            and(
              eq(candidateNdaAgreements.status, "signing"),
              or(
                lt(candidateNdaAgreements.signingStartedAt, staleBefore),
                sql`${candidateNdaAgreements.signingStartedAt} IS NULL`,
              ),
            ),
          ),
        ),
      )
      .returning({ id: candidateNdaAgreements.id });
    if (!claimed) {
      throw new NdaWorkflowError("NDA_SIGNING_IN_PROGRESS", "This NDA is already being signed. Try again shortly.");
    }

    return { alreadySigned: false as const, agreementId: agreement.id, candidate, template };
  });

  if (claim.alreadySigned) {
    const [user] = await db
      .update(users)
      .set({ accountState: "active", sessionVersion: sql`${users.sessionVersion} + 1` })
      .where(eq(users.id, input.userId))
      .returning({ sessionVersion: users.sessionVersion, accountState: users.accountState });
    return { alreadySigned: true, agreementId: claim.agreementId, ...user };
  }

  let uploadedPath: string | null = null;
  let finalizedSuccessfully = false;
  try {
    const evidence = await typedNameNdaSigningProvider.collectEvidence(
      {
        agreementId: claim.agreementId,
        candidateId: claim.candidate.candidateId,
        candidateEmail: claim.candidate.candidateEmail,
        candidateName: claim.candidate.candidateName,
        templateId: claim.template.id,
        templateTitle: claim.template.title,
        templateVersion: claim.template.version,
        templateContent: claim.template.content,
        templateHash: claim.template.documentHash,
        acceptedAt,
        signerIp: input.signerIp,
        signerUserAgent: input.signerUserAgent,
        consentText: NDA_CONSENT_TEXT,
      },
      { signerName: input.signerName, consentAccepted: input.consentAccepted },
    );

    uploadedPath = await uploadSignedNdaPdf({
      candidateId: claim.candidate.candidateId,
      agreementId: claim.agreementId,
      templateVersion: claim.template.version,
      documentHash: evidence.signedDocumentHash,
      buffer: evidence.signedDocument,
    });

    const finalized = await db.transaction(async (tx) => {
      const [stillActive] = await tx
        .select({ id: ndaTemplates.id })
        .from(ndaTemplates)
        .where(and(eq(ndaTemplates.id, claim.template.id), eq(ndaTemplates.isActive, true)))
        .limit(1);
      if (!stillActive) {
        throw new NdaWorkflowError("NDA_TEMPLATE_CHANGED", "The active NDA changed while you were signing. Review the current version.");
      }

      const [agreement] = await tx
        .update(candidateNdaAgreements)
        .set({
          status: "signed",
          acceptedAt: evidence.acceptedAt,
          signerName: evidence.signerName,
          signerIp: evidence.signerIp,
          signerUserAgent: evidence.signerUserAgent,
          consentText: evidence.consentText,
          signingProvider: evidence.provider,
          providerEnvelopeId: evidence.providerEnvelopeId,
          signingStartedAt: null,
          signedDocumentPath: uploadedPath,
          signedDocumentHash: evidence.signedDocumentHash,
        })
        .where(
          and(
            eq(candidateNdaAgreements.id, claim.agreementId),
            eq(candidateNdaAgreements.status, "signing"),
          ),
        )
        .returning({ id: candidateNdaAgreements.id });
      if (!agreement) throw new NdaWorkflowError("NDA_FINALIZE_CONFLICT", "NDA signing could not be finalized.");

      await tx
        .update(candidateNdaAgreements)
        .set({ status: "superseded" })
        .where(
          and(
            eq(candidateNdaAgreements.candidateId, claim.candidate.candidateId),
            eq(candidateNdaAgreements.status, "signed"),
            ne(candidateNdaAgreements.id, claim.agreementId),
          ),
        );

      const [user] = await tx
        .update(users)
        .set({ accountState: "active", sessionVersion: sql`${users.sessionVersion} + 1` })
        .where(eq(users.id, input.userId))
        .returning({ sessionVersion: users.sessionVersion, accountState: users.accountState });

      await tx.insert(auditLog).values({
        actorUserId: input.userId,
        action: "sign_nda",
        targetTable: "candidate_nda_agreements",
        targetId: claim.agreementId,
      });
      return user;
    });

    finalizedSuccessfully = true;
    const downloadPath = `/api/nda-agreements/${claim.agreementId}/download`;
    let emailDelivery: "resend" | "logged" | "error" = "error";
    try {
      const delivery = await sendNdaSignedEmail({
        to: claim.candidate.candidateEmail,
        fullName: claim.candidate.candidateName,
        candidateId: claim.candidate.candidateId,
        agreementId: claim.agreementId,
        templateTitle: claim.template.title,
        templateVersion: claim.template.version,
        acceptedAt,
        downloadPath,
        signedPdf: evidence.signedDocument,
      });
      emailDelivery = delivery.mode;
      if (delivery.sent) {
        await db
          .update(candidateNdaAgreements)
          .set({ emailSentAt: new Date() })
          .where(eq(candidateNdaAgreements.id, claim.agreementId));
      }
    } catch {
      emailDelivery = "error";
    }

    return {
      alreadySigned: false,
      agreementId: claim.agreementId,
      sessionVersion: finalized.sessionVersion,
      accountState: finalized.accountState,
      emailDelivery,
    };
  } catch (error) {
    if (!finalizedSuccessfully && uploadedPath) await deleteStorageFile(uploadedPath).catch(() => undefined);
    if (!finalizedSuccessfully) {
      await db
        .update(candidateNdaAgreements)
        .set({ status: "pending", signingStartedAt: null, signingProvider: null })
        .where(
          and(
            eq(candidateNdaAgreements.id, claim.agreementId),
            eq(candidateNdaAgreements.status, "signing"),
          ),
        )
        .catch(() => undefined);
    }
    throw error;
  }
}
