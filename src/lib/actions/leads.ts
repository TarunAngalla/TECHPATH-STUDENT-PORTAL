"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireStaffAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import type { LeadStatus } from "@/lib/constants/lead-status";

const statusOrder: LeadStatus[] = ["new", "contacted", "qualified", "rejected", "converted"];

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
  return { status: newStatus };
}

export async function saveLeadNotes(leadId: string, notes: string) {
  await requireStaffAuth();
  await db.update(leads).set({ notes }).where(eq(leads.id, leadId));
  revalidatePath("/admin/leads");
  return {};
}
