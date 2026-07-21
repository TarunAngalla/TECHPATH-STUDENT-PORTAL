import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getCandidateAccessState } from "@/lib/auth/candidate-access";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { candidates, documents, users } from "@/lib/db/schema";
import { getSignedDownloadUrl } from "@/lib/storage/supabase";

export async function GET(_request: NextRequest, context: { params: Promise<{ documentId: string }> }) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { documentId } = await context.params;
  const [record] = await db.select({
    candidateId: documents.candidateId, storagePath: documents.storagePath, fileUrl: documents.fileUrl,
    candidateUserId: candidates.userId, recruiterId: candidates.recruiterId,
  }).from(documents).innerJoin(candidates, eq(candidates.id, documents.candidateId))
    .where(eq(documents.id, documentId)).limit(1);
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [dbUser] = await db.select({ role: users.role, sessionVersion: users.sessionVersion, accountState: users.accountState })
    .from(users).where(eq(users.id, session.userId)).limit(1);
  if (!dbUser || session.sessionVersion !== dbUser.sessionVersion || session.role !== dbUser.role || dbUser.accountState === "suspended") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let candidateAllowed = false;
  if (dbUser.role === "candidate") {
    const access = await getCandidateAccessState(session.userId);
    candidateAllowed =
      access?.state === "PORTAL_ACTIVE" &&
      session.candidateId === record.candidateId &&
      session.userId === record.candidateUserId;
  }
  const staffAllowed = dbUser.role === "admin" || (dbUser.role === "recruiter" && record.recruiterId === session.userId);
  if (!candidateAllowed && !staffAllowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try { return NextResponse.redirect(await getSignedDownloadUrl(record.storagePath ?? record.fileUrl, 300)); }
  catch { return NextResponse.json({ error: "Document is unavailable" }, { status: 404 }); }
}
