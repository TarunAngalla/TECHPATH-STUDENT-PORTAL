/**
 * Cross-role consistency contract.
 * Single source of truth: shared Postgres rows read/written by Admin, Recruiter, and Candidate UIs.
 *
 * Verified write → revalidate pairs:
 * - applications status/comment/upcoming → Candidate Applications + Upcoming + Dashboard
 * - candidates.journeyStage / recruiterId → Candidate Dashboard + Progress
 * - messages → both Message threads / unread badges
 * - documents / trainings / announcements → Candidate lists
 *
 * Smoke checklist (manual):
 * 1. Admin updates application status → candidate Applications reflects same status
 * 2. Either side edits application comment → other side sees identical text
 * 3. Admin sets journey stage → candidate Progress stepper updates
 * 4. Recruiter (scoped) cannot open unassigned candidate detail
 * 5. Recruiter message ↔ candidate Messages are the same thread
 * 6. Assign training / publish announcement → candidate Trainings / Announcements update
 * 7. Create candidate from lead → firstLogin forced reset + credentials email/log
 */

export const CROSS_ROLE_ENTITIES = [
  "applications",
  "candidates",
  "messages",
  "documents",
  "candidate_trainings",
  "announcements",
] as const;
