import { CandidateDashboard } from "@/components/candidate/CandidateDashboard";
import {
  getDashboardStatsForCandidate,
  getAnnouncementsForCandidate,
  getOnboardingChecklist,
} from "@/lib/db/queries/candidate";
import { getCandidateContext } from "@/lib/candidate-context";
import { formatDate } from "@/lib/utils/dates";

export default async function DashboardPage() {
  const { candidate, recruiter } = await getCandidateContext();
  const [stats, announcements, checklist] = await Promise.all([
    getDashboardStatsForCandidate(candidate.id),
    getAnnouncementsForCandidate(candidate.id),
    getOnboardingChecklist(candidate.id, candidate.userId),
  ]);

  const latestUpdate = stats.applications.reduce<Date | null>((latest, app) => {
    const updated = app.updatedAt ? new Date(app.updatedAt) : null;
    if (!updated) return latest;
    if (!latest || updated > latest) return updated;
    return latest;
  }, null);

  const profileLastUpdated = formatDate(latestUpdate) || "—";

  return (
    <CandidateDashboard
      candidateName={candidate.fullName}
      journeyStage={candidate.journeyStage}
      profileLastUpdated={profileLastUpdated || "—"}
      stats={stats}
      recruiter={recruiter}
      announcements={announcements}
      checklist={checklist}
    />
  );
}
