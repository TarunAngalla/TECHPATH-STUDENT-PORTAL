import { CandidateProgressPage } from "@/components/candidate/CandidateProgressPage";
import { getApplicationsForCandidate } from "@/lib/db/queries/candidate";
import { getCandidateContext } from "@/lib/candidate-context";

export default async function ProgressPage() {
  const { candidate } = await getCandidateContext();
  const applications = await getApplicationsForCandidate(candidate.id);

  return (
    <CandidateProgressPage
      journeyStage={candidate.journeyStage}
      applications={applications}
      createdAt={candidate.createdAt}
    />
  );
}
