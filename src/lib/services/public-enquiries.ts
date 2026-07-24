import { createHash } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { leads, publicRequestRateLimits, users } from "@/lib/db/schema";
import { EXPERIENCE_YEARS_PATTERN } from "@/lib/utils/experience";
import {
  sendAdminNewEnquiryEmail,
  sendEnquiryAcknowledgementEmail,
} from "@/lib/email";

export const publicEnquirySchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(120),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  optType: z.enum(["OPT", "STEM_OPT"]).optional().or(z.literal("")),
  roleInterest: z.string().trim().min(2, "Enter the role you are interested in.").max(160),
  experienceSummary: z
    .string()
    .trim()
    .max(40)
    .refine((value) => !value || EXPERIENCE_YEARS_PATTERN.test(value), {
      message: "Enter experience in years (e.g. 3).",
    })
    .optional()
    .or(z.literal("")),
  additionalInformation: z.string().trim().max(2000).optional().or(z.literal("")),
  consent: z.literal(true, { errorMap: () => ({ message: "Consent is required." }) }),
  website: z.string().max(0).optional().or(z.literal("")),
});

export type PublicEnquiryInput = z.infer<typeof publicEnquirySchema>;

export type EnquiryDuplicateCode =
  | "existing_account"
  | "active_enquiry"
  | "rejected_cooldown";

function normalizedEmail(email: string) {
  return email.trim().toLowerCase();
}

function rateLimitSecret() {
  const secret = process.env.RATE_LIMIT_HASH_SECRET ?? process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("RATE_LIMIT_HASH_SECRET or SESSION_SECRET is required in production");
  }
  return secret ?? "techpath-local-rate-limit-secret";
}

function hashRateLimitKey(kind: "ip" | "email", value: string) {
  return createHash("sha256")
    .update(`${rateLimitSecret()}:${kind}:${value}`, "utf8")
    .digest("hex");
}

async function consumeRateLimit(keyHash: string, limit: number, windowMinutes: number) {
  const now = new Date();
  const cutoffMs = now.getTime() - windowMinutes * 60 * 1000;

  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${keyHash}))`);

    const [existing] = await tx
      .select()
      .from(publicRequestRateLimits)
      .where(eq(publicRequestRateLimits.keyHash, keyHash))
      .limit(1);

    if (!existing) {
      await tx.insert(publicRequestRateLimits).values({
        keyHash,
        windowStartedAt: now,
        requestCount: 1,
        updatedAt: now,
      });
      return 1 <= limit;
    }

    const windowExpired = existing.windowStartedAt.getTime() <= cutoffMs;
    const nextCount = windowExpired ? 1 : existing.requestCount + 1;

    await tx
      .update(publicRequestRateLimits)
      .set({
        requestCount: nextCount,
        windowStartedAt: windowExpired ? now : existing.windowStartedAt,
        updatedAt: now,
      })
      .where(eq(publicRequestRateLimits.keyHash, keyHash));

    return nextCount <= limit;
  });
}

export async function enforcePublicEnquiryRateLimit(input: {
  clientKey: string;
  email: string;
}) {
  const ipLimit = Number(process.env.PUBLIC_ENQUIRY_IP_LIMIT ?? 8);
  const emailLimit = Number(process.env.PUBLIC_ENQUIRY_EMAIL_LIMIT ?? 3);
  const windowMinutes = Number(process.env.PUBLIC_ENQUIRY_RATE_WINDOW_MINUTES ?? 60);
  const safeIpLimit = Number.isFinite(ipLimit) && ipLimit > 0 ? ipLimit : 8;
  const safeEmailLimit = Number.isFinite(emailLimit) && emailLimit > 0 ? emailLimit : 3;
  const safeWindow = Number.isFinite(windowMinutes) && windowMinutes > 0 ? windowMinutes : 60;

  const [ipAllowed, emailAllowed] = await Promise.all([
    consumeRateLimit(hashRateLimitKey("ip", input.clientKey), safeIpLimit, safeWindow),
    consumeRateLimit(
      hashRateLimitKey("email", normalizedEmail(input.email)),
      safeEmailLimit,
      safeWindow,
    ),
  ]);

  return ipAllowed && emailAllowed;
}

/** Rate-limit login attempts by IP and email (failed and successful attempts consume quota). */
export async function enforceLoginRateLimit(input: {
  clientKey: string;
  email: string;
}) {
  const ipLimit = Number(process.env.LOGIN_IP_LIMIT ?? 20);
  const emailLimit = Number(process.env.LOGIN_EMAIL_LIMIT ?? 10);
  const windowMinutes = Number(process.env.LOGIN_RATE_WINDOW_MINUTES ?? 15);
  const safeIpLimit = Number.isFinite(ipLimit) && ipLimit > 0 ? ipLimit : 20;
  const safeEmailLimit = Number.isFinite(emailLimit) && emailLimit > 0 ? emailLimit : 10;
  const safeWindow = Number.isFinite(windowMinutes) && windowMinutes > 0 ? windowMinutes : 15;

  const email = normalizedEmail(input.email);
  const [ipAllowed, emailAllowed] = await Promise.all([
    consumeRateLimit(hashRateLimitKey("ip", `login:${input.clientKey}`), safeIpLimit, safeWindow),
    consumeRateLimit(hashRateLimitKey("email", `login:${email}`), safeEmailLimit, safeWindow),
  ]);

  return ipAllowed && emailAllowed;
}

function rejectedCooldownDays() {
  const configured = Number(process.env.PUBLIC_ENQUIRY_REAPPLICATION_DAYS ?? 30);
  return Number.isFinite(configured) && configured >= 0 ? configured : 30;
}

type ExistingLeadForDuplicatePolicy = {
  id: string;
  status: "new" | "contacted" | "qualified" | "rejected" | "converted";
  rejectedAt: Date | null;
  createdAt: Date;
};

function duplicateMessage(code: EnquiryDuplicateCode, cooldownDays = rejectedCooldownDays()) {
  switch (code) {
    case "existing_account":
      return "An account with this email already exists. Please sign in instead of submitting another request.";
    case "active_enquiry":
      return "A request with this email is already under review. Please wait for our team to contact you — do not submit again.";
    case "rejected_cooldown":
      return `A recent request with this email was declined. You can apply again after ${cooldownDays} days.`;
  }
}

function evaluateDuplicatePolicy(latest: ExistingLeadForDuplicatePolicy | undefined): {
  leadId: string;
  code: EnquiryDuplicateCode;
} | null {
  if (!latest) return null;
  if (latest.status === "converted") {
    return { leadId: latest.id, code: "existing_account" };
  }
  if (
    latest.status === "new" ||
    latest.status === "contacted" ||
    latest.status === "qualified"
  ) {
    return { leadId: latest.id, code: "active_enquiry" };
  }
  if (latest.status === "rejected") {
    const anchor = latest.rejectedAt ?? latest.createdAt;
    const cooldownMs = rejectedCooldownDays() * 24 * 60 * 60 * 1000;
    if (Date.now() - anchor.getTime() < cooldownMs) {
      return { leadId: latest.id, code: "rejected_cooldown" };
    }
  }
  return null;
}

async function createEnquiryRecord(input: {
  name: string;
  email: string;
  phone?: string;
  optType?: "OPT" | "STEM_OPT" | "";
  roleInterest: string;
  experienceSummary?: string;
  additionalInformation?: string;
}) {
  return db.transaction(async (tx) => {
    // Serialize submissions for the same normalized email (blocks double-submit races).
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${input.email}))`);

    const [existingUser] = await tx
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);
    if (existingUser) {
      return {
        created: false as const,
        code: "existing_account" as const,
        leadId: null as string | null,
      };
    }

    const [latest] = await tx
      .select({
        id: leads.id,
        status: leads.status,
        rejectedAt: leads.rejectedAt,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .where(eq(leads.email, input.email))
      .orderBy(desc(leads.createdAt))
      .limit(1);

    const duplicate = evaluateDuplicatePolicy(latest);
    if (duplicate) {
      return {
        created: false as const,
        code: duplicate.code,
        leadId: duplicate.leadId as string | null,
      };
    }

    const [lead] = await tx
      .insert(leads)
      .values({
        name: input.name.trim(),
        email: input.email,
        phone: input.phone || null,
        optType: input.optType || null,
        roleInterest: input.roleInterest,
        experienceSummary: input.experienceSummary || null,
        additionalInformation: input.additionalInformation || null,
        source: "enquiry_form",
        status: "new",
        notes: "",
      })
      .returning({ id: leads.id });

    return { created: true as const, leadId: lead.id, code: null };
  });
}

