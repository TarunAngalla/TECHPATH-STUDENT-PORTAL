import { notFound } from "next/navigation";
import { ApplicationActivityManager } from "@/components/admin/ApplicationActivityManager";
import { requireStaffAuth } from "@/lib/auth/guards";
import { getStaffScope } from "@/lib/auth/staff-scope";
import { assertCandidateInScope, getCandidateDetail } from "@/lib/db/queries/admin/candidates";
import { getApplicationActivitiesForStaff } from "@/lib/db/queries/shared/application-events";
import { getApplicationById } from "@/lib/db/queries/shared/applications";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaffAuth();
  const { id } = await params;
  const application = await getApplicationById(id);
  if (!application || !(await assertCandidateInScope(application.candidateId, getStaffScope(session)))) notFound();
  const [events, candidate] = await Promise.all([getApplicationActivitiesForStaff(application.id), getCandidateDetail(application.candidateId, getStaffScope(session))]);
  if (!candidate) notFound();
  return <ApplicationActivityManager application={application} events={events} candidateName={candidate.fullName} />;
}
