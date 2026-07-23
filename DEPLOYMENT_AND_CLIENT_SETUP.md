# TechPath — Configuration, Client Ask-List & Deployment Guide

Internal reference for environment setup, what to request from the client, and a cost-effective production deployment plan. Based on the Phase 0–3 stack (Next.js, Postgres/Drizzle, iron-session, Supabase Storage, Resend).

---

## 1. Your two env files

| File | Purpose |
|------|---------|
| `.env.example` | Template only — commit this, no secrets |
| `.env.local` | **Your real secrets** — never commit, never share in chat |

Fill `.env.local` from `.env.example`. Placeholder Supabase values (`your-project.supabase.co`, `your-service-role-key`) will cause NDA signing to fail because signed PDFs cannot be uploaded.

---

## 2. What to put in `.env.local` (grouped)

### A. Must have for local + production

| Variable | What it is | You / client |
|----------|------------|--------------|
| `DATABASE_URL` | Postgres connection string | You set (local Docker now; managed DB in prod) |
| `SESSION_SECRET` | ≥32 random chars for cookies | **You generate** (openssl / password manager) |
| `ADMIN_EMAIL_DOMAIN` | Staff must use `@thetechpath.com` | Confirm with client |
| `ENABLE_SECURE_INVITES` | `true` | Keep |
| `ENABLE_NDA_GATE` | `true` only after Supabase + template OK | You control |

### B. Needed for NDA signing + document downloads

| Variable | What it is | Ask client / you create |
|----------|------------|-------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL | Supabase project |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server secret** (never in browser) | Supabase → Settings → API |
| `SUPABASE_DOCUMENTS_BUCKET` | Usually `documents` | Create **private** bucket |

Without real Supabase → NDA sign fails with a generic error after name/consent validation.

### C. Needed for real emails (invites, enquiry ack, NDA PDF email)

| Variable | What it is | Ask client |
|----------|------------|------------|
| `RESEND_API_KEY` | Resend API key | Resend account |
| `EMAIL_FROM` | e.g. `The Tech Path <noreply@thetechpath.com>` | Domain + mailbox/DNS |
| `ADMIN_NOTIFICATION_EMAIL` | Who gets “new enquiry” | Client email |

Without Resend → app still works; emails only **log** in the server (`[email:dev]` / `email_delivery_logs`).

### D. Hosts / URLs

| Variable | Local | Production (ask client for domains) |
|----------|-------|-------------------------------------|
| `NEXT_PUBLIC_CANDIDATE_HOST` | `portal.localhost:3000` | `portal.thetechpath.com` |
| `NEXT_PUBLIC_ADMIN_HOST` | `admin.localhost:3000` | `admin.thetechpath.com` |
| `NEXT_PUBLIC_CANDIDATE_PORTAL_URL` | `http://portal.localhost:3000` | `https://portal.thetechpath.com` |

### E. Optional / fine with defaults

`RATE_LIMIT_HASH_SECRET`, `LEAD_INTAKE_SECRET`, invite TTL, enquiry rate limits, candidate mutation flags (`false`).

**Generate secrets yourself (don’t ask client):**

```bash
openssl rand -base64 48   # SESSION_SECRET
openssl rand -base64 48   # RATE_LIMIT_HASH_SECRET
openssl rand -base64 32   # LEAD_INTAKE_SECRET
```

---

## 3. What to ask the client (checklist to send them)

**Domains & DNS**

1. Confirm production hosts: `portal.thetechpath.com` and `admin.thetechpath.com` (or alternatives).
2. Who controls DNS (Cloudflare / GoDaddy / etc.)? Access for CNAME + email DNS.
3. Do they already own `thetechpath.com`?

**Email (Resend)**

4. Approve sending domain (usually `thetechpath.com` or `mail.thetechpath.com`).
5. Preferred From address: e.g. `noreply@thetechpath.com` or `portal@thetechpath.com`.
6. Admin inbox for new enquiries: e.g. `admin@thetechpath.com`.
7. Either: create Resend account and share API key **via password manager**, or authorize you to create it under their org.

**File storage (Supabase)**

8. Authorize a Supabase project (or you create under their org).
9. Confirm private bucket for candidate docs + signed NDAs (no public files).

**Database**

10. Prefer managed Postgres (recommended) vs their own server.
11. Region preference (US / India / EU) for latency + data policy.
12. Backup / retention expectations.

**Access & legal**

13. Final **client-approved NDA legal text** (not local test text).
14. List of admin emails (`@thetechpath.com`).
15. Who gets GitHub / Vercel / Supabase / Resend / DNS access.

**Product flags**

16. Confirm NDA gate on in production after UAT.
17. Confirm candidate remains view-only (uploads/comments off unless they say otherwise).

---

## 4. Best cost-effective reliable stack (recommended)

This app is **one Next.js app** (frontend + API together) + **Postgres** + **Supabase Storage** + **Resend**.

