import { C } from "./colors";

export const STATUS_META = {
  draft: { label: "Draft", color: C.slate, bg: C.slateSoft },
  applied: { label: "Applied", color: C.slate, bg: C.slateSoft },
  submitted: { label: "Submitted", color: C.teal, bg: C.tealSoft },
  under_review: { label: "Under Review", color: C.amber, bg: C.amberSoft },
  assessment: { label: "Assessment", color: C.amber, bg: C.amberSoft },
  interview_r1: { label: "Interview Round 1", color: C.navy, bg: C.navySoft },
  interview_r2: { label: "Interview Round 2", color: C.navy, bg: C.navySoft },
  interview_r3: { label: "Interview Round 3", color: C.navy, bg: C.navySoft },
  hr_round: { label: "HR Round", color: "#6B3FA0", bg: "#F1EAFB" },
  final_round: { label: "Final Round", color: C.teal, bg: C.tealSoft },
  decision_pending: { label: "Decision Pending", color: C.amber, bg: C.amberSoft },
  offer: { label: "Offer", color: C.green, bg: C.greenSoft },
  hired: { label: "Hired", color: C.green, bg: C.greenSoft },
  rejected: { label: "Rejected", color: C.red, bg: C.redSoft },
  withdrawn: { label: "Withdrawn", color: C.slate, bg: C.slateSoft },
  on_hold: { label: "On Hold", color: C.amber, bg: C.amberSoft },
  closed: { label: "Closed", color: C.slate, bg: C.slateSoft },
} as const;

export type ApplicationStatus = keyof typeof STATUS_META;

export const APPLICATION_STATUS_OPTIONS = Object.entries(STATUS_META).map(
  ([value, meta]) => ({ value: value as ApplicationStatus, label: meta.label }),
);

export const INTERVIEW_STATUSES: ApplicationStatus[] = [
  "interview_r1",
  "interview_r2",
  "interview_r3",
  "hr_round",
  "final_round",
  "decision_pending",
];

const APPLICATION_STATUS_TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  draft: ["applied", "submitted", "withdrawn"],
  applied: ["submitted", "under_review", "assessment", "interview_r1", "rejected", "on_hold", "withdrawn"],
  submitted: ["under_review", "assessment", "interview_r1", "rejected", "on_hold", "withdrawn"],
  under_review: ["assessment", "interview_r1", "rejected", "on_hold", "withdrawn"],
  assessment: ["interview_r1", "decision_pending", "rejected", "on_hold", "withdrawn"],
  interview_r1: ["interview_r2", "interview_r3", "hr_round", "final_round", "decision_pending", "rejected", "on_hold"],
  interview_r2: ["interview_r3", "hr_round", "final_round", "decision_pending", "rejected", "on_hold"],
  interview_r3: ["hr_round", "final_round", "decision_pending", "rejected", "on_hold"],
  hr_round: ["final_round", "decision_pending", "offer", "rejected", "on_hold"],
  final_round: ["decision_pending", "offer", "rejected", "on_hold"],
  decision_pending: ["offer", "rejected", "on_hold"],
  offer: ["hired", "rejected", "withdrawn", "closed"],
  hired: ["closed"],
  rejected: ["closed"],
  withdrawn: ["closed"],
  on_hold: ["under_review", "assessment", "interview_r1", "interview_r2", "interview_r3", "hr_round", "final_round", "decision_pending", "rejected", "withdrawn"],
  closed: [],
};

export function assertApplicationStatusTransition(current: ApplicationStatus, next: ApplicationStatus) {
  if (current === next) return;
  if (!APPLICATION_STATUS_TRANSITIONS[current].includes(next)) {
    throw new Error(`Invalid application transition: ${current} -> ${next}`);
  }
}
