# The Tech Path — Candidate and Admin Portal

Private candidate marketing and placement-progress platform with three roles: admin, recruiter, and candidate. The latest client workflow and `docs/CLIENT_ALIGNED_SCOPE.md` are authoritative.

## Stack

Next.js 15, React 19, TypeScript, PostgreSQL, Drizzle ORM, iron-session, private Supabase Storage, and Resend.

## Quick start

```bash
cp .env.example .env.local
docker compose up -d postgres
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

Use one canonical migration path: `npm run db:migrate`. Do not manually replay individual SQL files or use `db:push` for shared, staging, or production databases.

## Local URLs

| Surface | URL |
|---|---|
| Request access | http://localhost:3000/request-access |
| Candidate login | http://localhost:3000/login |
| Secure account setup | http://localhost:3000/setup-account?token=... |
| NDA review and signing | http://localhost:3000/nda |
| Candidate portal | http://localhost:3000/dashboard |
| Admin login | http://localhost:3000/admin/login |
| Admin console | http://localhost:3000/admin/dashboard |
| NDA administration | http://localhost:3000/admin/nda |

Production uses `portal.thetechpath.com` and `admin.thetechpath.com`.

## Seed

The seed creates an admin account only. Create recruiters under Team, then create or convert candidates through admin workflows.

```bash
npm run db:seed
npm run db:reset # destructive local reset
```

## Security model

- Admin sees all candidates and owns enquiries, approvals, invitations, NDA templates/signatures, assignments, and staff permissions.
- Recruiters see and modify assigned candidates only. NDA administration and signed NDA downloads are admin-only.
- Candidates see only their own records after the centralized account/NDA access gate permits portal access.
- Candidates must sign the currently active NDA version. Activating another version invalidates existing candidate sessions and requires candidates without that version to sign again.
- Typed-name signing records the active template hash, signer name, timestamp, IP address, user agent, consent statement, provider identifier, and signed PDF hash.
- Signed NDA PDFs and other sensitive documents are stored in a private Supabase bucket. The database stores only an object path; authorized routes issue short-lived signed URLs.
- A candidate may download only their own signed NDA. Admins may download signed NDAs; recruiters may not.
- Role/security changes increment `session_version`, invalidating stale iron-session cookies.
- Candidate application comments, resume upload, training self-completion, and phone editing are disabled by default.
- Public enquiries are rate-limited with hashed keys, deduplicated by active email, and require admin consultation/approval.
- Candidate accounts are created with an unusable placeholder credential; candidates set their password only through an expiring, hashed, single-use invitation.
- Email delivery attempts, including signed-NDA confirmation delivery, are recorded in `email_delivery_logs`.

## Feature flags

Secure invitations remain enabled. Keep the NDA gate off until migration `0004`, private storage/email, and a client-approved template are verified, then enable explicitly:

```env
ENABLE_SECURE_INVITES=true
ENABLE_NDA_GATE=false
```

Candidate mutation flags remain disabled unless separately approved:

```env
ENABLE_CANDIDATE_APPLICATION_COMMENTS=false
ENABLE_CANDIDATE_RESUME_UPLOAD=false
ENABLE_CANDIDATE_TRAINING_SELF_COMPLETE=false
ENABLE_CANDIDATE_PHONE_EDIT=false
```

Before setting `ENABLE_NDA_GATE=true` in a shared environment, apply migration `0004_nda_signing_activation`, configure private storage/email, and activate a client-approved NDA template from `/admin/nda`.

## Validation

```bash
npm run db:smoke   # applies all migrations to a temporary PostgreSQL schema
npm run nda:smoke  # validates typed-name evidence and signed-PDF generation
npm run typecheck
npm run lint
npm run build
```

## Key documentation

- `docs/CLIENT_ALIGNED_SCOPE.md`
- `docs/ROLE_PERMISSION_MATRIX.md`
- `docs/IMPLEMENTATION_CHECKLIST.md`
- `docs/PHASE_01_02_VERIFICATION.md`
- `docs/PHASE_03_VALIDATION.md`

## Phase 4 recruiter and marketing operations

The portal now stores recruiter profiles, capacity, assignment history, candidate journey events, and marketing lifecycle state as first-class business data.

Admin/recruiter workspace:

- `/admin/assignments` — recruiter workloads, unassigned candidates, and active work queue.
- Candidate Profile tab — assignment history, journey history, readiness checklist, and marketing controls.
- `/admin/team` — staff contact/profile, availability, timezone, and capacity settings.

Canonical Phase 4 validation:

```bash
npm run phase04:smoke
npm run db:smoke
npm run typecheck
npm run lint
npm run build
```

Do not use `journey_stage` alone to infer dates. Candidate-facing history comes from `candidate_journey_events`, while `candidates.journey_stage` remains the current summary pointer.
