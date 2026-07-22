import { requireStaffAuth } from "@/lib/auth/guards";
import { getStaffScope } from "@/lib/auth/staff-scope";
import { getCandidatesList } from "@/lib/db/queries/admin/candidates";
import { CandidatesTable } from "@/components/admin/CandidatesTable";

export default async function AdminCandidatesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await requireStaffAuth();
  const filters = await searchParams;
  const scope = getStaffScope(session);
  const candidates = await getCandidatesList(scope);

  return (
    <CandidatesTable
      candidates={candidates}
      scopedToRecruiter={!scope.seesAllCandidates}
      initialQuery={filters.q ?? ""}
    />
  );
}
