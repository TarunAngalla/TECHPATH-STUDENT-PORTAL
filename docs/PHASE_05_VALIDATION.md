# Phase 5 Validation

Phase 5 adds verified company applications, interview rounds, assessments, event history, candidate-safe views, recruiter workbench access, portal notifications, calendar links, and event-backed metrics.

## Required checks

```bash
npm install
npm run typecheck
npm run lint
npm run nda:smoke
npm run phase04:smoke
npm run phase05:smoke
npm run build
npm run db:smoke
```

## Regression gates

- Phases 1–4 authorization and access gates remain unchanged.
- Admins can see all application activity.
- Recruiters can read and write only for assigned candidates.
- Candidates receive only candidate-visible applications/events and never internal notes.
- Application status changes and history writes remain transactional.
- Interview/assessment creation is idempotent through `event_key`.
- Dashboard counts are event-backed, not inferred only from the parent application status.
- Legacy `upcoming_*` fields remain synchronized for existing UI compatibility.
