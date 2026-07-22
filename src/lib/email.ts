import { sendTrackedEmail } from "@/lib/services/email-delivery";
import { formatDisplayTimestamp } from "@/lib/utils/dates";

function candidatePortalOrigin() {
  const explicit = process.env.NEXT_PUBLIC_CANDIDATE_PORTAL_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const host = process.env.NEXT_PUBLIC_CANDIDATE_HOST?.trim();
  if (host) {
    const protocol = host.includes("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
    return `${protocol}://${host}`;
  }
  return "http://localhost:3000";
}

export function defaultPortalLoginUrl() {
  return `${candidatePortalOrigin()}/login`;
}

export function candidateAccountSetupUrl(token: string) {
  const url = new URL("/setup-account", candidatePortalOrigin());
  url.searchParams.set("token", token);
  return url.toString();
}

export async function sendEnquiryAcknowledgementEmail(input: {
  to: string;
  fullName: string;
  leadId: string;
}) {
  return sendTrackedEmail({
    emailType: "enquiry_acknowledgement",
    to: input.to,
    subject: "We received your TechPath access request",
    relatedLeadId: input.leadId,
    text: [
      `Hi ${input.fullName},`,
      "",
      "We received your request to access the TechPath candidate portal.",
      "Our team will review your information and contact you about the next step.",
      "Submitting a request does not create portal access automatically.",
      "",
      "— The TechPath Team",
    ].join("\n"),
  });
}

export async function sendAdminNewEnquiryEmail(input: {
  leadId: string;
  fullName: string;
  email: string;
  roleInterest?: string | null;
}) {
  const to = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
  if (!to) return { sent: false, mode: "not_configured" as const };
  return sendTrackedEmail({
    emailType: "new_enquiry_admin",
    to,
    subject: `New TechPath enquiry: ${input.fullName}`,
    relatedLeadId: input.leadId,
    text: [
      "A new candidate enquiry was submitted.",
      "",
      `Name: ${input.fullName}`,
      `Email: ${input.email}`,
      `Role interest: ${input.roleInterest || "Not provided"}`,
      "",
      "Review it in the TechPath Admin Portal.",
    ].join("\n"),
  });
}

export async function sendLeadRejectedEmail(input: {
  to: string;
  fullName: string;
  leadId: string;
}) {
  return sendTrackedEmail({
    emailType: "lead_rejection",
    to: input.to,
    subject: "Update on your TechPath access request",
    relatedLeadId: input.leadId,
    text: [
      `Hi ${input.fullName},`,
      "",
      "Thank you for your interest in TechPath.",
      "After reviewing your request, we are unable to provide portal access at this time.",
      "",
      "— The TechPath Team",
    ].join("\n"),
  });
}

export async function sendCandidateInviteEmail(input: {
  to: string;
  fullName: string;
  candidateId: string;
  inviteId: string;
  token: string;
  expiresAt: Date;
  resend?: boolean;
}) {
  const setupUrl = candidateAccountSetupUrl(input.token);
  const result = await sendTrackedEmail({
    emailType: input.resend ? "candidate_invite_resend" : "candidate_invite",
    to: input.to,
    subject: input.resend
      ? "Your new TechPath account setup link"
      : "Set up your TechPath candidate portal account",
    relatedCandidateId: input.candidateId,
    relatedInviteId: input.inviteId,
    text: [
      `Hi ${input.fullName},`,
      "",
      "Your TechPath candidate portal access has been approved.",
      "Use the secure, single-use link below to create your password:",
      setupUrl,
      "",
      `This link expires on ${input.expiresAt.toLocaleString("en-US", { timeZone: "UTC", timeZoneName: "short" })}.`,
      "If you did not expect this invitation, ignore this email and contact TechPath support.",
      "",
      "— The TechPath Team",
    ].join("\n"),
  });

  return {
    ...result,
    previewUrl: process.env.NODE_ENV === "production" ? undefined : setupUrl,
  };
}

export async function sendNdaSignedEmail(input: {
  to: string;
  fullName: string;
  candidateId: string;
  agreementId: string;
  templateTitle: string;
  templateVersion: string;
  acceptedAt: Date;
  downloadPath: string;
  signedPdf: Buffer;
}) {
  const downloadUrl = new URL(input.downloadPath, candidatePortalOrigin()).toString();
  const safeVersion = input.templateVersion.replace(/[^a-zA-Z0-9._-]+/g, "-");
  return sendTrackedEmail({
    emailType: "nda_signed_candidate",
    to: input.to,
    subject: `Your signed TechPath NDA (version ${input.templateVersion})`,
    relatedCandidateId: input.candidateId,
    relatedNdaAgreementId: input.agreementId,
    text: [
      `Hi ${input.fullName},`,
      "",
      `Your electronic signature for ${input.templateTitle} (version ${input.templateVersion}) was recorded on ${formatDisplayTimestamp(input.acceptedAt)}.`,
      "A copy of the signed PDF is attached to this email.",
      "You can also access the secure copy while signed in to the TechPath portal:",
      downloadUrl,
      "",
      "— The TechPath Team",
    ].join("\n"),
    attachments: [
      {
        filename: `TechPath-NDA-${safeVersion}.pdf`,
        content: input.signedPdf,
        contentType: "application/pdf",
      },
    ],
  });
}
