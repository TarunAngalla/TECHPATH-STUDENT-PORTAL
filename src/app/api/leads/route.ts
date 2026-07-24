import { NextResponse } from "next/server";
import { z } from "zod";
import { submitTrustedEnquiry } from "@/lib/services/public-enquiries";
import { logger } from "@/lib/observability/logger";
import { EXPERIENCE_YEARS_PATTERN } from "@/lib/utils/experience";
import { getOrCreateRequestId } from "@/lib/observability/request-id";

const leadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional(),
  optType: z.enum(["OPT", "STEM_OPT"]).optional(),
  roleInterest: z.string().trim().min(2).max(160).default("General candidate enquiry"),
  experienceSummary: z
    .string()
    .trim()
    .max(40)
    .refine((value) => !value || EXPERIENCE_YEARS_PATTERN.test(value), {
      message: "Enter experience in years (e.g. 3).",
    })
    .optional(),
  additionalInformation: z.string().trim().max(2000).optional(),
});

/**
 * Trusted lead intake for an external TechPath marketing site.
 * Auth: Authorization: Bearer <LEAD_INTAKE_SECRET> or x-api-key.
 */
export async function POST(request: Request) {
  const requestId = getOrCreateRequestId(request.headers);
  const secret = process.env.LEAD_INTAKE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Lead intake is not configured" }, { status: 503 });
  }

  const auth = request.headers.get("authorization");
  const apiKey = request.headers.get("x-api-key");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (bearer !== secret && apiKey !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await submitTrustedEnquiry({
      ...parsed.data,
      phone: parsed.data.phone ?? "",
      optType: parsed.data.optType ?? "",
      experienceSummary: parsed.data.experienceSummary ?? "",
      additionalInformation: parsed.data.additionalInformation ?? "",
    });
    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          created: false,
          error: result.error,
          code: result.code,
          id: result.leadId,
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { id: result.leadId, ok: true, created: true },
      { status: 201 },
    );
  } catch (error) {
    logger.error("trusted_lead.intake_failed", error, { requestId });
    return NextResponse.json({ error: "Unable to process enquiry" }, { status: 500 });
  }
}
