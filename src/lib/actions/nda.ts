"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminAuth, requireCandidateAuth } from "@/lib/auth/guards";
import { updateCandidateSessionState } from "@/lib/auth/session";
import {
  activateNdaTemplate,
  createNdaTemplate,
  NdaWorkflowError,
  signActiveNda,
} from "@/lib/services/nda";

export type NdaSignActionState = { error?: string };
export type NdaAdminActionState = { error?: string; success?: boolean };

const signSchema = z.object({
  signerName: z.string().trim().min(2, "Enter your full legal name.").max(160),
  consentAccepted: z.literal("on", { errorMap: () => ({ message: "You must accept the NDA before signing." }) }),
});

const templateSchema = z.object({
  version: z.string().trim().min(1).max(50).regex(/^[a-zA-Z0-9._-]+$/, "Use letters, numbers, dots, dashes or underscores."),
  title: z.string().trim().min(3).max(200),
  content: z.string().trim().min(100, "NDA content must contain at least 100 characters.").max(100_000),
  effectiveFrom: z.coerce.date(),
  activateNow: z.boolean(),
});

function clientIp(values: Headers) {
  return values.get("x-forwarded-for")?.split(",")[0]?.trim() || values.get("x-real-ip")?.trim() || null;
}

function signingErrorMessage(error: unknown) {
  if (error instanceof NdaWorkflowError) return error.message;
  if (error instanceof Error) {
    if (error.message === "NDA_CONSENT_REQUIRED") return "You must accept the NDA before signing.";
    if (error.message === "NDA_SIGNER_NAME_MISMATCH") return "Your typed name must match your candidate profile name exactly.";
    if (error.message === "NDA_SIGNER_NAME_INVALID") return "Enter your full legal name.";
  }
  return "The NDA could not be signed. Please try again or contact TechPath support.";
}

export async function signNdaAction(
  _previous: NdaSignActionState,
  formData: FormData,
): Promise<NdaSignActionState> {
  const candidate = await requireCandidateAuth();
  if (!candidate.candidateId) return { error: "Candidate profile is not configured." };
  const parsed = signSchema.safeParse({
    signerName: formData.get("signerName"),
    consentAccepted: formData.get("consentAccepted"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Review the signing fields." };

  const requestHeaders = await headers();
  try {
    const result = await signActiveNda({
      userId: candidate.userId,
      candidateId: candidate.candidateId,
      signerName: parsed.data.signerName,
      consentAccepted: true,
      signerIp: clientIp(requestHeaders),
      signerUserAgent: requestHeaders.get("user-agent"),
    });
    if (result.sessionVersion && result.accountState) {
      await updateCandidateSessionState({
        accountState: result.accountState,
        sessionVersion: result.sessionVersion,
        firstLogin: false,
      });
    }
  } catch (error) {
    return { error: signingErrorMessage(error) };
  }
  redirect("/dashboard");
}

export async function createNdaTemplateAction(
  _previous: NdaAdminActionState,
  formData: FormData,
): Promise<NdaAdminActionState> {
  const admin = await requireAdminAuth();
  const effectiveValue = String(formData.get("effectiveFrom") ?? "").trim();
  const parsed = templateSchema.safeParse({
    version: formData.get("version"),
    title: formData.get("title"),
    content: formData.get("content"),
    effectiveFrom: effectiveValue ? new Date(effectiveValue) : new Date(),
    activateNow: formData.get("activateNow") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Review the NDA template fields." };

  try {
    await createNdaTemplate({ actorUserId: admin.userId, ...parsed.data });
  } catch (error) {
    if (error instanceof NdaWorkflowError) return { error: error.message };
    if (error instanceof Error && /unique|duplicate/i.test(error.message)) {
      return { error: "That NDA version already exists." };
    }
    return { error: "The NDA template could not be created." };
  }
  revalidatePath("/admin/nda");
  return { success: true };
}

export async function activateNdaTemplateAction(templateId: string) {
  const admin = await requireAdminAuth();
  const parsed = z.string().uuid().safeParse(templateId);
  if (!parsed.success) return { error: "Invalid NDA template." };
  try {
    await activateNdaTemplate({ actorUserId: admin.userId, templateId: parsed.data });
  } catch (error) {
    if (error instanceof NdaWorkflowError) return { error: error.message };
    return { error: "The NDA template could not be activated." };
  }
  revalidatePath("/admin/nda");
  revalidatePath("/admin/dashboard");
  return { success: true };
}
