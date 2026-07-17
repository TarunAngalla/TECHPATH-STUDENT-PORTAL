import { requireStaffAuth } from "@/lib/auth/guards";
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
  const stats = await getDashboardStats();

  return (
    <AdminDashboard
      staffName={staffDisplayName(session.email)}
      newLeads={stats.newLeads}
      activeCandidates={stats.activeCandidates}
      interviewsThisWeek={stats.interviewsThisWeek}
      unreadMessages={stats.unreadMessages}
      funnel={stats.funnel}
      workload={stats.workload}
      recentAudit={stats.recentAudit}
      recentMessages={stats.recentMessages}
      candidateNames={stats.candidateNames}
    />
  );
}
