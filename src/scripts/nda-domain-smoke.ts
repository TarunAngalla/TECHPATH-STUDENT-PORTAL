import assert from "node:assert/strict";
import { NDA_CONSENT_TEXT } from "@/lib/constants/nda";
import { hashNdaTemplate } from "@/lib/services/nda-template";
import { typedNameNdaSigningProvider } from "@/lib/services/typed-name-nda-provider";

async function expectFailure(task: () => Promise<unknown>, message: string) {
  let failed = false;
  try {
    await task();
  } catch {
    failed = true;
  }
  assert.equal(failed, true, message);
}

async function main() {
  const template = {
    title: "TechPath Candidate NDA",
    version: "1.0",
    content: "This is test-only NDA content for the domain smoke check. ".repeat(5),
  };
  const hash = hashNdaTemplate(template);
  assert.match(hash, /^[a-f0-9]{64}$/);
  assert.equal(hashNdaTemplate(template), hash, "Template hashing must be deterministic");

  const context = {
    agreementId: "11111111-1111-1111-1111-111111111111",
    candidateId: "22222222-2222-2222-2222-222222222222",
    candidateEmail: "candidate@example.com",
    candidateName: "Test Candidate",
    templateId: "33333333-3333-3333-3333-333333333333",
    templateTitle: template.title,
    templateVersion: template.version,
    templateContent: template.content,
    templateHash: hash,
    acceptedAt: new Date("2026-07-21T12:00:00.000Z"),
    signerIp: "127.0.0.1",
    signerUserAgent: "TechPath NDA smoke",
    consentText: NDA_CONSENT_TEXT,
  };

  await expectFailure(
    () => typedNameNdaSigningProvider.collectEvidence(context, { signerName: "Test Candidate", consentAccepted: false }),
    "Consent must be mandatory",
  );
  await expectFailure(
    () => typedNameNdaSigningProvider.collectEvidence(context, { signerName: "Different Person", consentAccepted: true }),
    "Typed legal name must match the candidate profile",
  );

  const evidence = await typedNameNdaSigningProvider.collectEvidence(context, {
    signerName: "  Test   Candidate ",
    consentAccepted: true,
  });
  assert.equal(evidence.provider, "typed_name_v1");
  assert.equal(evidence.signerName, "Test Candidate");
  assert.match(evidence.signedDocumentHash, /^[a-f0-9]{64}$/);
  assert.equal(evidence.signedDocument.subarray(0, 8).toString("latin1"), "%PDF-1.4");
  assert.ok(evidence.signedDocument.length > 1000, "Signed PDF should contain agreement evidence");

  console.log("NDA domain smoke passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
