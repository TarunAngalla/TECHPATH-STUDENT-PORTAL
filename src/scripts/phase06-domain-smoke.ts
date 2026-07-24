import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { ADMIN_NAV_SECTIONS } from "@/lib/constants/admin-nav";
import { CANDIDATE_NAV_SECTIONS } from "@/lib/constants/candidate-nav";

async function main() {
  const adminItems = ADMIN_NAV_SECTIONS.flatMap((section) => section.items);
  const adminKeys = adminItems.map((item) => item.key);
  const recruiterKeys = adminItems.filter((item) => item.audience === "staff").map((item) => item.key);

  for (const key of [
    "dashboard",
    "leads",
    "consultations",
    "candidates",
    "nda",
    "assignments",
    "marketing",
    "applications",
    "interviews",
    "assessments",
    "announcements",
    "reports",
    "settings",
  ]) {
    assert(adminKeys.includes(key as (typeof adminKeys)[number]), `Missing admin navigation key: ${key}`);
  }
  for (const forbidden of ["leads", "consultations", "nda", "assignments", "reports", "team"]) {
    assert(!recruiterKeys.includes(forbidden as (typeof recruiterKeys)[number]), `Recruiter navigation exposes admin-only module: ${forbidden}`);
  }
  for (const required of ["dashboard", "candidates", "marketing", "applications", "interviews", "assessments", "trainings", "messages", "announcements", "settings"]) {
    assert(recruiterKeys.includes(required as (typeof recruiterKeys)[number]), `Recruiter navigation missing module: ${required}`);
  }

  const candidateItems = CANDIDATE_NAV_SECTIONS.flatMap((section) => section.items);
  assert.deepEqual(
    candidateItems.map((item) => item.key),
    ["dashboard", "progress", "trainings", "interview-details", "assessments", "announcements", "messages", "resources", "settings"],
    "Candidate primary navigation does not match the client-aligned view",
  );

  const resourcesRoute = await readFile("src/app/(portal)/resources/page.tsx", "utf8");
  assert(resourcesRoute.includes("CandidateResourcesPage"), "Resources route is not wired to the resources page");
  const documentsRoute = await readFile("src/app/(portal)/documents/page.tsx", "utf8");
  assert(documentsRoute.includes('redirect("/resources")'), "Legacy documents route does not redirect to resources");

  const activityQuery = await readFile("src/lib/db/queries/admin/activities.ts", "utf8");
  assert(activityQuery.includes("candidates.recruiterId"), "Staff activity query is missing recruiter scope");
  const marketingQuery = await readFile("src/lib/db/queries/admin/marketing.ts", "utf8");
  assert(marketingQuery.includes("scope.recruiterId"), "Marketing query is missing recruiter scope");

  for (const adminOnlyPage of [
    "src/app/admin/leads/page.tsx",
    "src/app/admin/consultations/page.tsx",
    "src/app/admin/nda/page.tsx",
    "src/app/admin/assignments/page.tsx",
    "src/app/admin/reports/page.tsx",
    "src/app/admin/team/page.tsx",
  ]) {
    const source = await readFile(adminOnlyPage, "utf8");
    assert(source.includes("requireAdminAuth"), `${adminOnlyPage} is not admin-only`);
  }

  const dashboard = await readFile("src/components/candidate/CandidateDashboard.tsx", "utf8");
  assert(dashboard.includes("Post-NDA Access"), "Candidate dashboard is missing the post-NDA indicator");
  assert(!dashboard.includes("Upload resume"), "Candidate dashboard still offers resume upload");

  console.log("Phase 06 domain smoke passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
