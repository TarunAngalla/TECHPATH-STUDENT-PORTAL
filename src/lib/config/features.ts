function envFlag(name: string, defaultValue = false) {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return value === "1" || value.toLowerCase() === "true";
}

export const serverFeatures = {
  ndaGate: envFlag("ENABLE_NDA_GATE", false),
  secureInvites: envFlag("ENABLE_SECURE_INVITES", true),
  candidateResumeUpload: envFlag("ENABLE_CANDIDATE_RESUME_UPLOAD", false),
  candidateApplicationComments: envFlag("ENABLE_CANDIDATE_APPLICATION_COMMENTS", false),
  candidateTrainingSelfComplete: envFlag("ENABLE_CANDIDATE_TRAINING_SELF_COMPLETE", false),
  candidatePhoneEdit: envFlag("ENABLE_CANDIDATE_PHONE_EDIT", false),
} as const;
