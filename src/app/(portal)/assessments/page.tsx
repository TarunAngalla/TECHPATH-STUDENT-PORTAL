import { CandidateActivityTimeline } from "@/components/candidate/CandidateActivityTimeline";
import { getCandidateContext } from "@/lib/candidate-context";
import { getCandidateApplicationActivities } from "@/lib/db/queries/shared/application-events";

export default async function AssessmentsPage() {
  const { candidate } = await getCandidateContext();
  const activities = await getCandidateApplicationActivities(candidate.id, ["assessment"]);
  return <CandidateActivityTimeline activities={activities} kind="assessment" />;
}