| Layer | Best fit | Why |
|-------|----------|-----|
| App (UI + API) | **Vercel** (Pro) | Native Next.js, already has `vercel.json`, low ops |
| Database | **Neon** (or Supabase Postgres) | Managed Postgres, cheap, branching for staging |
| Files / signed NDA PDFs | **Supabase Storage** (private bucket) | Already wired in code |
| Email | **Resend** | Already wired; simple DNS |
| DNS | **Cloudflare** (free) | Reliable, easy DNS + HTTPS |
| Secrets | Vercel env + 1Password/Bitwarden | Never in Git |

Avoid: self-hosting Postgres on a random VPS unless they have a DevOps person — more failure risk for an internal tool.

**Staging (strongly recommended):**  
`staging-portal…` + `staging-admin…` + separate Neon DB + same Supabase project with a `documents-staging` bucket (or separate project).

---

## 5. A–Z deployment order

1. Client confirms domains + email From address + NDA text.
2. Create **Neon** DB → run `npm run db:migrate` (not `db:push`).
3. Create **Supabase** project → private `documents` bucket → put URL + service role in env.
4. Create **Resend** → verify domain DNS (SPF/DKIM) → API key + `EMAIL_FROM`.
5. Deploy app to **Vercel** → set all prod env vars → custom domains for portal + admin.
6. Point Cloudflare DNS CNAMEs to Vercel.
7. Seed **one admin** only → create recruiters in UI.
8. Upload **real** NDA on `/admin/nda` and activate.
9. Set `ENABLE_NDA_GATE=true` only after a full test sign works.
10. UAT: request-access → approve → invite → setup → NDA → dashboard → download signed PDF.
11. Backups: Neon PITR/daily backups on; document restore owner.
12. Hand over access + runbook (not before Phase 4 unless they insist).

---

## 6. Cost estimate (USD / month) — internal tool, small team

Assumes ~tens of staff, hundreds of candidates, light traffic.

| Item | Lean start | Reliable production |
|------|------------|---------------------|
| Vercel | Hobby **$0** (limited) | **Pro $20**/user (use 1 seat) |
| Neon Postgres | Free / Launch **~$0–19** | **~$19–69** (Launch/Scale as data grows) |
| Supabase Storage | Free tier often enough | **Pro $25** if storage/auth limits hit |
| Resend | Free **3k emails/mo** | **$20** if volume grows |
| Cloudflare DNS | **$0** | **$0** |
| Domains | Already owned ≈ **$0** | or **~$12–15/year** |
| **Total** | **~$0–40/mo** | **~$65–135/mo** |

**Precise recommendation to quote the client**

- **Year 1 operating (lean but solid):** **~$80/month**
  - Vercel Pro $20
  - Neon Launch ~$19
  - Supabase Free→Pro buffer ~$0–25
  - Resend Free→$20
  - Round to **$80–100/mo** all-in cloud
- **One-time setup (implementation hours, not cloud):** DNS + Resend + Supabase + Neon + Vercel + UAT — typically **8–16 hours**; quote separately.
- **Annual cloud ballpark:** **~$1,000–1,500/year** at that reliable tier.

If they want **cheapest possible** and accept limits: Vercel Hobby + Neon Free + Supabase Free + Resend Free ≈ **$0–20/mo**, but weaker for a “reliable internal tool” (limits, less support).

---

## 7. What to do before Phase 4

**Minimum to unblock NDA locally**

1. Real Supabase URL + service role in `.env.local`
2. Private `documents` bucket
3. Restart `npm run dev`
4. Sign again as a test candidate

**Nice to have before Phase 4**

5. Resend key + verified `EMAIL_FROM` domain
6. Keep prod `ENABLE_NDA_GATE=false` until staging UAT passes

**Not required from client to continue Phase 4 coding**

- Full production deploy can wait; Phase 4 can continue on local Docker DB.

---

## 8. Bottom line for a client email

> We need: (1) portal/admin domains + DNS access, (2) email sending domain + From address + Resend, (3) Supabase for private files/NDA PDFs, (4) managed Postgres, (5) approved NDA legal text, (6) admin emails.  
> Recommended stack: Vercel + Neon + Supabase Storage + Resend + Cloudflare.  
> Expected cloud cost: about **$80–100/month** for a reliable small internal deployment.

---

## Related project files

- `.env.example` — full variable list
- `README.md` — local quick start and feature flags
- `docs/PHASE_03_TARGET_VERIFICATION.md` — Phase 3 verification / blockers
- `vercel.json` — Vercel build defaults
- `docker-compose.yml` — local Postgres

---

## 9. Phase 7 release gate

Before staging or production, run `npm run validate`, `npm run db:smoke`, and `npm run test:e2e`. GitHub Actions repeats these checks with PostgreSQL 16 and blocks the release when they fail.

Configure uptime checks for:

- `/api/health` every minute;
- `/api/health/ready` every five minutes with alerting on repeated `503` responses.

Use the runbooks in `docs/PRODUCTION_CHECKLIST.md`, `docs/BACKUP_AND_RESTORE.md`, `docs/UAT_CHECKLIST.md`, and `docs/INCIDENT_RESPONSE.md`. A successful code build is not production approval: client NDA content, Resend, private Supabase storage, managed database backups, domains, monitoring, and client UAT remain mandatory external gates.
