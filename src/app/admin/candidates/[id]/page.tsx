import { notFound } from "next/navigation";
import {
  getCandidateDetail,
  getRecruiters,
} from "@/lib/db/queries/admin/candidates";
import { getApplicationsByCandidateId } from "@/lib/db/queries/shared/applications";
import { getDocumentsByCandidateId } from "@/lib/db/queries/shared/documents";
import { getMessagesByCandidateId } from "@/lib/db/queries/shared/messages";
import {
  getTrainingCatalog,
  getTrainingsForCandidate,
} from "@/lib/db/queries/shared/trainings";
import { getPasswordChangeHistory } from "@/lib/db/queries/candidate/dashboard";
import { CandidateDetailPage } from "@/components/admin/CandidateDetailPage";

export default async function AdminCandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const candidate = await getCandidateDetail(id);
  if (!candidate) notFound();

  const [recruiters, applications, documents, trainings, trainingCatalog, messages, passwordHistory] =
    await Promise.all([
      getRecruiters(),
      getApplicationsByCandidateId(id),
      getDocumentsByCandidateId(id),
      getTrainingsForCandidate(id),
      getTrainingCatalog(),
      getMessagesByCandidateId(id),
      getPasswordChangeHistory(candidate.userId),
    ]);

  return (
    <CandidateDetailPage
      candidate={candidate}
      recruiters={recruiters}
      applications={applications}
      documents={documents}
      trainings={trainings}
      trainingCatalog={trainingCatalog}
      messages={messages}
      passwordHistory={passwordHistory}
    />
  );
}
