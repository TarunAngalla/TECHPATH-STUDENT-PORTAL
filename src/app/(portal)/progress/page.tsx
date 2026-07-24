import { CandidateProgressPage } from "@/components/candidate/CandidateProgressPage";
import { getApplicationsForCandidate } from "@/lib/db/queries/candidate";
import { getCandidateContext } from "@/lib/candidate-context";
import { getCandidateJourneyHistory } from "@/lib/services/candidate-journey";

export default async function ProgressPage() {
  const { candidate } = await getCandidateContext();
  const [applications, journeyEvents] = await Promise.all([
    getApplicationsForCandidate(candidate.id),
    getCandidateJourneyHistory(candidate.id, false),
  ]);

  return (
    <CandidateProgressPage
      journeyStage={candidate.journeyStage}
      applications={applications}
      journeyEvents={journeyEvents}
      marketingStatus={candidate.marketingStatus}
      createdAt={candidate.createdAt}
    />
  );
}
