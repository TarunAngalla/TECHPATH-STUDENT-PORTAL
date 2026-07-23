# Backup and Restore

## Minimum policy

- PostgreSQL: daily backup plus point-in-time recovery where the provider supports it.
- Supabase Storage: retain signed NDA and candidate-document objects according to the client retention policy.
- Environment secrets: keep in the deployment platform and an approved password manager.
- Verify a restore in staging at least quarterly and before major schema releases.

## Manual PostgreSQL backup

```bash
pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL" > techpath-$(date +%Y%m%d-%H%M).dump
```

## Restore drill

```bash
createdb techpath_restore_test
pg_restore --clean --if-exists --no-owner --no-acl --dbname="$RESTORE_DATABASE_URL" techpath-YYYYMMDD-HHMM.dump
npm run db:smoke
```

A restore is not considered tested until an admin can sign in to the isolated environment and verify candidate, assignment, NDA, application, interview, and assessment records.
