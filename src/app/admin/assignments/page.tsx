import { requireStaffAuth } from "@/lib/auth/guards";
import { getStaffScope } from "@/lib/auth/staff-scope";
import {
  getAssignmentWorkQueue,
  getRecruiterWorkloads,
  getUnassignedCandidates,
} from "@/lib/db/queries/admin/assignments";
import { RecruiterAssignmentsPage } from "@/components/admin/RecruiterAssignmentsPage";

export default async function AdminAssignmentsPage() {
  const session = await requireStaffAuth();
  const scope = getStaffScope(session);
  const [workloads, workQueue, unassigned] = await Promise.all([
    getRecruiterWorkloads(scope),
    getAssignmentWorkQueue(scope),
    scope.seesAllCandidates ? getUnassignedCandidates() : Promise.resolve([]),
  ]);

  return (
    <RecruiterAssignmentsPage
      workloads={workloads}
      workQueue={workQueue}
      unassigned={unassigned}
      isAdmin={scope.seesAllCandidates}
    />
  );
}
