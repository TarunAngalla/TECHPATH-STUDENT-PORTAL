import { CandidateActivityTimeline } from "@/components/candidate/CandidateActivityTimeline";
import { MarkActivitySectionViewed } from "@/components/candidate/MarkActivitySectionViewed";
import { getCandidateContext } from "@/lib/candidate-context";
import { getCandidateApplicationActivities } from "@/lib/db/queries/shared/application-events";

export default async function InterviewDetailsPage() {
  const { candidate } = await getCandidateContext();
  const activities = await getCandidateApplicationActivities(candidate.id, ["interview"]);
  return (
    <>
      <MarkActivitySectionViewed section="interview" />
      <CandidateActivityTimeline activities={activities} kind="interview" />
    </>
  );
}
