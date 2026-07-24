# Phase 6 — Client UI Alignment

Phase 6 aligns the existing Phase 1–5 workflows with the approved Admin, Recruiter, and Candidate portal experience. It does not add another business domain or database migration.

## Delivered

- Admin navigation: Enquiries, Consultations, Candidates, NDA Signatures, Recruiter Assignments, Marketing Progress, Applications, Interviews, Assessments, Announcements, Reports, and Settings.
- Recruiter workspace: scoped dashboard, My Candidates, Marketing Progress, Applications, Interviews, Assessments, Trainings, Messages, Announcements, and Settings.
- Candidate navigation: Dashboard, My Progress, Trainings, Interview Details, Assessments, Announcements, Resources, and Account Settings.
- Candidate Resources page combining authorized private documents, placement guidance, recruiter messaging, and the Radxsys boundary.
- Dedicated staff consultation, marketing, interview, and assessment views using existing verified records.
- Role-aware admin/recruiter dashboard content.
- Combined candidate notification badge for unread recruiter messages and announcements.
- Functional staff candidate search.
- Legacy `/documents` redirect to `/resources`.
- Post-NDA indicator and real marketing-state messaging on the candidate dashboard.
- Reports page restricted to administrators.
- Shared date/time helpers so announcement and activity copy never shows raw ISO timestamps.

## Security preserved

- Admin-only enquiry, consultation, NDA, assignment, team, and report modules.
- Recruiter-scoped queries for applications, interviews, assessments, candidates, and marketing progress.
- Candidate view-only rules remain enforced by server actions from prior phases.
- No private document URL or internal application note is exposed by Phase 6.

## Validation commands

```bash
npm run nda:smoke
npm run phase04:smoke
npm run phase05:smoke
npm run phase06:smoke
npm run typecheck
npm run lint
npm run build
npm run db:smoke
```
