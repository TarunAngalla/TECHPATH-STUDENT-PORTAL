# Cursor Agent — Code-Only Phase 1 Completion

Work inside this repository. The Phase 0/1 foundation is already implemented. Do not redesign UI, rename navigation, start Phase 2, revert portal-shell/scroll changes, or replace the stack.

## Operating mode

- Write/fix code directly. Do not give a plan, tutorial, architecture explanation, progress commentary, or paste unchanged code into chat.
- Inspect existing diffs first. Preserve additive migrations and backward-compatible routes.
- Fix only concrete migration, TypeScript, lint, authorization, or build failures.
- Prefer the smallest correct patch. Do not generate new abstractions unless required to pass checks.
- Never weaken access checks, signed-file access, session version validation, or feature-flag defaults to make tests pass.

## Required checks

Run in this exact order:

```bash
npm ci
npm run db:smoke
npm run typecheck
npm run lint
npm run build
```

If PostgreSQL is not running, run `docker compose up -d postgres` and retry `npm run db:smoke`.

## Hard constraints

- `REQUIREMENTS.md` client-aligned override and `docs/*` are authoritative.
- Preserve `src/lib/hooks/useScrollToTopOnRouteChange.ts` and current portal-shell changes.
- Candidate comments, resume upload, training self-completion, and phone editing stay disabled by default.
- Enquiries/approvals/invites remain admin-only; recruiters remain candidate-assignment scoped.
- Do not enable the NDA gate until the complete signing flow exists.
- Do not replace private object paths with public Supabase URLs.
- Application summary/status changes and status-history events must remain transactional.
- Do not edit or squash historical migration files unless a fresh migration smoke test proves the exact correction is necessary.

## Final response format only

```text
CHANGED: <comma-separated files or none>
DB_SMOKE: PASS|FAIL|BLOCKED
TYPECHECK: PASS|FAIL
LINT: PASS|FAIL
BUILD: PASS|FAIL
BLOCKER: <one line or none>
```
