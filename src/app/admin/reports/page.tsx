import { getReportsData } from "@/lib/db/queries/admin/reports";
import { ReportsPage } from "@/components/admin/ReportsPage";

export default async function AdminReportsPage() {
  const data = await getReportsData();

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
