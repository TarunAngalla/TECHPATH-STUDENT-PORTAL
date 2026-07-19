import { requireStaffAuth } from "@/lib/auth/guards";
import { getStaffScope } from "@/lib/auth/staff-scope";
import { getAllAnnouncements } from "@/lib/db/queries/shared/announcements";
import { getCandidatesList } from "@/lib/db/queries/admin/candidates";
import { AnnouncementsComposer } from "@/components/admin/AnnouncementsComposer";

export default async function AdminAnnouncementsPage() {
  const session = await requireStaffAuth();
  const scope = getStaffScope(session);
  const [announcements, candidates] = await Promise.all([
    getAllAnnouncements(),
    getCandidatesList(scope),
  ]);

  return (
    <AnnouncementsComposer
      announcements={announcements}
      candidates={candidates.map((c) => ({ id: c.id, fullName: c.fullName }))}
      requireTarget={!scope.seesAllCandidates}
    />
  );
}
