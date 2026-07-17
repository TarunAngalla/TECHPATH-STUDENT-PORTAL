import { getLeads } from "@/lib/db/queries/admin/leads";
import { getRecruiters } from "@/lib/db/queries/admin/candidates";
import { LeadsTable } from "@/components/admin/LeadsTable";

export default async function AdminLeadsPage() {
  const [leads, recruiters] = await Promise.all([getLeads(), getRecruiters()]);

  return <LeadsTable leads={leads} recruiters={recruiters} />;
}
