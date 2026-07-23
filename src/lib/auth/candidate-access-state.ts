export const candidateAccessStates = [
  "ACCOUNT_SETUP_REQUIRED",
  "NDA_REQUIRED",
  "PORTAL_ACTIVE",
  "SUSPENDED",
] as const;

export type CandidateAccessState = (typeof candidateAccessStates)[number];

export function deriveCandidateAccessState(input: {
  accountState: "pending_setup" | "nda_pending" | "active" | "suspended";
  firstLogin: boolean;
  ndaGateEnabled: boolean;
  hasActiveTemplate: boolean;
  signedActiveNda: boolean;
}): CandidateAccessState {
  if (input.accountState === "suspended") return "SUSPENDED";
  if (input.firstLogin || input.accountState === "pending_setup") return "ACCOUNT_SETUP_REQUIRED";
  if (!input.ndaGateEnabled) return "PORTAL_ACTIVE";
  if (!input.hasActiveTemplate || !input.signedActiveNda) return "NDA_REQUIRED";
  return "PORTAL_ACTIVE";
}
