import { CandidateUpcomingCards } from "@/components/candidate/CandidateUpcomingCards";
import { getUpcomingApplications } from "@/lib/db/queries/candidate";
import { getCandidateContext } from "@/lib/candidate-context";

export default async function UpcomingPage() {
  const { candidate } = await getCandidateContext();
  const applications = await getUpcomingApplications(candidate.id);

  return <CandidateUpcomingCards applications={applications} />;
}
