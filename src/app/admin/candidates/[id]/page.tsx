import { notFound, redirect } from "next/navigation";
import { requireStaffAuth } from "@/lib/auth/guards";
import { getStaffScope } from "@/lib/auth/staff-scope";
import {
  getCandidateDetail,
  getRecruiters,
} from "@/lib/db/queries/admin/candidates";
import { getApplicationsByCandidateId } from "@/lib/db/queries/shared/applications";
import { getDocumentsByCandidateId } from "@/lib/db/queries/shared/documents";
import {
  getConversationMessages,
  markConversationMessagesRead,
} from "@/lib/db/queries/shared/messages";
import {
  getTrainingCatalog,
  getTrainingsForCandidate,
} from "@/lib/db/queries/shared/trainings";
import { getPasswordChangeHistory } from "@/lib/db/queries/candidate/dashboard";
import { CandidateDetailPage } from "@/components/admin/CandidateDetailPage";

const VALID_TABS = [
  "Profile",
  "Applications",
  "Documents",
  "Trainings",
  "Messages",
  "Account & Security",
] as const;

type DetailTab = (typeof VALID_TABS)[number];

export default async function AdminCandidateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireStaffAuth();
  const scope = getStaffScope(session);
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const candidate = await getCandidateDetail(id, scope);
  if (!candidate) notFound();

  if (!scope.seesAllCandidates && candidate.recruiterId !== scope.userId) {
    redirect("/admin/candidates");
  }

  // Mark read
  await markConversationMessagesRead(candidate.userId, session.userId);

  const [recruiters, applications, documents, trainings, trainingCatalog, messages, passwordHistory] =
    await Promise.all([
      getRecruiters(),
      getApplicationsByCandidateId(id),
      getDocumentsByCandidateId(id),
      getTrainingsForCandidate(id),
      getTrainingCatalog(),
      getConversationMessages(candidate.userId, session.userId),
      getPasswordChangeHistory(candidate.userId),
    ]);

  const mappedMessages = messages.map((m) => ({
    id: m.id,
    senderRole: m.senderId === session.userId ? ("recruiter" as const) : ("candidate" as const),
    body: m.body,
    sentAt: m.sentAt,
  }));

  const resolvedTab: DetailTab =
    tabParam && (VALID_TABS as readonly string[]).includes(tabParam)
      ? (tabParam as DetailTab)
      : mappedMessages.some((m) => m.senderRole === "candidate")
        ? "Messages"
        : "Profile";

  return (
    <CandidateDetailPage
      candidate={candidate}
      recruiters={recruiters}
      applications={applications}
      documents={documents}
      trainings={trainings}
      trainingCatalog={trainingCatalog}
      messages={mappedMessages}
      passwordHistory={passwordHistory}
      canReassignRecruiter={scope.seesAllCandidates}
      initialTab={resolvedTab}
    />
  );
}
