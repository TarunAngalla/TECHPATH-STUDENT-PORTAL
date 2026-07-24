"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  requireAuth,
  requireCandidatePortalAccess,
  requireStaffAuth,
} from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  getChatThreads,
  getConversationMessages,
  getUnreadMessageCount,
  markConversationMessagesRead,
} from "@/lib/db/queries/shared/messages";
import { candidates, messages, users } from "@/lib/db/schema";
import type { UserRole } from "@/lib/auth/session-config";

async function requireMessagingSession() {
  const session = await requireAuth();
  if (session.role === "candidate") {
    return requireCandidatePortalAccess();
  }
  if (session.role === "recruiter" || session.role === "admin") {
    return requireStaffAuth();
  }
  return session;
}

const sendSchema = z.object({
  receiverId: z.string().uuid(),
  body: z.string().min(1),
});

async function validateMessagingPermission(senderId: string, senderRole: string, receiverId: string) {
  const [receiver] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, receiverId))
    .limit(1);

  if (!receiver) return false;

  if (senderRole === "candidate") {
    if (receiver.role === "admin") return true;
    if (receiver.role === "recruiter") {
      const [cand] = await db
        .select({ recruiterId: candidates.recruiterId })
        .from(candidates)
        .where(eq(candidates.userId, senderId))
        .limit(1);
      return cand?.recruiterId === receiver.id;
    }
    return false;
  }

  if (senderRole === "recruiter") {
    if (receiver.role === "admin") return true;
    if (receiver.role === "candidate") {
      const [cand] = await db
        .select({ id: candidates.id })
        .from(candidates)
        .where(and(eq(candidates.userId, receiver.id), eq(candidates.recruiterId, senderId)))
        .limit(1);
      return !!cand;
    }
    return false;
  }

  if (senderRole === "admin") {
    return receiver.role === "candidate" || receiver.role === "recruiter";
  }

  return false;
}

export async function fetchConversation(partnerId: string) {
  const session = await requireMessagingSession();
  const allowed = await validateMessagingPermission(
    session.userId,
    session.role as UserRole,
    partnerId,
  );
  if (!allowed) return { error: "Forbidden" as const };

  const rows = await getConversationMessages(session.userId, partnerId);
  return {
    messages: rows.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      receiverId: m.receiverId,
      body: m.body,
      sentAt: m.sentAt,
      seenAt: m.seenAt,
    })),
  };
}

export async function sendMessageAction(receiverId: string, body: string) {
  const session = await requireMessagingSession();
  const parsed = sendSchema.safeParse({ receiverId, body });
  if (!parsed.success) return { error: "Invalid message" };

  const allowed = await validateMessagingPermission(
    session.userId,
    session.role as UserRole,
    receiverId,
  );
  if (!allowed) return { error: "Forbidden" };

  await db.insert(messages).values({
    senderId: session.userId,
    receiverId,
    body,
  });

  revalidatePath("/messages");
  revalidatePath("/admin/messages");
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  return {};
}

export async function markConversationReadAction(partnerId: string) {
  const session = await requireMessagingSession();
  const allowed = await validateMessagingPermission(
    session.userId,
    session.role as UserRole,
    partnerId,
  );
  if (!allowed) return { marked: 0 };

  const marked = await markConversationMessagesRead(partnerId, session.userId);
  if (marked > 0) {
    revalidatePath("/messages");
    revalidatePath("/admin/messages");
    revalidatePath("/", "layout");
    revalidatePath("/admin", "layout");
  }
  return { marked };
}

export async function getUnreadMessagesCountAction() {
  const session = await requireMessagingSession();
  const count = await getUnreadMessageCount(session.userId);
  return { count };
}

export async function getChatThreadsAction() {
  const session = await requireMessagingSession();
  const threads = await getChatThreads(session.userId, session.role);
  return { threads };
}
