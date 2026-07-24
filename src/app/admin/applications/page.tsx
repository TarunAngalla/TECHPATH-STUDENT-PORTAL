import { AdminApplicationsOverview } from "@/components/admin/AdminApplicationsOverview";
import { requireStaffAuth } from "@/lib/auth/guards";
import { getStaffScope } from "@/lib/auth/staff-scope";
import {
  getApplicationOperationalMetrics,
  getStaffApplications,
} from "@/lib/db/queries/admin/applications";
import { getStaffCandidateOptions } from "@/lib/db/queries/admin/candidates";

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const session = await requireStaffAuth();
  const filters = await searchParams;
  const scope = getStaffScope(session);
  const [applications, metrics, candidates] = await Promise.all([
    getStaffApplications(scope, { query: filters.q, status: filters.status }),
    getApplicationOperationalMetrics(scope),
    getStaffCandidateOptions(scope),
  ]);
  return (
    <AdminApplicationsOverview
      applications={applications}
      metrics={metrics}
      candidates={candidates}
    />
  );
}
