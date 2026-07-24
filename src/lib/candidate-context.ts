import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireCandidatePortalAccess } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { staffProfiles, users } from "@/lib/db/schema";
import { getCandidateByUserId } from "@/lib/db/queries/candidate";

export async function getCandidateContext() {
  const session = await requireCandidatePortalAccess();
  const candidate = await getCandidateByUserId(session.userId);
  if (!candidate) redirect("/login");

  let recruiter: {
    id: string;
    name: string;
    email: string;
    title: string;
    phone: string | null;
    timezone: string;
  } | null = null;
  if (candidate.recruiterId) {
    const [row] = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: staffProfiles.fullName,
        title: staffProfiles.title,
        phone: staffProfiles.phone,
        timezone: staffProfiles.timezone,
      })
      .from(users)
      .leftJoin(staffProfiles, eq(staffProfiles.userId, users.id))
      .where(eq(users.id, candidate.recruiterId))
      .limit(1);
    if (row) {
      const local = row.email.split("@")[0] ?? "Recruiter";
      recruiter = {
        id: row.id,
        name: row.fullName ?? local.replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        email: row.email,
        title: row.title ?? "Talent Marketing Specialist",
        phone: row.phone ?? null,
        timezone: row.timezone ?? "America/Chicago",
      };
    }
  }

  return { session, candidate, recruiter };
}
