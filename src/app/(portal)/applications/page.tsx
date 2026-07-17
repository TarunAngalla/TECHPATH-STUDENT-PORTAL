import { CandidateApplicationsTable } from "@/components/candidate/CandidateApplicationsTable";
import { getApplicationsForCandidate } from "@/lib/db/queries/candidate";
import { getCandidateContext } from "@/lib/candidate-context";

export default async function ApplicationsPage() {
  const { candidate } = await getCandidateContext();
  const applications = await getApplicationsForCandidate(candidate.id);

  return <CandidateApplicationsTable applications={applications} />;
}
