import { getAllAnnouncements } from "@/lib/db/queries/shared/announcements";
import { getCandidatesList } from "@/lib/db/queries/admin/candidates";
import { AnnouncementsComposer } from "@/components/admin/AnnouncementsComposer";

export default async function AdminAnnouncementsPage() {
  const [announcements, candidates] = await Promise.all([
    getAllAnnouncements(),
    getCandidatesList(),
  ]);

  return (
    <AnnouncementsComposer
      announcements={announcements}
      candidates={candidates.map((c) => ({ id: c.id, fullName: c.fullName }))}
    />
  );
}
