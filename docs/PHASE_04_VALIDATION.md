# TechPath Phase 4 — Recruiter Assignment, Journey, and Marketing Operations

## Scope

Phase 4 replaces inferred recruiter and candidate-progress data with auditable operational records.

Implemented domains:

- Staff profiles with real recruiter name, title, phone, timezone, availability, and capacity.
- One active recruiter assignment per candidate.
- Assignment, reassignment, and unassignment history with reasons and actor evidence.
- Recruiter workload and capacity enforcement.
- Candidate journey events with actual timestamps, source, visibility, and previous stage.
- Marketing lifecycle: not ready, ready, live, paused, and completed.
- Marketing readiness checks based on active account/NDA, recruiter assignment, resume, and contact details.
- Automatic journey movement when recruiter assignment, marketing launch, or interview/assessment activity occurs.
- Candidate progress page backed by journey-event records rather than account-creation date guesses.
- Admin/recruiter assignment work queue.
- Audit records for assignment, staff-profile, journey, and marketing changes.

## Business rules

1. Only admins assign, reassign, or unassign recruiters.
2. Recruiters may view only candidates currently assigned to them.
3. A recruiter marked unavailable cannot receive a new candidate.
4. A recruiter at capacity cannot receive a new candidate.
5. The database permits only one active recruiter assignment per candidate.
6. Marketing cannot become ready or live unless all readiness checks pass.
7. Live marketing cannot be skipped directly from `not_ready`.
8. Pausing, completing, or resetting marketing requires a reason.
9. Journey stages advance sequentially and cannot bypass their domain prerequisites.
10. Interview/assessment application activity can advance a candidate to journey stage 3.
11. Candidate-visible journey events are shown in the candidate portal; internal-only events remain staff-only.
12. Recruiter contact information is read from `staff_profiles`; no fake title or phone is displayed.

## Validation commands

```bash
npm install
npm run typecheck
npm run lint
npm run phase04:smoke
npm run build
npm run db:smoke
```

## Required UAT

- Create/update a recruiter staff profile.
- Set recruiter availability and capacity.
- Assign an unassigned candidate.
- Confirm assignment history, candidate recruiter card, and recruiter scope.
- Reassign the candidate and confirm the previous assignment is closed.
- Confirm a second active assignment for the same candidate is rejected.
- Confirm an unavailable or full recruiter cannot receive a new assignment.
- Complete marketing readiness prerequisites.
- Move `not_ready → ready → live` and confirm journey stage 2 is recorded.
- Pause and resume marketing with a reason.
- Add interview/assessment activity and confirm journey stage 3 history.
- Confirm the candidate progress page uses real event dates and candidate-visible notes.

## Phase boundary

Phase 4 does not build the full Interview Details and Assessments domains. Those are Phase 5 and will use `application_events` as the event source of truth.
