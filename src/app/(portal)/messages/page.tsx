import { CandidateMessagesPage } from "@/components/candidate/CandidateMessagesPage";
import { getCandidateContext } from "@/lib/candidate-context";
import { getMessagesByCandidateId } from "@/lib/db/queries/shared/messages";

export default async function MessagesPage() {
  const { candidate, recruiter } = await getCandidateContext();
  const messages = await getMessagesByCandidateId(candidate.id);

  return (
    <CandidateMessagesPage
      candidateId={candidate.id}
      recruiterName={recruiter?.name ?? "Your recruiter"}
      messages={messages.map((m) => ({
        id: m.id,
        senderRole: m.senderRole,
        body: m.body,
        sentAt: m.sentAt,
      }))}
    />
  );
}
