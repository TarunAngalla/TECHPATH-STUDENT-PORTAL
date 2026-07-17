import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getDashboardStats } from "./dashboard";
import { getCandidatesList } from "./candidates";

export async function getReportsData() {
  const stats = await getDashboardStats();
  const candidates = await getCandidatesList();
  return { ...stats, candidates };
}

export async function getStaffUsers() {
  return db
    .select({ id: users.id, email: users.email, role: users.role, createdAt: users.createdAt })
    .from(users)
    .where(inArray(users.role, ["recruiter", "admin"]))
    .orderBy(users.email);
}
