import { redirect } from "next/navigation";
import { requireCandidateAuth } from "@/lib/auth/guards";
import {
  getAnnouncementsForCandidate,
  getApplicationsForCandidate,
  getCandidateByUserId,
  getUnreadMessageCount,
} from "@/lib/db/queries/candidate";
import { CandidatePortalShell } from "@/components/candidate/CandidatePortalShell";

export default async function CandidatePortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireCandidateAuth();
  if (session.firstLogin) redirect("/reset-password");

  const candidate = await getCandidateByUserId(session.userId);

  if (!candidate) redirect("/login");

  const [messageBadge, announcements, applications] = await Promise.all([
    getUnreadMessageCount(candidate.id, session.userId),
    getAnnouncementsForCandidate(candidate.id),
    getApplicationsForCandidate(candidate.id),
  ]);

  const unreadAnnouncements = announcements.filter((a) => !a.isRead).length;

  return (
    <CandidatePortalShell
      candidateName={candidate.fullName}
      messageBadge={messageBadge}
      unreadAnnouncements={unreadAnnouncements}
      announcements={announcements}
      applications={applications}
    >
      {children}
    </CandidatePortalShell>
  );
}
