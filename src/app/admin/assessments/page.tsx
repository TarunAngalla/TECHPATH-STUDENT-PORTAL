import { StaffActivityOverview } from "@/components/admin/StaffActivityOverview";
import { requireStaffAuth } from "@/lib/auth/guards";
import { getStaffScope } from "@/lib/auth/staff-scope";
import { getStaffActivities } from "@/lib/db/queries/admin/activities";

export default async function AdminAssessmentsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const session = await requireStaffAuth();
  const scope = getStaffScope(session);
  const filters = await searchParams;
  const data = await getStaffActivities(scope, "assessment", filters);
  return <StaffActivityOverview kind="assessment" rows={data.rows} metrics={data.metrics} query={filters.q} status={filters.status} scopedToRecruiter={!scope.seesAllCandidates} />;
}
