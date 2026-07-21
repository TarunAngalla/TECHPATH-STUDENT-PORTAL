import { NextResponse } from "next/server";
import { z } from "zod";
import { submitTrustedEnquiry } from "@/lib/services/public-enquiries";

const leadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional(),
  optType: z.enum(["OPT", "STEM_OPT"]).optional(),
  roleInterest: z.string().trim().min(2).max(160).default("General candidate enquiry"),
  experienceSummary: z.string().trim().max(1200).optional(),
  additionalInformation: z.string().trim().max(2000).optional(),
});

/**
 * Trusted lead intake for an external TechPath marketing site.
 * Auth: Authorization: Bearer <LEAD_INTAKE_SECRET> or x-api-key.
 */
export async function POST(request: Request) {
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
    return NextResponse.json(
      { id: result.leadId, ok: true, created: result.created },
      { status: result.created ? 201 : 200 },
    );
  } catch (error) {
    console.error("[api/leads] intake failed", error);
    return NextResponse.json({ error: "Unable to process enquiry" }, { status: 500 });
  }
}
