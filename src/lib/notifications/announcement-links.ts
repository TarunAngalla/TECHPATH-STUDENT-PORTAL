/** Where a notification should take the candidate when clicked. */
export function hrefForAnnouncement(title: string, announcementId?: string) {
  const lower = title.toLowerCase();
  if (lower.includes("interview")) return "/interview-details";
  if (lower.includes("assessment")) return "/assessments";
  if (lower.includes("application")) return "/applications";
  if (announcementId) return `/announcements#${announcementId}`;
  return "/announcements";
}
