# Phase 0–2 Verification Audit

**Verification date:** 2026-07-21  
**Workspace:** `/Users/varunreddy/Downloads/TECHPATH-STUDENT-PORTAL-main`  
**Repository state:** Working tree is not a git checkout (git history lives in `~/Downloads/techpath-git`). Phase 0–2 code is present and was previously merged to `main` via PR #3. Local audit fixes applied after that merge are listed below.  
**Database:** `DATABASE_URL` host `localhost`, database `techpath` (local development).

## Validation results

| Check | Result |
|---|---|
| `npm run db:smoke` | PASS — migrations `0000`–`0003` applied in ephemeral schema and dropped |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (pre-existing `Avatar.tsx` `<img>` warning only) |
| `npm run build` | PASS |
| Runtime smoke (`next start`) | PASS — `/login` 200, `/admin/login` 200, `/request-access` 200, `/setup-account` 200; `/account-suspended` and `/nda` redirect to `/login` when unauthenticated |
| Invalid invite token | PASS — `getValidCandidateInvite` returns null |

## Phase 1 requirements verified

- Messages / `message_reads` reconciled; additive migrations present.
- Foundations: `candidate_invites`, `nda_templates`, `candidate_nda_agreements`, `candidate_recruiter_assignments`, `candidate_journey_events`, `application_events`.
- Account state + `session_version`; production requires `SESSION_SECRET` (≥32).
- Centralized `getCandidateAccessState` used by portal layout / guards / document downloads.
- Private document paths + signed download URLs (`getPublicUrl` absent for sensitive files).
- Staff scope on candidate/document/application/training writes.
- View-only feature flags default off and enforced in server actions.
- NDA signing remains Phase 3 stub (`NdaSigningProvider` interface only; `ENABLE_NDA_GATE` default false).

## Phase 2 requirements verified

- Public `/request-access` with Zod validation, consent, honeypot, IP/email rate limits, duplicate policy, acknowledgement + admin notification emails/logs.
- Admin-only consultation/approval/rejection; approval blocked until consultation completed (unless override env).
- Secure invites: `randomBytes`, SHA-256 hash storage, expiry, single-use, revoke-on-resend; no temporary passwords emailed/displayed.
- `/setup-account` consumes token and password in one transaction; bumps session version.
- `email_delivery_logs` and `public_request_rate_limits` present.

## Documentation consistency

- `REQUIREMENTS.md` client-aligned override supersedes legacy “no NDA”.
- Roles Admin / Recruiter / Candidate documented; view-only and Radxsys boundary documented.
- Phase 3 checklist items remain unchecked (no accidental NDA signing implementation).
- `DATABASE_SCHEMA.sql` marked legacy / incomplete relative to Phase 0–2 (canonical = `schema.ts` + `drizzle/`).

## Defects found and fixed

| Severity | Defect | Fix |
|---|---|---|
| HIGH | Message actions used `requireAuth` only — bypassed candidate access gate | Gate candidates via `requireCandidatePortalAccess`, staff via `requireStaffAuth` |
| HIGH | Recruiter dashboard/reports leaked global leads PII + audit | Scope enquiry/audit queries to admins (`seesAllCandidates`) |
| HIGH | Recruiter nav showed Leads Inbox | Hide `leads` for recruiters |
| HIGH | No login rate limiting | `enforceLoginRateLimit` on login actions |
| HIGH | Logout open redirect via `next` query | Allow only same-origin relative paths |
| HIGH | Suspended users could still call authenticated actions | `requireAuth` fails closed on `suspended` |
| MEDIUM | Password changes did not invalidate other sessions | Default `invalidateSessions: true`; refresh current session version |
| MEDIUM | Weaker forced/self-service password policy vs invite | Shared strong password rules (10+, upper/lower/digit) |
| MEDIUM | `ENABLE_SECURE_INVITES` unused | Enforced before create/resend invite |
| MEDIUM | `app_no` via `count()+1` unsafe after deletes | Allocate via max parsed `APP-N` under advisory lock |
| LOW | `DATABASE_SCHEMA.sql` contradictory “no NDA” header | Clarified legacy / do-not-apply banner |

## Exact files fixed

- `src/lib/auth/guards.ts`
- `src/lib/actions/messages.ts`
- `src/app/api/auth/logout/route.ts`
- `src/lib/db/queries/admin/dashboard.ts`
- `src/components/admin/AdminSidebar.tsx`
- `src/lib/auth/password.ts`
- `src/lib/actions/auth.ts`
- `src/lib/actions/settings.ts`
- `src/lib/services/public-enquiries.ts`
- `src/lib/services/application-events.ts`
- `src/lib/actions/candidates.ts`
- `src/lib/actions/candidate-invites.ts`
- `DATABASE_SCHEMA.sql`
- `docs/PHASE_01_02_VERIFICATION.md` (this file)

## Remaining external / non-blocking notes

- Middleware still uses session cookie account-state fields for first-line redirects; DB evaluator is authoritative in layout/guards/actions. Keep `session_version` bumps on security changes.
- Trusted `/api/leads` bearer intake has no rate limit (secret-gated). Optional hardening later.
- Migration smoke may emit `IF NOT EXISTS` notices for `message_reads` (0000 vs 0001 history); smoke still passes and cleans temporary schemas only.
- Supabase / Resend not required for local smoke; email delivery logs as `logged` without `RESEND_API_KEY`.
- Runtime 500s observed earlier were from a corrupted Turbopack `.next` while `next build` ran concurrently; production `next start` smoke passed after rebuild.

## Ready for Phase 3?

**YES** — Phase 0–2 foundations, enquiry/invite workflow, three-role authorization, access gate, private storage, and security defects discovered in this audit are corrected. Phase 3 (NDA signing provider, templates, evidence, enable `ENABLE_NDA_GATE`) may begin.
