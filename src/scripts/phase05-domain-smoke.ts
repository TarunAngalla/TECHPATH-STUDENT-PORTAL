import assert from "node:assert/strict";
import {
  applicationStatusForActivity,
  summarizeApplicationActivities,
} from "@/lib/constants/application-activity";
import { assertApplicationStatusTransition } from "@/lib/constants/status-meta";

assert.equal(applicationStatusForActivity({ eventType: "assessment" }), "assessment");
assert.equal(applicationStatusForActivity({ eventType: "interview", roundNumber: 1 }), "interview_r1");
assert.equal(applicationStatusForActivity({ eventType: "interview", roundNumber: 2 }), "interview_r2");
assert.equal(applicationStatusForActivity({ eventType: "interview", roundNumber: 3 }), "interview_r3");
assert.equal(applicationStatusForActivity({ eventType: "interview", activityType: "hr_interview" }), "hr_round");
assert.equal(applicationStatusForActivity({ eventType: "interview", activityType: "final_interview" }), "final_round");
assert.doesNotThrow(() => assertApplicationStatusTransition("submitted", "under_review"));
assert.doesNotThrow(() => assertApplicationStatusTransition("offer", "hired"));
assert.throws(() => assertApplicationStatusTransition("closed", "interview_r1"));
assert.throws(() => assertApplicationStatusTransition("submitted", "hired"));

const now = new Date("2026-07-22T12:00:00.000Z");
const metrics = summarizeApplicationActivities([
  { eventType: "interview", status: "completed", scheduledAt: "2026-07-20T12:00:00.000Z" },
  { eventType: "interview", status: "passed", scheduledAt: "2026-07-21T12:00:00.000Z" },
  { eventType: "interview", status: "scheduled", scheduledAt: "2026-07-24T12:00:00.000Z" },
  { eventType: "interview", status: "cancelled", scheduledAt: "2026-07-25T12:00:00.000Z" },
  { eventType: "assessment", status: "result_pending", scheduledAt: "2026-07-20T12:00:00.000Z" },
  { eventType: "assessment", status: "assigned", scheduledAt: "2026-07-26T12:00:00.000Z" },
], now);
assert.deepEqual(metrics, {
  interviewsAttended: 2,
  assessmentsCompleted: 1,
  upcomingInterviews: 1,
  interviewsInProgress: 1,
});

console.log("Phase 5 domain smoke passed");
