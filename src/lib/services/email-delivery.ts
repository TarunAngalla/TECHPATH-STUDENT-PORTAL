import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  emailDeliveryLogs,
  type emailDeliveryTypes,
} from "@/lib/db/schema";

type EmailDeliveryType = (typeof emailDeliveryTypes)[number];

type TrackedEmailInput = {
  emailType: EmailDeliveryType;
  to: string;
  subject: string;
  text: string;
  relatedLeadId?: string;
  relatedCandidateId?: string;
  relatedInviteId?: string;
  relatedNdaAgreementId?: string;
  attachments?: { filename: string; content: Buffer; contentType?: string }[];
};

type ResendResponse = { id?: string };

function normalizeRecipient(value: string) {
  return value.trim().toLowerCase();
}

function safeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 1000);
  return "Unknown email delivery error";
}

export async function sendTrackedEmail(input: TrackedEmailInput) {
  const recipient = normalizeRecipient(input.to);
  const [log] = await db
    .insert(emailDeliveryLogs)
    .values({
      emailType: input.emailType,
      recipient,
      subject: input.subject,
      status: "queued",
      relatedLeadId: input.relatedLeadId,
      relatedCandidateId: input.relatedCandidateId,
      relatedInviteId: input.relatedInviteId,
      relatedNdaAgreementId: input.relatedNdaAgreementId,
    })
    .returning({ id: emailDeliveryLogs.id });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "The Tech Path <onboarding@thetechpath.com>";

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[email:dev]", {
        type: input.emailType,
        to: recipient,
        subject: input.subject,
      });
    }
    await db
      .update(emailDeliveryLogs)
      .set({ status: "logged", lastAttemptAt: new Date() })
      .where(eq(emailDeliveryLogs.id, log.id));
    return { sent: false, mode: "logged" as const, logId: log.id };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [recipient],
        subject: input.subject,
        text: input.text,
        ...(input.attachments?.length
          ? {
              attachments: input.attachments.map((attachment) => ({
                filename: attachment.filename,
                content: attachment.content.toString("base64"),
              })),
            }
          : {}),
      }),
    });

    if (!response.ok) {
      const errorText = (await response.text()).slice(0, 1000);
      await db
        .update(emailDeliveryLogs)
        .set({
          status: "failed",
          errorMessage: `Resend ${response.status}: ${errorText}`,
          lastAttemptAt: new Date(),
        })
        .where(eq(emailDeliveryLogs.id, log.id));
      return { sent: false, mode: "error" as const, logId: log.id };
    }

    const payload = (await response.json().catch(() => ({}))) as ResendResponse;
    const sentAt = new Date();
    await db
      .update(emailDeliveryLogs)
      .set({
        status: "sent",
        providerMessageId: payload.id ?? null,
        errorMessage: null,
        sentAt,
        lastAttemptAt: sentAt,
      })
      .where(eq(emailDeliveryLogs.id, log.id));
    return { sent: true, mode: "resend" as const, logId: log.id };
  } catch (error) {
    await db
      .update(emailDeliveryLogs)
      .set({
        status: "failed",
        errorMessage: safeErrorMessage(error),
        lastAttemptAt: new Date(),
      })
      .where(eq(emailDeliveryLogs.id, log.id));
    return { sent: false, mode: "error" as const, logId: log.id };
  }
}
