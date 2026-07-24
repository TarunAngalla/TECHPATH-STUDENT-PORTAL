export type ThreadLatestMessage = {
  body: string;
  sentAt: Date | string;
  senderId: string;
};

export type ThreadListItem = {
  id: string;
  latestMessage: ThreadLatestMessage | null;
  unreadCount: number;
};

export function sortThreadsByLatest<T extends ThreadListItem>(threads: T[]): T[] {
  return [...threads].sort((a, b) => {
    if (a.latestMessage && b.latestMessage) {
      return (
        new Date(b.latestMessage.sentAt).getTime() - new Date(a.latestMessage.sentAt).getTime()
      );
    }
    if (a.latestMessage) return -1;
    if (b.latestMessage) return 1;
    return 0;
  });
}

/** Update one thread's preview (and optionally unread) after send/poll, then re-sort. */
export function withUpdatedThreadPreview<T extends ThreadListItem>(
  threads: T[],
  partnerId: string,
  latestMessage: ThreadLatestMessage,
  options?: { unreadCount?: number },
): T[] {
  return sortThreadsByLatest(
    threads.map((t) =>
      t.id === partnerId
        ? {
            ...t,
            latestMessage,
            unreadCount: options?.unreadCount ?? t.unreadCount,
          }
        : t,
    ),
  );
}
