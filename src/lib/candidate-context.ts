import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireCandidateAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getCandidateByUserId } from "@/lib/db/queries/candidate";

export async function getCandidateContext() {
  const session = await requireCandidateAuth();
  const candidate = await getCandidateByUserId(session.userId);
  if (!candidate) redirect("/login");

  let recruiter: { name: string; email: string } | null = null;
  if (candidate.recruiterId) {
    const [row] = await db
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, candidate.recruiterId))
      .limit(1);
    if (row) {
      const local = row.email.split("@")[0] ?? "Recruiter";
      recruiter = {
        name: local.replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        email: row.email,
      };
    }
  }

  return { session, candidate, recruiter };
}
