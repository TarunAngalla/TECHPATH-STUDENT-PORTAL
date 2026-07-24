import { and, eq, inArray, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { staffProfiles, users } from "@/lib/db/schema";
import { getDashboardStats } from "./dashboard";
import { getCandidatesList } from "./candidates";

export async function getReportsData() {
  const stats = await getDashboardStats();
  const candidates = await getCandidatesList();
  return { ...stats, candidates };
}

export async function getStaffUsers() {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      fullName: staffProfiles.fullName,
      title: staffProfiles.title,
      phone: staffProfiles.phone,
      timezone: staffProfiles.timezone,
      maxActiveCandidates: staffProfiles.maxActiveCandidates,
      isAvailable: staffProfiles.isAvailable,
    })
    .from(users)
    .leftJoin(staffProfiles, eq(staffProfiles.userId, users.id))
    .where(and(inArray(users.role, ["recruiter", "admin"]), ne(users.accountState, "suspended")))
    .orderBy(users.email);

  return rows.map((row) => ({
    ...row,
    fullName:
      row.fullName ??
      row.email.split("@")[0].replaceAll(".", " ").replace(/\b\w/g, (char) => char.toUpperCase()),
    title: row.title ?? (row.role === "admin" ? "Administrator" : "Talent Marketing Specialist"),
    timezone: row.timezone ?? "America/Chicago",
    maxActiveCandidates: row.maxActiveCandidates ?? 20,
    isAvailable: row.isAvailable ?? true,
  }));
}
