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

Use one canonical migration path: `npm run db:migrate`. Do not manually replay individual SQL files or use `db:push` for shared/staging/production databases.

## Local URLs

| Surface | URL |
|---|---|
| Request access | http://localhost:3000/request-access |
| Candidate login | http://localhost:3000/login |
| Secure account setup | http://localhost:3000/setup-account?token=... |
| Candidate portal | http://localhost:3000/dashboard |
| Admin login | http://localhost:3000/admin/login |
| Admin console | http://localhost:3000/admin/dashboard |

Production uses `portal.thetechpath.com` and `admin.thetechpath.com`.

## Seed

The seed creates an admin account only. Create recruiters under Team, then create/convert candidates through admin workflows.

```bash
npm run db:seed
npm run db:reset # destructive local reset
```

## Security model

- Admin sees all candidates and owns enquiries, approvals, invitations, NDA operations, assignments, and staff permissions.
- Recruiters see and modify assigned candidates only.
- Candidates see only their own records after the centralized account/NDA access gate permits portal access.
- Sensitive documents are stored in a private Supabase bucket. The database stores an object path; authorized download routes issue short-lived signed URLs.
- Role/security changes increment `session_version`, invalidating stale iron-session cookies.
- Candidate application comments, resume upload, training self-completion, and phone editing are disabled by default.
- Public enquiries are rate-limited with hashed keys, deduplicated by active email, and require admin consultation/approval.
- Candidate accounts are created with an unusable placeholder credential; candidates set their password only through an expiring, hashed, single-use invitation.
- Email delivery attempts are recorded in `email_delivery_logs`.

## Feature flags

Secure invitations are the only supported candidate account-setup flow and should remain enabled:

- `ENABLE_SECURE_INVITES=true`

Keep the NDA gate disabled until Phase 3 signing is complete and verified:

- `ENABLE_NDA_GATE=false`
- `ENABLE_CANDIDATE_APPLICATION_COMMENTS`
- `ENABLE_CANDIDATE_RESUME_UPLOAD`
- `ENABLE_CANDIDATE_TRAINING_SELF_COMPLETE`
- `ENABLE_CANDIDATE_PHONE_EDIT`

## Validation

```bash
npm run db:smoke   # applies all migrations to a temporary PostgreSQL schema
npm run typecheck
npm run lint
npm run build
```

## Key documentation

- `docs/CLIENT_ALIGNED_SCOPE.md`
- `docs/ROLE_PERMISSION_MATRIX.md`
- `docs/IMPLEMENTATION_CHECKLIST.md`
- `docs/PHASE_02_VALIDATION.md`
- `CURSOR_CODE_ONLY_PHASE_01.md`
