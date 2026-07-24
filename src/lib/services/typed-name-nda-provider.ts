import { generateSignedNdaPdf } from "./nda-pdf";
import type {
  NdaSigningContext,
  NdaSigningEvidence,
  NdaSigningProvider,
  NdaSigningSubmission,
} from "./nda-signing-provider";

function normalizedLegalName(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLocaleLowerCase("en-US");
}

export class TypedNameNdaSigningProvider implements NdaSigningProvider {
  readonly name = "typed_name_v1";

  async collectEvidence(
    context: NdaSigningContext,
    submission: NdaSigningSubmission,
  ): Promise<NdaSigningEvidence> {
    const signerName = submission.signerName.normalize("NFKC").trim().replace(/\s+/g, " ");
    if (!submission.consentAccepted) throw new Error("NDA_CONSENT_REQUIRED");
    if (signerName.length < 2 || signerName.length > 160) throw new Error("NDA_SIGNER_NAME_INVALID");
    if (normalizedLegalName(signerName) !== normalizedLegalName(context.candidateName)) {
      throw new Error("NDA_SIGNER_NAME_MISMATCH");
    }

    const pdf = await generateSignedNdaPdf({
      agreementId: context.agreementId,
      templateTitle: context.templateTitle,
      templateVersion: context.templateVersion,
      templateContent: context.templateContent,
      templateHash: context.templateHash,
      candidateName: context.candidateName,
      candidateEmail: context.candidateEmail,
      signerName,
      acceptedAt: context.acceptedAt,
      consentText: context.consentText,
      signerIp: context.signerIp,
      signerUserAgent: context.signerUserAgent,
      signingProvider: this.name,
    });

    return {
      provider: this.name,
      signerName,
      acceptedAt: context.acceptedAt,
      consentText: context.consentText,
      signerIp: context.signerIp,
      signerUserAgent: context.signerUserAgent,
      signedDocument: pdf.bytes,
      signedDocumentHash: pdf.sha256,
    };
  }
}

export const typedNameNdaSigningProvider = new TypedNameNdaSigningProvider();
