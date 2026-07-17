import { C } from "./colors";

export const STATUS_META = {
  applied: { label: "Applied", color: C.slate, bg: C.slateSoft },
  assessment: { label: "Assessment", color: C.amber, bg: C.amberSoft },
  interview_r1: { label: "Interview Round 1", color: C.navy, bg: C.navySoft },
  interview_r2: { label: "Interview Round 2", color: C.navy, bg: C.navySoft },
  interview_r3: { label: "Interview Round 3", color: C.navy, bg: C.navySoft },
  hr_round: { label: "HR Round", color: "#6B3FA0", bg: "#F1EAFB" },
  final_round: { label: "Final Round", color: C.teal, bg: C.tealSoft },
  decision_pending: { label: "Decision Pending", color: C.amber, bg: C.amberSoft },
  offer: { label: "Offer", color: C.green, bg: C.greenSoft },
  rejected: { label: "Rejected", color: C.red, bg: C.redSoft },
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
