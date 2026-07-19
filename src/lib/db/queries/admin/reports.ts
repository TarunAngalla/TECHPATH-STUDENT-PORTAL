import type { StaffScope } from "@/lib/auth/staff-scope";
import { getDashboardStats } from "./dashboard";
import { getCandidatesList } from "./candidates";

export async function getReportsData(scope?: StaffScope) {
  const stats = await getDashboardStats(scope);
  const candidates = await getCandidatesList(scope);
  return {
    newLeads: stats.newLeads,
    activeCandidates: stats.activeCandidates,
    interviewsThisWeek: stats.interviewsThisWeek,
    unreadMessages: stats.unreadMessages,
    funnel: {
      enquiries: stats.funnel.enquiries,
      consultations: stats.funnel.consultations,
      active: stats.funnel.portalAccess,
      placed: stats.funnel.placed,
    },
    workload: stats.workload,
    candidates,
  };
}
