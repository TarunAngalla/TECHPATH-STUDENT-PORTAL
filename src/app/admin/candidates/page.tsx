import { getCandidatesList } from "@/lib/db/queries/admin/candidates";
import { CandidatesTable } from "@/components/admin/CandidatesTable";

export default async function AdminCandidatesPage() {
  const candidates = await getCandidatesList();

  return <CandidatesTable candidates={candidates} />;
}
