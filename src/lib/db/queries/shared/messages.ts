import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { messageReads, messages } from "@/lib/db/schema";

export async function getMessagesByCandidateId(candidateId: string) {
  return db
    .select()
    .from(messages)
    .where(eq(messages.candidateId, candidateId))
    .orderBy(messages.sentAt);
}

export async function getUnreadMessageCountForCandidate(candidateId: string, userId: string) {
  const recruiterMessages = await db
    .select({ id: messages.id })
    .from(messages)
    .where(and(eq(messages.candidateId, candidateId), eq(messages.senderRole, "recruiter")));

  if (recruiterMessages.length === 0) return 0;

  const read = await db
    .select({ messageId: messageReads.messageId })
    .from(messageReads)
    .where(and(eq(messageReads.userId, userId), eq(messageReads.candidateId, candidateId)));

  const readSet = new Set(read.map((r) => r.messageId));
  return recruiterMessages.filter((m) => !readSet.has(m.id)).length;
}

export async function getUnreadMessageCountForStaff() {
  const candidateMessages = await db
    .select({ id: messages.id })
    .from(messages)
    .where(eq(messages.senderRole, "candidate"));

  return candidateMessages.length;
}
