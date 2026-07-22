import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";

export async function getLeads(excludeConverted = true) {
  if (excludeConverted) {
    return db
      .select()
      .from(leads)
      .where(sql`${leads.status} != 'converted'`)
      .orderBy(desc(leads.createdAt));
  }
  return db.select().from(leads).orderBy(desc(leads.createdAt));
}

export async function getLeadById(id: string) {
  const [row] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  return row ?? null;
}

export async function getConsultationLeads() {
  return db
    .select()
    .from(leads)
    .where(sql`${leads.consultationStatus} != 'not_scheduled' or ${leads.source} = 'consultation_booked'`)
    .orderBy(desc(leads.consultationScheduledAt), desc(leads.createdAt));
}
