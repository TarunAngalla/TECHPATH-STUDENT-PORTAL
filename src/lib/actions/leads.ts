"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStaffAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import type { LeadStatus } from "@/lib/constants/lead-status";

const statusOrder: LeadStatus[] = ["new", "contacted", "qualified", "rejected", "converted"];

const createLeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  optType: z.enum(["OPT", "STEM_OPT"]).optional(),
  source: z.enum(["enquiry_form", "consultation_booked"]),
  notes: z.string().optional(),
});

export async function createLead(data: z.infer<typeof createLeadSchema>) {
  await requireStaffAuth();
  const parsed = createLeadSchema.safeParse(data);
  if (!parsed.success) return { error: "Invalid input" };

  const [lead] = await db
    .insert(leads)
    .values({
      name: parsed.data.name.trim(),
      email: parsed.data.email.toLowerCase().trim(),
      phone: parsed.data.phone?.trim() || null,
      optType: parsed.data.optType,
      source: parsed.data.source,
      notes: parsed.data.notes?.trim() ?? "",
      status: "new",
    })
    .returning({ id: leads.id });

  revalidatePath("/admin/leads");
  revalidatePath("/admin/dashboard");
  return { id: lead.id };
}

export async function updateLeadStatus(leadId: string, direction: "approve" | "reject") {
  await requireStaffAuth();
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) return { error: "Not found" };

  const currentIdx = statusOrder.indexOf(lead.status as LeadStatus);
  let newStatus: LeadStatus = lead.status as LeadStatus;

  if (direction === "approve" && currentIdx < statusOrder.indexOf("qualified")) {
    newStatus = statusOrder[currentIdx + 1] as LeadStatus;
  } else if (direction === "reject") {
    newStatus = "rejected";
  }

  await db.update(leads).set({ status: newStatus }).where(eq(leads.id, leadId));
  revalidatePath("/admin/leads");
  revalidatePath("/admin/dashboard");
  return { status: newStatus };
}

export async function saveLeadNotes(leadId: string, notes: string) {
  await requireStaffAuth();
  await db.update(leads).set({ notes }).where(eq(leads.id, leadId));
  revalidatePath("/admin/leads");
  return {};
}
