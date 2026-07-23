# Database Migration Guide

1. Never use `db:push` in shared, staging, or production environments.
2. Run `npm run db:smoke` against a non-production PostgreSQL database before release.
3. Take a managed snapshot or `pg_dump` backup before applying migrations.
4. Review the ordered SQL files under `drizzle/` and confirm the journal matches.
5. Apply with `npm run db:migrate` using a deployment identity with schema-change permission.
6. Run `/api/health/ready`, critical route smoke tests, and role UAT immediately after migration.
7. Keep the previous app deployment available until verification completes.

## Recovery

Schema rollbacks are not generated automatically. For a failed migration, stop deployment, preserve logs, and choose either:

- restore the pre-release database snapshot, then redeploy the previous app; or
- apply a reviewed forward-fix migration when restoration would discard accepted production writes.

Never manually edit Drizzle's migration journal on a live database.
