import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeLogContext } from "@/lib/observability/logger";

test("structured logging redacts secret-bearing keys recursively", () => {
  const safe = sanitizeLogContext({
    email: "candidate@example.com",
    password: "never-log-this",
    nested: { authorization: "Bearer token", sessionCookie: "cookie" },
  });
  assert.equal(safe.email, "candidate@example.com");
  assert.equal(safe.password, "[REDACTED]");
  assert.deepEqual(safe.nested, { authorization: "[REDACTED]", sessionCookie: "[REDACTED]" });
});
