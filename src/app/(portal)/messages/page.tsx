import { CandidateMessagesPage } from "@/components/candidate/CandidateMessagesPage";
import { requireCandidateAuth } from "@/lib/auth/guards";
import {
  getChatThreads,
  getConversationMessages,
} from "@/lib/db/queries/shared/messages";

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ partnerId?: string }>;
}) {
  const session = await requireCandidateAuth();
  const threads = await getChatThreads(session.userId, "candidate");

  const resolvedParams = await searchParams;
  let partnerId = resolvedParams.partnerId ?? null;

  if (!partnerId && threads.length > 0) {
    partnerId = threads[0].id;
  }

  const messages = partnerId
    ? await getConversationMessages(session.userId, partnerId)
    : [];

  return (
    <CandidateMessagesPage
      threads={threads}
      selectedPartnerId={partnerId}
      initialMessages={messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        body: m.body,
        sentAt: m.sentAt,
      }))}
      currentUserId={session.userId}
    />
  );
}
