import { LeadsTable } from "@/components/admin/LeadsTable";
import { requireAdminAuth } from "@/lib/auth/guards";
import { getOrgEmailDomain } from "@/lib/config/org";
import { getRecruiters } from "@/lib/db/queries/admin/candidates";
import { getConsultationLeads } from "@/lib/db/queries/admin/leads";

export default async function AdminConsultationsPage() {
  await requireAdminAuth();
  const [leads, recruiters] = await Promise.all([getConsultationLeads(), getRecruiters()]);
  const emailDomain = getOrgEmailDomain();
  return (
    <LeadsTable
      leads={leads}
      recruiters={recruiters}
      view="consultations"
      emailDomain={emailDomain}
    />
  );
}
