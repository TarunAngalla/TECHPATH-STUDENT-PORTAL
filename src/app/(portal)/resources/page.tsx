import { CandidateResourcesPage } from "@/components/candidate/CandidateResourcesPage";
import { getCandidateContext } from "@/lib/candidate-context";
import { getDocumentsForCandidate } from "@/lib/db/queries/candidate";
import { groupDocumentsBySection } from "@/lib/db/queries/shared/documents";

export default async function ResourcesPage() {
  const { candidate } = await getCandidateContext();
  const documents = await getDocumentsForCandidate(candidate.id);
  const sections = groupDocumentsBySection(documents, candidate.optType);
  return <CandidateResourcesPage sections={sections} />;
}
