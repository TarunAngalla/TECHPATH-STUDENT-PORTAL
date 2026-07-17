# The Tech Path — Candidate & Admin Portal

Dual-portal staffing platform for OPT/STEM OPT candidates.

## Quick start

```bash
docker compose up -d
npm install
docker compose exec -T postgres psql -U techpath -d techpath < drizzle/0000_initial.sql
docker compose exec -T postgres psql -U techpath -d techpath < drizzle/0001_message_reads.sql
cp .env.example .env.local
npm run db:seed
npm run dev
```

## URLs (local)

| Surface | URL |
|---|---|
| Candidate login | http://localhost:3000/login |
| Candidate portal | http://localhost:3000/dashboard |
| Admin login | http://localhost:3000/admin/login |
| Admin console | http://localhost:3000/admin/dashboard |

Production uses subdomains: `portal.thetechpath.com` and `admin.thetechpath.com`.

## Seed credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@thetechpath.com | admin123 |
| Recruiter | sarah.mitchell@thetechpath.com | recruiter123 |
| Candidate | ravi.kumar@example.com | temp-password-123 |

Candidate passwords are **admin-controlled only** — no self-service change, no registration email.

## Supabase Storage

Create a `documents` bucket (private) in Supabase and set env vars in `.env.local`. Document uploads use `src/lib/storage/supabase.ts`.

## Architecture

- **One database, two portals** — candidate and admin read/write the same rows
- Applications: status + `upcoming_*` fields (no separate interviews table)
- Application comments: plain textarea, not chat
- Messages: only chat UI in the system
- Upcoming page: derived filter over `applications`

## Scripts

- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run db:seed` — seed dev data
- `npm run smoke` — basic smoke checks
