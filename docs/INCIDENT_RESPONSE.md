# Incident Response

## Severity
- **P0:** candidate data exposure, compromised credentials, public sensitive files, destructive database event.
- **P1:** login/access outage, failed NDA workflow, database unavailable, widespread incorrect authorization.
- **P2:** email/provider degradation, report failure, limited feature error.

## Immediate actions
1. Name an incident owner and record the UTC start time.
2. Preserve application, provider, and database logs; do not copy secrets into tickets.
3. For suspected exposure, disable affected accounts, increment session versions, revoke tokens, and make storage objects private.
4. For a bad release, stop traffic or roll back the app. Restore the database only after assessing writes made after the backup.
5. Verify containment using role-specific test accounts.
6. Notify the client according to the agreed data/security policy.

## Never log or share
Passwords, invitation/reset tokens, session cookies, authorization headers, service-role keys, full NDA content/evidence, or candidate documents.
