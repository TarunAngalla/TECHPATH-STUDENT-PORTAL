export type NdaSigningContext = {
  agreementId: string;
  candidateId: string;
  candidateEmail: string;
  candidateName: string;
  templateId: string;
  templateTitle: string;
  templateVersion: string;
  templateContent: string;
  templateHash: string;
  acceptedAt: Date;
  signerIp?: string | null;
  signerUserAgent?: string | null;
  consentText: string;
};

export type NdaSigningSubmission = {
  signerName: string;
  consentAccepted: boolean;
};

export type NdaSigningEvidence = {
  provider: string;
  providerEnvelopeId?: string;
  signerName: string;
  acceptedAt: Date;
  consentText: string;
  signerIp?: string | null;
  signerUserAgent?: string | null;
  signedDocument: Buffer;
  signedDocumentHash: string;
};

/**
 * Phase 3 uses an in-portal typed-name implementation. A vendor adapter can
 * implement this contract later without changing the NDA state machine.
 */
export interface NdaSigningProvider {
  readonly name: string;
  collectEvidence(
    context: NdaSigningContext,
    submission: NdaSigningSubmission,
  ): Promise<NdaSigningEvidence>;
}
