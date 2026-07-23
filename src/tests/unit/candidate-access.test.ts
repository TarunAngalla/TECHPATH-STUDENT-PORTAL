import assert from "node:assert/strict";
import test from "node:test";
import { deriveCandidateAccessState } from "@/lib/auth/candidate-access-state";

test("candidate access state follows the centralized precedence", () => {
  assert.equal(deriveCandidateAccessState({ accountState: "suspended", firstLogin: true, ndaGateEnabled: false, hasActiveTemplate: false, signedActiveNda: false }), "SUSPENDED");
  assert.equal(deriveCandidateAccessState({ accountState: "pending_setup", firstLogin: false, ndaGateEnabled: true, hasActiveTemplate: true, signedActiveNda: true }), "ACCOUNT_SETUP_REQUIRED");
  assert.equal(deriveCandidateAccessState({ accountState: "active", firstLogin: false, ndaGateEnabled: false, hasActiveTemplate: false, signedActiveNda: false }), "PORTAL_ACTIVE");
  assert.equal(deriveCandidateAccessState({ accountState: "nda_pending", firstLogin: false, ndaGateEnabled: true, hasActiveTemplate: true, signedActiveNda: false }), "NDA_REQUIRED");
  assert.equal(deriveCandidateAccessState({ accountState: "active", firstLogin: false, ndaGateEnabled: true, hasActiveTemplate: true, signedActiveNda: true }), "PORTAL_ACTIVE");
});