export async function submitPublicEnquiry(input: PublicEnquiryInput & { clientKey: string }) {
  const parsed = publicEnquirySchema.parse(input);
  const email = normalizedEmail(parsed.email);

  const allowed = await enforcePublicEnquiryRateLimit({ clientKey: input.clientKey, email });
  if (!allowed) {
    return { ok: false as const, error: "Too many requests. Please try again later." };
  }

  // Honeypot: bots that fill hidden "website" are rejected quietly.
  if (parsed.website) {
    return { ok: false as const, error: "Unable to submit this request." };
  }

  const result = await createEnquiryRecord({
    name: parsed.name,
    email,
    phone: parsed.phone,
    optType: parsed.optType,
    roleInterest: parsed.roleInterest,
    experienceSummary: parsed.experienceSummary,
    additionalInformation: parsed.additionalInformation,
  });

  if (!result.created) {
    return {
      ok: false as const,
      error: duplicateMessage(result.code),
      code: result.code,
      leadId: result.leadId ?? undefined,
    };
  }

  await Promise.allSettled([
    sendEnquiryAcknowledgementEmail({ to: email, fullName: parsed.name, leadId: result.leadId }),
    sendAdminNewEnquiryEmail({
      leadId: result.leadId,
      fullName: parsed.name,
      email,
      roleInterest: parsed.roleInterest,
    }),
  ]);

  return { ok: true as const, created: true as const, leadId: result.leadId };
}

export async function submitTrustedEnquiry(input: Omit<PublicEnquiryInput, "consent" | "website">) {
  const email = normalizedEmail(input.email);
  const result = await createEnquiryRecord({
    name: input.name,
    email,
    phone: input.phone,
    optType: input.optType,
    roleInterest: input.roleInterest,
    experienceSummary: input.experienceSummary,
    additionalInformation: input.additionalInformation,
  });

  if (!result.created) {
    return {
      ok: false as const,
      created: false as const,
      error: duplicateMessage(result.code),
      code: result.code,
      leadId: result.leadId ?? undefined,
    };
  }

  await Promise.allSettled([
    sendEnquiryAcknowledgementEmail({ to: email, fullName: input.name, leadId: result.leadId }),
    sendAdminNewEnquiryEmail({
      leadId: result.leadId,
      fullName: input.name,
      email,
      roleInterest: input.roleInterest,
    }),
  ]);

  return { ok: true as const, created: true as const, leadId: result.leadId };
}
