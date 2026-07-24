import { and, eq, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { candidateNdaAgreements, candidates, users } from "@/lib/db/schema";
import { getSignedDownloadUrl } from "@/lib/storage/supabase";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ agreementId: string }> },
) {
  const session = await getCurrentUser();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { agreementId } = await context.params;

  const [dbUser] = await db
    .select({ role: users.role, sessionVersion: users.sessionVersion, accountState: users.accountState })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (
    !dbUser ||
    session.sessionVersion !== dbUser.sessionVersion ||
    session.role !== dbUser.role ||
    dbUser.accountState === "suspended"
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [record] = await db
    .select({
      candidateId: candidateNdaAgreements.candidateId,
      candidateUserId: candidates.userId,
      signedDocumentPath: candidateNdaAgreements.signedDocumentPath,
      status: candidateNdaAgreements.status,
    })
    .from(candidateNdaAgreements)
    .innerJoin(candidates, eq(candidates.id, candidateNdaAgreements.candidateId))
    .where(
      and(
        eq(candidateNdaAgreements.id, agreementId),
        or(
          eq(candidateNdaAgreements.status, "signed"),
          eq(candidateNdaAgreements.status, "superseded"),
        ),
      ),
    )
    .limit(1);
  if (!record || !record.signedDocumentPath) {
    return NextResponse.json({ error: "Signed NDA not found" }, { status: 404 });
  }

  const candidateAllowed =
    dbUser.role === "candidate" &&
    session.userId === record.candidateUserId &&
    session.candidateId === record.candidateId;
  const adminAllowed = dbUser.role === "admin";
  if (!candidateAllowed && !adminAllowed) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    return NextResponse.redirect(await getSignedDownloadUrl(record.signedDocumentPath, 300));
  } catch {
    return NextResponse.json({ error: "Signed NDA is unavailable" }, { status: 404 });
  }
}
