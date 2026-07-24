import { and, eq, or, desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { messageReads, messages, users, candidates } from "@/lib/db/schema";
import { resolveAvatarUrl } from "@/lib/storage/avatars";

export async function getConversationMessages(userAId: string, userBId: string) {
  const rows = await db
    .select()
    .from(messages)
    .where(
      or(
        and(eq(messages.senderId, userAId), eq(messages.receiverId, userBId)),
        and(eq(messages.senderId, userBId), eq(messages.receiverId, userAId)),
      ),
    )
    .orderBy(messages.sentAt);

  if (rows.length === 0) return [];

  const reads = await db
    .select({
      messageId: messageReads.messageId,
      userId: messageReads.userId,
      readAt: messageReads.readAt,
    })
    .from(messageReads)
    .where(
      inArray(
        messageReads.messageId,
        rows.map((r) => r.id),
      ),
    );

  const seenByReceiver = new Map<string, Date>();
  for (const row of rows) {
    const read = reads.find((r) => r.messageId === row.id && r.userId === row.receiverId);
    if (read) seenByReceiver.set(row.id, read.readAt);
  }

  return rows.map((m) => ({
    ...m,
    /** When the receiver opened/read this message */
    seenAt: seenByReceiver.get(m.id) ?? null,
  }));
}

export async function markConversationMessagesRead(partnerId: string, currentUserId: string) {
  const received = await db
    .select({ id: messages.id })
    .from(messages)
    .where(and(eq(messages.senderId, partnerId), eq(messages.receiverId, currentUserId)));

  if (received.length === 0) return 0;

  const read = await db
    .select({ messageId: messageReads.messageId })
    .from(messageReads)
    .where(eq(messageReads.userId, currentUserId));

  const readSet = new Set(read.map((r) => r.messageId));
  const unread = received.filter((m) => !readSet.has(m.id));

  for (const msg of unread) {
    await db
      .insert(messageReads)
      .values({ messageId: msg.id, userId: currentUserId })
      .onConflictDoNothing();
  }

  return unread.length;
}

export async function getUnreadMessageCount(currentUserId: string, partnerId?: string) {
  const filter = partnerId
    ? and(eq(messages.receiverId, currentUserId), eq(messages.senderId, partnerId))
    : eq(messages.receiverId, currentUserId);

  const receivedMessages = await db
    .select({ id: messages.id })
    .from(messages)
    .where(filter);

  if (receivedMessages.length === 0) return 0;

  const read = await db
    .select({ messageId: messageReads.messageId })
    .from(messageReads)
    .where(eq(messageReads.userId, currentUserId));

  const readSet = new Set(read.map((r) => r.messageId));
  return receivedMessages.filter((m) => !readSet.has(m.id)).length;
}

export async function getChatThreads(currentUserId: string, currentUserRole: string) {
  const partnerUsers: {
    id: string;
    email: string;
    role: string;
    fullName?: string;
    avatarPath?: string | null;
  }[] = [];

  if (currentUserRole === "candidate") {
    // 1. Get the admin
    const admins = await db
      .select({ id: users.id, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);
    if (admins.length > 0) {
      partnerUsers.push({ ...admins[0], fullName: "System Admin" });
    }

    // 2. Get the assigned recruiter
    const [cand] = await db
      .select()
      .from(candidates)
      .where(eq(candidates.userId, currentUserId))
      .limit(1);
    if (cand?.recruiterId) {
      const [recruiter] = await db
        .select({ id: users.id, email: users.email, role: users.role })
        .from(users)
        .where(eq(users.id, cand.recruiterId))
        .limit(1);
      if (recruiter) {
        const local = recruiter.email.split("@")[0] ?? "Recruiter";
        const recruiterName = local.replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        partnerUsers.push({ ...recruiter, fullName: recruiterName });
      }
    }
  } else if (currentUserRole === "recruiter") {
    // 1. Get the admin
    const admins = await db
      .select({ id: users.id, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(1);
    if (admins.length > 0) {
      partnerUsers.push({ ...admins[0], fullName: "System Admin" });
    }

    // 2. Get assigned candidates
    const assignedCands = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        fullName: candidates.fullName,
        avatarPath: candidates.avatarPath,
      })
      .from(candidates)
      .innerJoin(users, eq(users.id, candidates.userId))
      .where(eq(candidates.recruiterId, currentUserId));

    partnerUsers.push(...assignedCands);
  } else if (currentUserRole === "admin") {
    // Admin can message any recruiter or candidate with a portal account.
    const recruiters = await db
      .select({ id: users.id, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.role, "recruiter"));

    for (const u of recruiters) {
      const local = u.email.split("@")[0] ?? "Recruiter";
      partnerUsers.push({
        ...u,
        fullName: local.replace(/\./g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      });
    }

    const candRows = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        fullName: candidates.fullName,
        avatarPath: candidates.avatarPath,
      })
      .from(candidates)
      .innerJoin(users, eq(users.id, candidates.userId));

    partnerUsers.push(...candRows);
  }

  const threads = [];
  for (const p of partnerUsers) {
    const [latest] = await db
      .select()
      .from(messages)
      .where(
        or(
          and(eq(messages.senderId, currentUserId), eq(messages.receiverId, p.id)),
          and(eq(messages.receiverId, currentUserId), eq(messages.senderId, p.id)),
        ),
      )
      .orderBy(desc(messages.sentAt))
      .limit(1);

    const unreadCount = await getUnreadMessageCount(currentUserId, p.id);

    threads.push({
      id: p.id,
      fullName: p.fullName || p.email,
      email: p.email,
      role: p.role,
      avatarUrl: await resolveAvatarUrl(p.avatarPath),
      latestMessage: latest
        ? {
            body: latest.body,
            sentAt: latest.sentAt,
            senderId: latest.senderId,
          }
        : null,
      unreadCount,
    });
  }

  return threads.sort((a, b) => {
    if (a.latestMessage && b.latestMessage) {
      return new Date(b.latestMessage.sentAt).getTime() - new Date(a.latestMessage.sentAt).getTime();
    }
    if (a.latestMessage) return -1;
    if (b.latestMessage) return 1;
    return a.fullName.localeCompare(b.fullName);
  });
}
