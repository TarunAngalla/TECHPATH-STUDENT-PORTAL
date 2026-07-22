export { getCandidateByUserId } from "./candidate/candidate-helpers";
export {
  getDashboardStatsForCandidate,
  getUnreadMessageCount,
  getAnnouncementsForCandidate,
  getLatestPasswordChange,
  getPasswordChangeHistory,
  getOnboardingChecklist,
} from "./candidate/dashboard";

// Re-export shared queries for backward compatibility
export { getCandidateVisibleApplicationsByCandidateId as getApplicationsForCandidate } from "./shared/applications";
export { getUpcomingByCandidateId as getUpcomingApplications } from "./shared/applications";
export { getDocumentsByCandidateId as getDocumentsForCandidate } from "./shared/documents";
