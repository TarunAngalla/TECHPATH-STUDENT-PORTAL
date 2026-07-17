"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireCandidateAuth, requireStaffAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { getMessagesByCandidateId } from "@/lib/db/queries/shared/messages";
import { messageReads, messages } from "@/lib/db/schema";

const sendSchema = z.object({
  candidateId: z.string().uuid(),
  body: z.string().min(1),
});

export async function fetchCandidateMessages(candidateId: string) {
  const session = await requireCandidateAuth();
  if (session.candidateId !== candidateId) return { error: "Forbidden" as const };

  const rows = await getMessagesByCandidateId(candidateId);
  return {
    messages: rows.map((m) => ({
      id: m.id,
      senderRole: m.senderRole as "candidate" | "recruiter",
      body: m.body,
      sentAt: m.sentAt,
    })),
  };
}

export async function sendCandidateMessage(candidateId: string, body: string) {
  const session = await requireCandidateAuth();
  if (session.candidateId !== candidateId) return { error: "Forbidden" };

  const parsed = sendSchema.safeParse({ candidateId, body });
  if (!parsed.success) return { error: "Invalid message" };

  await db.insert(messages).values({
    candidateId,
    senderRole: "candidate",
    senderId: session.userId,
    body,
  });

  revalidatePath("/messages");
  revalidatePath(`/admin/candidates/${candidateId}`);
  return {};
}

export async function sendRecruiterMessage(candidateId: string, body: string) {
  const session = await requireStaffAuth();
  const parsed = sendSchema.safeParse({ candidateId, body });
  if (!parsed.success) return { error: "Invalid message" };

  await db.insert(messages).values({
    candidateId,
    senderRole: "recruiter",
    senderId: session.userId,
    body,
  });

  revalidatePath("/messages");
  revalidatePath(`/admin/candidates/${candidateId}`);
  return {};
}

export async function markMessagesRead(candidateId: string) {
  const session = await requireCandidateAuth();
  if (session.candidateId !== candidateId) return;

  const unread = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.candidateId, candidateId));

  for (const msg of unread) {
    await db
      .insert(messageReads)
      .values({ messageId: msg.id, userId: session.userId, candidateId })
      .onConflictDoNothing();
  }

  revalidatePath("/messages");
}
