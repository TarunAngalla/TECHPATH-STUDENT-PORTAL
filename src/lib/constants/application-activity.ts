import type { ApplicationStatus } from "./status-meta";

export const INTERVIEW_ACTIVITY_TYPES = [
  "recruiter_screening",
  "hr_interview",
  "technical_interview",
  "managerial_interview",
  "client_interview",
  "behavioral_interview",
  "final_interview",
  "other",
] as const;

export const ASSESSMENT_ACTIVITY_TYPES = [
  "coding_test",
  "technical_test",
  "aptitude_test",
  "take_home_assignment",
  "personality_test",
  "language_test",
  "client_assessment",
  "other",
] as const;

export const APPLICATION_EVENT_STATUSES = [
  "pending",
  "assigned",
  "scheduled",
  "confirmed",
  "in_progress",
  "submitted",
  "completed",
  "cancelled",
  "rescheduled",
  "no_show",
  "feedback_pending",
  "result_pending",
  "expired",
  "passed",
  "failed",
] as const;

export type ApplicationEventStatus = (typeof APPLICATION_EVENT_STATUSES)[number];
export type InterviewActivityType = (typeof INTERVIEW_ACTIVITY_TYPES)[number];
export type AssessmentActivityType = (typeof ASSESSMENT_ACTIVITY_TYPES)[number];

export const INTERVIEW_COMPLETED_STATUSES: ApplicationEventStatus[] = [
  "completed",
  "feedback_pending",
  "passed",
  "failed",
];

export const ASSESSMENT_COMPLETED_STATUSES: ApplicationEventStatus[] = [
  "completed",
  "result_pending",
  "passed",
  "failed",
];

export const UPCOMING_EVENT_STATUSES: ApplicationEventStatus[] = ["scheduled", "confirmed", "rescheduled"];

export const CLOSED_APPLICATION_STATUSES: ApplicationStatus[] = [
  "hired",
  "rejected",
  "withdrawn",
  "closed",
];

export const INTERVIEW_TYPE_LABELS: Record<InterviewActivityType, string> = {
  recruiter_screening: "Recruiter screening",
  hr_interview: "HR interview",
  technical_interview: "Technical interview",
  managerial_interview: "Managerial interview",
  client_interview: "Client interview",
  behavioral_interview: "Behavioral interview",
  final_interview: "Final interview",
  other: "Interview",
};

export const ASSESSMENT_TYPE_LABELS: Record<AssessmentActivityType, string> = {
  coding_test: "Coding test",
  technical_test: "Technical assessment",
  aptitude_test: "Aptitude test",
  take_home_assignment: "Take-home assignment",
  personality_test: "Personality assessment",
  language_test: "Language assessment",
  client_assessment: "Client assessment",
  other: "Assessment",
};

export function applicationStatusForActivity(input: {
  eventType: "interview" | "assessment";
  roundNumber?: number | null;
  activityType?: string | null;
}): ApplicationStatus {
  if (input.eventType === "assessment") return "assessment";
  if (input.activityType === "hr_interview") return "hr_round";
  if (input.activityType === "final_interview") return "final_round";
  if ((input.roundNumber ?? 1) >= 3) return "interview_r3";
  if ((input.roundNumber ?? 1) === 2) return "interview_r2";
  return "interview_r1";
}

export function summarizeApplicationActivities(
  events: Array<{ eventType: string; status: string; scheduledAt?: Date | string | null }>,
  now = new Date(),
) {
  let interviewsAttended = 0;
  let assessmentsCompleted = 0;
  let upcomingInterviews = 0;
  let interviewsInProgress = 0;

  for (const event of events) {
    const status = event.status as ApplicationEventStatus;
    if (event.eventType === "interview") {
      if (INTERVIEW_COMPLETED_STATUSES.includes(status)) interviewsAttended += 1;
      if (["scheduled", "confirmed", "rescheduled", "feedback_pending"].includes(status)) interviewsInProgress += 1;
      if (
        event.scheduledAt &&
        UPCOMING_EVENT_STATUSES.includes(status) &&
        new Date(event.scheduledAt).getTime() >= now.getTime()
      ) upcomingInterviews += 1;
    }
    if (event.eventType === "assessment" && ASSESSMENT_COMPLETED_STATUSES.includes(status)) {
      assessmentsCompleted += 1;
    }
  }

  return { interviewsAttended, assessmentsCompleted, upcomingInterviews, interviewsInProgress };
}
