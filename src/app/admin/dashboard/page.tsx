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
      portalLabel={staffPortalSubtitle(scope.role)}
      newLeads={stats.newLeads}
      consultations={stats.consultations}
      activeCandidates={stats.activeCandidates}
      marketingLive={stats.marketingLive}
      interviewsThisWeek={stats.interviewsThisWeek}
      interviewsInProgress={stats.interviewsInProgress}
      recruitersAssigned={stats.recruitersAssigned}
      unreadMessages={stats.unreadMessages}
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
