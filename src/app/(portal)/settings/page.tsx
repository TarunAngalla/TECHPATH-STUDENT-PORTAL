import { eq, and, desc } from "drizzle-orm";
import { CandidateSettingsPage } from "@/components/candidate/CandidateSettingsPage";
import { getCandidateContext } from "@/lib/candidate-context";
import { serverFeatures } from "@/lib/config/features";
import { db } from "@/lib/db";
import { passwordChangeLog, users } from "@/lib/db/schema";

export default async function SettingsPage() {
  const { candidate, session } = await getCandidateContext();

  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  const [lastAdminReset] = await db
    .select({ changedAt: passwordChangeLog.changedAt })
    .from(passwordChangeLog)
    .where(
      and(
        eq(passwordChangeLog.userId, session.userId),
        eq(passwordChangeLog.method, "admin_reset"),
      ),
    )
    .orderBy(desc(passwordChangeLog.changedAt))
    .limit(1);

  return (
    <CandidateSettingsPage
      fullName={candidate.fullName}
      email={user?.email ?? ""}
      phone={candidate.phone ?? ""}
      lastAdminReset={lastAdminReset?.changedAt ?? null}
      allowPhoneEdit={serverFeatures.candidatePhoneEdit}
    />
  );
}
