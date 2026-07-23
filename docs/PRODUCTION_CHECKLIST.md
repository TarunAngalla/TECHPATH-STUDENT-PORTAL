# TechPath Production Checklist

## Required release gates

- [ ] `npm ci`
- [ ] `npm run quality:gate`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run test:unit`
- [ ] `npm run nda:smoke`
- [ ] `npm run phase04:smoke`
- [ ] `npm run phase05:smoke`
- [ ] `npm run phase06:smoke`
- [ ] `npm run phase07:smoke`
- [ ] `npm run db:smoke`
- [ ] `npm run build`
- [ ] `npm run test:e2e`

## Environment

- [ ] Production `SESSION_SECRET`, `RATE_LIMIT_HASH_SECRET`, and `LEAD_INTAKE_SECRET` generated independently
- [ ] Managed PostgreSQL configured with pooling, backups, and restore access
- [ ] Private Supabase bucket verified; no sensitive object is public
- [ ] Resend domain verified and production sender approved
- [ ] Candidate/admin domains, HTTPS, redirects, and cookie behavior verified
- [ ] Client-approved NDA template activated before `ENABLE_NDA_GATE=true`
- [ ] Candidate mutation flags remain disabled unless approved
- [ ] Seed credentials are not configured in production

## Security and UAT

- [ ] Admin, recruiter, and candidate authorization UAT passed
- [ ] Recruiter cannot access unassigned candidate records
- [ ] Candidate cannot access another candidate's data
- [ ] Direct URL bypass, expired invite, reused invite, suspended account, and NDA gate tested
- [ ] Signed NDA and candidate documents download only through authorized signed URLs
- [ ] CSV export is admin-only and spreadsheet-formula safe
- [ ] Logs contain no password, token, cookie, authorization header, or document content

## Release

- [ ] Database backup completed and restore owner named
- [ ] Migrations reviewed and applied before traffic switch
- [ ] `/api/health` and `/api/health/ready` return healthy responses
- [ ] Error monitoring and uptime checks configured
- [ ] Client UAT approval recorded
- [ ] Rollback owner and previous deployment identified
