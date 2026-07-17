import { CandidateAnnouncementsFeed } from "@/components/candidate/CandidateAnnouncementsFeed";
import { getAnnouncementsForCandidate } from "@/lib/db/queries/candidate";
import { getCandidateContext } from "@/lib/candidate-context";

export default async function AnnouncementsPage() {
  const { candidate } = await getCandidateContext();
  const announcements = await getAnnouncementsForCandidate(candidate.id);

  return (
    <CandidateAnnouncementsFeed
      announcements={announcements}
      candidateId={candidate.id}
    />
  );
}
