import { requireStaffAuth } from "@/lib/auth/guards";
import {
  getChatThreads,
  getConversationMessages,
} from "@/lib/db/queries/shared/messages";
import { AdminMessagesPage } from "@/components/admin/AdminMessagesPage";

export default async function AdminMessagesRoute({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await requireStaffAuth();

  // Fetch all threads
  const threads = await getChatThreads(session.userId, session.role);

  // Determine active selected partner ID
  const resolvedParams = await searchParams;
  let partnerId = typeof resolvedParams.partnerId === "string" ? resolvedParams.partnerId : null;

  // Fallback to first active thread if none selected
  if (!partnerId && threads.length > 0) {
    partnerId = threads[0].id;
  }

  // Fetch messages if thread is selected
  const messages = partnerId
    ? await getConversationMessages(session.userId, partnerId)
    : [];

  return (
    <AdminMessagesPage
      threads={threads}
      selectedPartnerId={partnerId}
      initialMessages={messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        body: m.body,
        sentAt: m.sentAt,
        seenAt: m.seenAt,
      }))}
      currentUserId={session.userId}
    />
  );
}
