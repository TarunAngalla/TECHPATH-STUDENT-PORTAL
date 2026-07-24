import { requireAdminAuth } from "@/lib/auth/guards";
import { getStaffScope } from "@/lib/auth/staff-scope";
import {
  getAssignmentWorkQueue,
  getRecruiterWorkloads,
  getUnassignedCandidates,
} from "@/lib/db/queries/admin/assignments";
import { RecruiterAssignmentsPage } from "@/components/admin/RecruiterAssignmentsPage";
import { resolveAvatarUrl } from "@/lib/storage/avatars";

export default async function AdminAssignmentsPage() {
  const session = await requireAdminAuth();
  const scope = getStaffScope(session);
  const [workloads, workQueueRaw, unassigned] = await Promise.all([
    getRecruiterWorkloads(scope),
    getAssignmentWorkQueue(scope),
    getUnassignedCandidates(),
  ]);

  const workQueue = await Promise.all(
    workQueueRaw.map(async (row) => ({
      ...row,
      avatarUrl: await resolveAvatarUrl(row.candidateAvatarPath),
    })),
  );

  return (
    <RecruiterAssignmentsPage
      workloads={workloads}
      workQueue={workQueue}
      unassigned={unassigned}
      isAdmin
    />
  );
}
