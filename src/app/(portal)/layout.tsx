import { redirect } from "next/navigation";
import { requireCandidatePortalAccess } from "@/lib/auth/guards";
import {
  getAnnouncementsForCandidate,
  getApplicationsForCandidate,
  getCandidateByUserId,
  getUnreadMessageCount,
} from "@/lib/db/queries/candidate";
import { getCandidateActivityNavBadges } from "@/lib/db/queries/candidate/activity-nav";
import { CandidatePortalShell } from "@/components/candidate/CandidatePortalShell";
import { resolveAvatarUrl } from "@/lib/storage/avatars";

export default async function CandidatePortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireCandidatePortalAccess();

  const candidate = await getCandidateByUserId(session.userId);

  if (!candidate) redirect("/login");

  const [messageBadge, announcements, applications, activityBadges] = await Promise.all([
    getUnreadMessageCount(candidate.id, session.userId),
    getAnnouncementsForCandidate(candidate.id),
    getApplicationsForCandidate(candidate.id),
    getCandidateActivityNavBadges(candidate.id),
  ]);

  const unreadAnnouncements = announcements.filter((a) => !a.isRead).length;

  return (
    <CandidatePortalShell
      candidateName={candidate.fullName}
      candidateAvatarUrl={await resolveAvatarUrl(candidate.avatarPath)}
      candidateId={candidate.id}
      messageBadge={messageBadge}
      unreadAnnouncements={unreadAnnouncements}
      announcements={announcements}
      applications={applications}
      activityBadges={activityBadges}
    >
      {children}
    </CandidatePortalShell>
  );
}
