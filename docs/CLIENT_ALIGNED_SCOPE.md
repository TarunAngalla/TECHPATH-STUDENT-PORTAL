# TechPath Client-Aligned Scope

## Product purpose

TechPath is a private candidate marketing and job-placement progress portal. TechPath staff manage verified candidate, application, training, interview, assessment, and marketing information. Candidates securely view only their own approved information.

The latest client workflow and approved client screens supersede older repository statements where they conflict.

## Roles

- **Admin:** owns enquiries, consultations, approvals, invitations, NDA operations, recruiter assignments, all candidates, reports, team permissions, and system settings.
- **Recruiter:** works only with assigned candidates after assignment. Recruiters manage candidate marketing activity, applications, training, interview/assessment events, announcements, and messages for their assigned candidates.
- **Candidate:** views only their own verified progress after account setup and NDA completion. Candidate writes are limited to NDA acceptance, password management, recruiter messaging, and explicitly enabled profile fields.

## Authoritative workflow

1. Public visitor submits an enquiry/access request.
2. Admin reviews the enquiry and consultation outcome.
3. Admin rejects the enquiry or approves portal access.
4. Approved candidate receives a single-use secure account setup invitation.
5. Candidate creates a password.
6. Candidate reviews and signs the active NDA.
7. Candidate receives full view-only portal access.
8. Admin assigns a recruiter.
9. Recruiter prepares the candidate profile and training.
10. Recruiter launches candidate marketing and records applications.
11. Recruiter records verified interviews, assessments, outcomes, and next steps.
12. Candidate views the same canonical records in the candidate portal.

## Candidate access states

- `ACCOUNT_SETUP_REQUIRED`: only account setup/reset route is available.
- `NDA_REQUIRED`: only the NDA route and logout are available.
- `PORTAL_ACTIVE`: candidate portal routes are available.
- `SUSPENDED`: only the suspended-account route and logout are available.

All middleware, layouts, server actions, and private-file routes must enforce the same access evaluator.

## View-only rules

Enabled by default:

- View own dashboard, journey, applications, trainings, interviews, assessments, announcements, resources, and documents.
- Sign NDA.
- Change password.
- Message assigned recruiter.

Disabled by default unless the client explicitly approves and a feature flag is enabled:

- Edit application comments or statuses.
- Upload resumes or other candidate documents.
- Mark training complete.
- Edit candidate phone/profile fields.
- Modify journey, recruiter assignment, interview results, or assessment results.

## Data source and trust model

The portal does not automatically know that an interview or assessment happened. For V1, TechPath staff enter and verify company/application/interview/assessment information received from employers, job platforms, staffing partners, email, calls, or the candidate. Future integrations may suggest records, but staff approval remains the source of truth.

The `applications` row is the current summary. Immutable `application_events` rows preserve status, interview, assessment, and activity history. Summary updates and event creation must happen in the same transaction.

## External-system boundary

TechPath is not payroll, timesheet, official offer-letter, or employment-compliance software. Those official post-onboarding functions are handled by Radxsys. TechPath may show a handoff notice but must not grow those workflows without a separately approved scope.

## Open product/legal decisions

- Typed-name NDA acceptance versus an external e-signature provider.
- Whether a new active NDA version forces re-signing.
- Public reapplication and duplicate-enquiry policy.
- Whether candidate phone editing is permitted.
- Exact consultation workflow and ownership.
- Email/calendar/ATS integrations planned after V1.
