import assert from "node:assert/strict";
import test from "node:test";
import { summarizeApplicationActivities } from "@/lib/constants/application-activity";
import { assertApplicationStatusTransition } from "@/lib/constants/status-meta";

test("application transitions reject impossible jumps", () => {
  assert.doesNotThrow(() => assertApplicationStatusTransition("submitted", "under_review"));
  assert.throws(() => assertApplicationStatusTransition("submitted", "hired"));
  assert.throws(() => assertApplicationStatusTransition("closed", "interview_r1"));
});

test("activity metrics count only verified event states", () => {
  const now = new Date("2026-07-23T12:00:00Z");
  assert.deepEqual(summarizeApplicationActivities([
    { eventType: "interview", status: "completed", scheduledAt: "2026-07-20T12:00:00Z" },
    { eventType: "interview", status: "scheduled", scheduledAt: "2026-07-24T12:00:00Z" },
    { eventType: "interview", status: "cancelled", scheduledAt: "2026-07-25T12:00:00Z" },
    { eventType: "assessment", status: "result_pending", scheduledAt: "2026-07-22T12:00:00Z" },
  ], now), {
    interviewsAttended: 1,
    assessmentsCompleted: 1,
    upcomingInterviews: 1,
    interviewsInProgress: 1,
  });
});
