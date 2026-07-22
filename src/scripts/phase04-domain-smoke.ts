import assert from "node:assert/strict";
import { assertMarketingTransition } from "@/lib/constants/marketing";

const allowed = [
  ["not_ready", "ready"],
  ["ready", "live"],
  ["ready", "not_ready"],
  ["live", "paused"],
  ["live", "completed"],
  ["paused", "live"],
  ["paused", "completed"],
  ["paused", "not_ready"],
] as const;

for (const [current, next] of allowed) {
  assert.doesNotThrow(() => assertMarketingTransition(current, next));
}

const blocked = [
  ["not_ready", "live"],
  ["ready", "completed"],
  ["live", "ready"],
  ["completed", "live"],
] as const;

for (const [current, next] of blocked) {
  assert.throws(() => assertMarketingTransition(current, next));
}

console.log("Phase 4 domain smoke passed");
