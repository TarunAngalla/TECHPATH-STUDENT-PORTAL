/**
 * Smoke checks — run after seed: npm run smoke
 * Verifies key modules import and env is set.
 */
import { STATUS_META } from "../lib/constants/status-meta";
import { LEAD_STATUS_META } from "../lib/constants/lead-status";
import { DOCUMENT_SECTIONS } from "../lib/constants/document-sections";
import { CANDIDATE_NAV_SECTIONS } from "../lib/constants/candidate-nav";
import { ADMIN_NAV_SECTIONS } from "../lib/constants/admin-nav";

const checks = [
  { name: "STATUS_META", ok: Object.keys(STATUS_META).length === 10 },
  { name: "LEAD_STATUS_META", ok: Object.keys(LEAD_STATUS_META).length === 5 },
  { name: "DOCUMENT_SECTIONS", ok: DOCUMENT_SECTIONS.length >= 3 },
  { name: "CANDIDATE_NAV", ok: CANDIDATE_NAV_SECTIONS.length === 5 },
  { name: "ADMIN_NAV", ok: ADMIN_NAV_SECTIONS.length === 5 },
  { name: "DATABASE_URL", ok: Boolean(process.env.DATABASE_URL) },
  { name: "SESSION_SECRET", ok: (process.env.SESSION_SECRET?.length ?? 0) >= 32 },
];

let failed = 0;
for (const c of checks) {
  if (c.ok) {
    console.log(`✓ ${c.name}`);
  } else {
    console.error(`✗ ${c.name}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log("\nAll smoke checks passed.");
