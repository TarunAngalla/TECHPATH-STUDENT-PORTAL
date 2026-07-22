import { requireAdminAuth } from "@/lib/auth/guards";
import { getStaffScope } from "@/lib/auth/staff-scope";
import { getReportsData } from "@/lib/db/queries/admin/reports";
import { ReportsPage } from "@/components/admin/ReportsPage";

export default async function AdminReportsPage() {
  const session = await requireAdminAuth();
  const scope = getStaffScope(session);
  const data = await getReportsData(scope);

  return (
    <ReportsPage
      newLeads={data.newLeads}
      activeCandidates={data.activeCandidates}
      interviewsThisWeek={data.interviewsThisWeek}
      unreadMessages={data.unreadMessages}
      funnel={data.funnel}
      workload={data.workload}
      candidates={data.candidates}
    />
  );
}
