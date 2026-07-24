"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { logger } from "@/lib/observability/logger";
import { z } from "zod";
import { requireAdminAuth } from "@/lib/auth/guards";
import { logAudit } from "@/lib/auth/password";
import { db } from "@/lib/db";
import { leads, users } from "@/lib/db/schema";
import { sendConsultationScheduledCandidateEmail, sendConsultationScheduledStaffEmail, sendLeadRejectedEmail } from "@/lib/email";
import { logger } from "@/lib/observability/logger";
import { EXPERIENCE_YEARS_PATTERN } from "@/lib/utils/experience";

const createLeadSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional(),
  optType: z.enum(["OPT", "STEM_OPT"]).optional(),
  roleInterest: z.string().trim().max(160).optional(),
  experienceSummary: z
    .string()
    .trim()
    .max(40)
    .refine((value) => !value || EXPERIENCE_YEARS_PATTERN.test(value), {
      message: "Enter experience in years (e.g. 3).",
    })
    .optional(),
  additionalInformation: z.string().trim().max(2000).optional(),
  source: z.enum(["enquiry_form", "consultation_booked"]),
  notes: z.string().trim().max(3000).optional(),
});

function revalidateLeadViews() {
  revalidatePath("/admin/leads");
  revalidatePath("/admin/dashboard");
}

export async function createLead(data: z.infer<typeof createLeadSchema>) {
  const admin = await requireAdminAuth();
  const parsed = createLeadSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid input." };
  const email = parsed.data.email.toLowerCase();

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existingUser) {
    return { error: "A portal user already exists for this email address." };
  }

  const [existing] = await db
    .select({ id: leads.id, status: leads.status })
    .from(leads)
    .where(
      and(
        eq(leads.email, email),
        inArray(leads.status, ["new", "contacted", "qualified", "converted"]),
      ),
    )
    .limit(1);
  if (existing) return { error: "An active enquiry already exists for this email address." };

  const consultationStatus =
    parsed.data.source === "consultation_booked" ? "scheduled" : "not_scheduled";
  const [lead] = await db
    .insert(leads)
    .values({
      name: parsed.data.name,
      email,
      phone: parsed.data.phone || null,
      optType: parsed.data.optType,
      roleInterest: parsed.data.roleInterest || null,
      experienceSummary: parsed.data.experienceSummary || null,
      additionalInformation: parsed.data.additionalInformation || null,
      source: parsed.data.source,
      consultationStatus,
      notes: parsed.data.notes ?? "",
      status: "new",
    })
    .returning({ id: leads.id });

  await logAudit({
    actorUserId: admin.userId,
    action: "create_lead",
    targetTable: "leads",
    targetId: lead.id,
  });
  revalidateLeadViews();
  return { id: lead.id };
}

const scheduleSchema = z.object({
  leadId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
  meetingLink: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .refine((value) => !value || /^https?:\/\//i.test(value), {
      message: "Meeting link must be a valid http(s) URL.",
    }),
  notes: z.string().trim().max(3000).optional(),
  /** Optional recruiter to notify. If omitted, admin notification inbox is used. */
  notifyRecruiterId: z.string().uuid().optional().nullable(),
});

export async function scheduleLeadConsultation(data: z.infer<typeof scheduleSchema>) {
  const admin = await requireAdminAuth();
  const parsed = scheduleSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Enter a valid consultation date and time." };
  }

  const scheduledAt = new Date(parsed.data.scheduledAt);
  const meetingLink = parsed.data.meetingLink || null;

  let staffTo = process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || admin.email;
  let recipientLabel = "admin inbox";

  if (parsed.data.notifyRecruiterId) {
    const [recruiter] = await db
      .select({ id: users.id, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.id, parsed.data.notifyRecruiterId))
      .limit(1);
    if (!recruiter || recruiter.role !== "recruiter") {
      return { error: "Select a valid recruiter to notify, or leave it as admin." };
    }
    staffTo = recruiter.email;
    recipientLabel = "assigned recruiter";
  }

  const [updated] = await db
    .update(leads)
    .set({
      status: "contacted",
      consultationStatus: "scheduled",
      consultationScheduledAt: scheduledAt,
      consultationMeetingLink: meetingLink,
      consultationNotes: parsed.data.notes ?? "",
      reviewedAt: new Date(),
      reviewedBy: admin.userId,
    })
    .where(
      and(
        eq(leads.id, parsed.data.leadId),
        inArray(leads.status, ["new", "contacted"]),
      ),
    )
    .returning({ id: leads.id, name: leads.name, email: leads.email });
  if (!updated) return { error: "Only a new or contacted enquiry can be scheduled." };

  await logAudit({
    actorUserId: admin.userId,
    action: "schedule_lead_consultation",
    targetTable: "leads",
    targetId: parsed.data.leadId,
  });

  try {
    await sendConsultationScheduledCandidateEmail({
      to: updated.email,
      fullName: updated.name,
      leadId: updated.id,
      scheduledAt,
      meetingLink,
    });
  } catch (error) {
    logger.error("email.consultation_candidate_failed", error, { leadId: updated.id });
  }

  try {
    await sendConsultationScheduledStaffEmail({
      to: staffTo,
      leadId: updated.id,
      fullName: updated.name,
      candidateEmail: updated.email,
      scheduledAt,
      meetingLink,
      recipientLabel,
    });
  } catch (error) {
    logger.error("email.consultation_staff_failed", error, { leadId: updated.id });
  }

  revalidateLeadViews();
  return { success: true };
}

const consultationStatusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(["completed", "cancelled", "no_show"]),
  notes: z.string().trim().max(3000).optional(),
});

export async function updateLeadConsultationStatus(
  data: z.infer<typeof consultationStatusSchema>,
) {
  const admin = await requireAdminAuth();
  const parsed = consultationStatusSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid consultation update." };
  const now = new Date();

  const [updated] = await db
    .update(leads)
    .set({
      status: "contacted",
      consultationStatus: parsed.data.status,
      consultationCompletedAt: parsed.data.status === "completed" ? now : null,
      consultationNotes: parsed.data.notes ?? "",
      reviewedAt: now,
      reviewedBy: admin.userId,
    })
    .where(
      and(
        eq(leads.id, parsed.data.leadId),
        inArray(leads.status, ["new", "contacted"]),
      ),
    )
    .returning({ id: leads.id });
  if (!updated) return { error: "Only a new or contacted enquiry can be updated." };

  await logAudit({
    actorUserId: admin.userId,
    action: `lead_consultation_${parsed.data.status}`,
    targetTable: "leads",
    targetId: parsed.data.leadId,
  });
  revalidateLeadViews();
  return { success: true, status: parsed.data.status };
}

export async function approveLeadForPortal(leadId: string) {
  const admin = await requireAdminAuth();
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) return { error: "Enquiry not found." };
  if (["rejected", "converted"].includes(lead.status)) {
    return { error: "This enquiry can no longer be approved." };
  }
  const allowWithoutConsultation = process.env.ALLOW_APPROVAL_WITHOUT_CONSULTATION === "true";
  if (lead.consultationStatus !== "completed" && !allowWithoutConsultation) {
    return { error: "Complete the consultation before approving portal access." };
  }

  const now = new Date();
  await db
    .update(leads)
    .set({
      status: "qualified",
      approvedAt: now,
      rejectedAt: null,
      rejectionReason: null,
      reviewedAt: now,
      reviewedBy: admin.userId,
    })
    .where(eq(leads.id, leadId));

  await logAudit({
    actorUserId: admin.userId,
    action: "approve_lead_portal_access",
    targetTable: "leads",
    targetId: leadId,
  });
  revalidateLeadViews();
  return { success: true, status: "qualified" as const };
}

const rejectSchema = z.object({
  leadId: z.string().uuid(),
  reason: z.string().trim().min(3, "Enter an internal rejection reason.").max(2000),
});

export async function rejectLead(data: z.infer<typeof rejectSchema>) {
  const admin = await requireAdminAuth();
  const parsed = rejectSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const [lead] = await db.select().from(leads).where(eq(leads.id, parsed.data.leadId)).limit(1);
  if (!lead) return { error: "Enquiry not found." };
  if (lead.status === "converted") return { error: "A converted enquiry cannot be rejected." };

  const now = new Date();
  await db
    .update(leads)
    .set({
      status: "rejected",
      rejectionReason: parsed.data.reason,
      rejectedAt: now,
      reviewedAt: now,
      reviewedBy: admin.userId,
    })
    .where(eq(leads.id, parsed.data.leadId));

  let deliveryMode: "logged" | "resend" | "error" = "error";
  try {
    const delivery = await sendLeadRejectedEmail({
      to: lead.email,
      fullName: lead.name,
      leadId: lead.id,
    });
    deliveryMode = delivery.mode;
  } catch (error) {
    logger.error("email.lead_rejection_failed", error, { leadId: lead.id });
  }
  await logAudit({
    actorUserId: admin.userId,
    action: "reject_lead",
    targetTable: "leads",
    targetId: lead.id,
  });
  revalidateLeadViews();
  return { success: true, status: "rejected" as const, delivery: deliveryMode };
}

/** Backward-compatible transition used by any older UI. New UI should use explicit actions. */
export async function updateLeadStatus(leadId: string, direction: "approve" | "reject") {
  if (direction === "reject") {
    return rejectLead({ leadId, reason: "Rejected during administrative review" });
  }
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) return { error: "Enquiry not found." };
  if (lead.status === "new") {
    const admin = await requireAdminAuth();
    await db
      .update(leads)
      .set({ status: "contacted", reviewedAt: new Date(), reviewedBy: admin.userId })
      .where(eq(leads.id, leadId));
    revalidateLeadViews();
    return { status: "contacted" as const };
  }
  return approveLeadForPortal(leadId);
}

export async function saveLeadNotes(leadId: string, notes: string) {
  await requireAdminAuth();
  const safeNotes = z.string().max(5000).parse(notes);
  await db.update(leads).set({ notes: safeNotes }).where(eq(leads.id, leadId));
  revalidatePath("/admin/leads");
  return {};
}
