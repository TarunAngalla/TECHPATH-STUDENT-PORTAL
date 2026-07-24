import { requireStaffAuth } from "@/lib/auth/guards";
import { getStaffScope, staffPortalSubtitle } from "@/lib/auth/staff-scope";
import { getDashboardStats } from "@/lib/db/queries/admin/dashboard";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

function staffDisplayName(email: string) {
  const local = email.split("@")[0] ?? email;
  return local
    .split(/[._-]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function AdminDashboardPage() {
  const session = await requireStaffAuth();
  const scope = getStaffScope(session);
  const stats = await getDashboardStats(scope);

  return (
    <AdminDashboard
      staffName={staffDisplayName(session.email)}
      staffRole={scope.role}
      portalLabel={staffPortalSubtitle(scope.role)}
      newLeads={stats.newLeads}
      newLeadsTrend={stats.newLeadsTrend}
      consultations={stats.consultations}
      consultationsTrend={stats.consultationsTrend}
      activeCandidates={stats.activeCandidates}
      activeCandidatesTrend={stats.activeCandidatesTrend}
      ndasPending={stats.ndasPending}
      ndasPendingTrend={stats.ndasPendingTrend}
      interviewsThisWeek={stats.interviewsThisWeek}
      interviewsThisWeekTrend={stats.interviewsThisWeekTrend}
      recruitersAssigned={stats.recruitersAssigned}
      recruitersAssignedTrend={stats.recruitersAssignedTrend}
      marketingLiveTrend={stats.marketingLiveTrend}
      unreadMessages={stats.unreadMessages}
      marketingLiveZeroApps={stats.marketingLiveZeroApps}
      periodLabel={stats.periodLabel}
      funnel={stats.funnel}
      recentAudit={stats.recentAudit}
      recentMessages={stats.recentMessages}
      recentLeads={stats.recentLeads}
      assignments={stats.assignments}
      marketingProgress={stats.marketingProgress}
      weeklyTrend={stats.weeklyTrend}
      candidateNames={stats.candidateNames}
      exportRows={stats.exportRows}
    />
  );
}
