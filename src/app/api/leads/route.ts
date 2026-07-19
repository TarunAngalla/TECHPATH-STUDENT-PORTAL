import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";

const leadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  optType: z.enum(["OPT", "STEM_OPT"]).optional(),
  source: z.enum(["enquiry_form", "consultation_booked"]).default("enquiry_form"),
  notes: z.string().optional(),
});

/**
 * Public lead intake for the marketing site.
 * Auth: Authorization: Bearer <LEAD_INTAKE_SECRET> or x-api-key header.
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
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const [lead] = await db
    .insert(leads)
    .values({
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone,
      optType: parsed.data.optType,
      source: parsed.data.source,
      notes: parsed.data.notes ?? "",
      status: "new",
    })
    .returning({ id: leads.id });

  return NextResponse.json({ id: lead.id, ok: true }, { status: 201 });
}
