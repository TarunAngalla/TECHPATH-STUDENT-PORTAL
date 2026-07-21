# TechPath Implementation Checklist

## Phase 0 — Scope and preservation

- [x] Preserve existing portal shells and `useScrollToTopOnRouteChange`.
- [x] Add client-aligned product scope.
- [x] Add role/permission matrix.
- [x] Mark the latest client workflow as authoritative.
- [x] Document NDA and view-only open decisions.

## Phase 1 — Foundation

- [x] Reconcile canonical messages/message_reads schema.
- [x] Add a corrective, additive migration and backfills.
- [x] Add migration journal and fresh-database smoke script.
- [x] Add account state and session version.
- [x] Invalidate stale sessions after role/security changes.
- [x] Add centralized candidate access evaluator.
- [x] Add middleware/layout/server-action access gates.
- [x] Remove production session-secret fallback.
- [x] Store private document object paths and use signed download URLs.
- [x] Add staff scope checks for document/application/training writes.
- [x] Add schema foundations for invites, NDA, assignment history, journey history, and application events.
- [x] Append application status events transactionally.
- [x] Disable candidate comments/uploads/training completion by default.
- [x] Run TypeScript, lint, and production build checks.
- [x] Run migration smoke test against PostgreSQL in the target development environment.

## Phase 2 — Enquiry to secure invitation

- [x] Public request-access form, validation, rate limit, duplicate policy, and acknowledgement.
- [x] Admin-only enquiry/consultation review workflow.
- [x] Secure single-use invitation service and account-setup page.
- [x] Replace emailed/displayed temporary passwords.
- [x] Email delivery log and resend/revoke operations.

## Phase 3 — NDA and strict view-only release

- [ ] Confirm NDA signature method with client/legal.
- [ ] Implement `NdaSigningProvider` selected implementation.
- [ ] NDA template administration and version activation.
- [ ] NDA signing evidence, immutable record, private PDF, and email confirmation.
- [ ] Admin NDA pending/signed list.
- [ ] Enable `ENABLE_NDA_GATE` only after end-to-end verification.
- [ ] Remove/disable remaining unapproved candidate mutations.

## Phase 4 — Recruiter assignment and candidate journey

- [ ] Recruiter assignment management/history UI.
- [ ] Staff profiles and real recruiter contact information.
- [ ] Journey-event driven progress and marketing-live transitions.

## Phase 5 — Applications, interviews, and assessments

- [ ] Application-event CRUD service and admin/recruiter UI.
- [ ] Candidate Interview Details and Assessments pages.
- [ ] Event-derived metrics and recent activity.
- [ ] Migration/backfill verification for existing application data.

## Phase 6 — Client UI alignment

- [ ] Align admin navigation and dashboard cards/pipeline.
- [ ] Align candidate navigation and post-NDA dashboard.
- [ ] Keep old routes until replacements exist, then add redirects.
- [ ] Responsive, empty, loading, error, and accessibility states.

## Phase 7 — Production readiness

- [ ] Unit and integration tests for transitions and authorization.
- [ ] Playwright approval, rejection, invite, NDA, scope, and file-access flows.
- [ ] CI quality gate: migration smoke, typecheck, lint, test, build.
- [ ] Staging deployment, UAT, backups, monitoring, and rollback plan.
