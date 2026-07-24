import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { deriveCandidateAccessState } from "@/lib/auth/candidate-access-state";
import { sanitizeLogContext } from "@/lib/observability/logger";
import { toCsv } from "@/lib/utils/csv";

async function main() {
  assert.equal(deriveCandidateAccessState({ accountState: "suspended", firstLogin: false, ndaGateEnabled: true, hasActiveTemplate: true, signedActiveNda: true }), "SUSPENDED");
  assert.equal(deriveCandidateAccessState({ accountState: "pending_setup", firstLogin: true, ndaGateEnabled: true, hasActiveTemplate: false, signedActiveNda: false }), "ACCOUNT_SETUP_REQUIRED");
  assert.equal(deriveCandidateAccessState({ accountState: "active", firstLogin: false, ndaGateEnabled: true, hasActiveTemplate: true, signedActiveNda: false }), "NDA_REQUIRED");
  assert.equal(deriveCandidateAccessState({ accountState: "active", firstLogin: false, ndaGateEnabled: true, hasActiveTemplate: true, signedActiveNda: true }), "PORTAL_ACTIVE");

  const csv = toCsv([{ Name: "=HYPERLINK(\"bad\")", Count: 2 }]);
  assert(csv.includes("'=HYPERLINK"), "CSV formula injection is not neutralized");
  assert.equal(sanitizeLogContext({ password: "secret", nested: { token: "abc" } }).password, "[REDACTED]");

  const nextConfig = await readFile("next.config.ts", "utf8");
  for (const header of ["X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "X-Frame-Options"]) {
    assert(nextConfig.includes(header), `Missing security header: ${header}`);
  }
  const reportRoute = await readFile("src/app/api/admin/reports/export/route.ts", "utf8");
  assert(reportRoute.includes('getApiPrincipal(["admin"])'), "Report export is not admin-only");
  const qualityWorkflow = await readFile(".github/workflows/quality.yml", "utf8");
  assert(qualityWorkflow.includes("npm run quality:gate"));
  assert(qualityWorkflow.includes("npm run db:smoke"));
  assert(qualityWorkflow.includes("npm run test:e2e"));

  console.info("Phase 07 domain smoke passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
