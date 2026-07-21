# Phase 2 Validation — Enquiry to Secure Invitation

## Implemented

- Public `/request-access` form with Zod validation, consent, honeypot, database-backed IP/email rate limiting, duplicate policy, acknowledgement email, and admin notification.
- Admin-only enquiry workflow with consultation scheduling/outcomes, approval gate, rejection reason, and rejection email.
- Candidate creation no longer accepts, displays, logs, or emails a temporary password.
- Secure 256-bit, hashed, expiring, single-use invitation tokens with revoke-on-resend behavior.
- Public `/setup-account` page atomically consumes an invitation, writes the candidate password, logs `secure_invite`, increments session version, and creates the candidate session.
- Email delivery tracking for acknowledgement, admin notification, rejection, initial invitation, and resend.
- Admin candidate Account & Security controls to inspect, resend, and revoke invitations.
- Migration smoke assertions include Phase 2 tables and lead consultation columns.

## Local validation completed in the patch build

- `npm run typecheck`: PASS
- `npm run lint`: PASS with the pre-existing `Avatar.tsx` image warning only
- `npm run build`: PASS using temporary non-secret build environment values
- `npm run db:smoke`: must be run by Cursor against the configured PostgreSQL instance

## Required manual workflow verification

1. Submit a public enquiry and confirm only one active record is created for repeated submissions.
2. Confirm candidate acknowledgement and admin email delivery logs.
3. Schedule and complete consultation; verify approval is blocked before completion.
4. Reject an enquiry with an internal reason and verify the candidate email does not expose that reason.
5. Approve, create candidate, and verify no temporary password is returned or displayed.
6. Open setup link, create password, verify token becomes unusable and session routes to NDA/dashboard according to `ENABLE_NDA_GATE`.
7. Resend invitation and verify the old link is revoked.
8. Revoke invitation and verify the link cannot be used.
