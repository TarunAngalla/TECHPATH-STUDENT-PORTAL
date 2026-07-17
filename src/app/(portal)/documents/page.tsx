import { CandidateDocumentsPage } from "@/components/candidate/CandidateDocumentsPage";
import { getDocumentsForCandidate } from "@/lib/db/queries/candidate";
import { groupDocumentsBySection } from "@/lib/db/queries/shared/documents";
import { getCandidateContext } from "@/lib/candidate-context";

export default async function DocumentsPage() {
  const { candidate } = await getCandidateContext();
  const documents = await getDocumentsForCandidate(candidate.id);
  const sections = groupDocumentsBySection(documents, candidate.optType);

  return <CandidateDocumentsPage sections={sections} />;
}
