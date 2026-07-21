export type NdaSigningRequest = {
  candidateId: string;
  candidateEmail: string;
  candidateName: string;
  templateId: string;
  templateVersion: string;
  templateContent: string;
  returnUrl: string;
};

export type NdaSigningEvidence = {
  provider: string;
  providerEnvelopeId?: string;
  signerName: string;
  acceptedAt: Date;
  consentText: string;
  signerIp?: string;
  signerUserAgent?: string;
  signedDocument: Buffer;
  signedDocumentHash: string;
};

/**
 * Legal/product approval selects the implementation. The portal workflow depends
 * on this interface rather than directly coupling to typed-name or a vendor SDK.
 */
export interface NdaSigningProvider {
  createSigningSession(request: NdaSigningRequest): Promise<{ redirectUrl: string }>;
  verifyAndCollectEvidence(input: unknown): Promise<NdaSigningEvidence>;
}
