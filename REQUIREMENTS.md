# CLIENT-ALIGNED OVERRIDE — AUTHORITATIVE

The latest approved client workflow and screens supersede conflicting statements in the legacy specification below. TechPath is a private candidate marketing and placement-progress portal with **admin, recruiter, and candidate** roles. Approved candidates complete secure account setup and the active NDA before full portal access. Candidate business information is view-only by default; staff own verified progress, application, interview, assessment, training, and document updates. Official offer letters, payroll, timesheets, and employment compliance remain on Radxsys. See `docs/CLIENT_ALIGNED_SCOPE.md` and `docs/ROLE_PERMISSION_MATRIX.md`.

---

# The Tech Path — Candidate & Admin Portal: Requirements

## 1. What this is

A staffing/placement platform for OPT and STEM OPT candidates, consisting of **two separate authenticated products** sharing one database:

- **Candidate Portal** (`portal.thetechpath.com`) — where a candidate tracks their own job search
- **Admin Console** (`admin.thetechpath.com`) — where recruiters/staff manage every candidate

The **existing public marketing site** (thetechpath.com) is not part of this build — it stays as-is, except it needs one new button: **"Candidate Portal"**, linking to the candidate portal's login page.

An **NDA access gate is required** after secure account setup and before full candidate portal access. Phase 3 implements a typed-legal-name provider behind the `NdaSigningProvider` interface, with consent, timestamp, IP/user-agent evidence, immutable template and PDF hashes, private PDF storage, and candidate email confirmation. Client/legal approval of this signing method remains a production-release requirement; an external e-signature adapter can replace it without changing the workflow state machine.

---

## 2. The single non-negotiable architectural rule

**One data source, two read/write surfaces.**

Every piece of data a candidate sees must be the exact same record an admin edits — never a duplicated or parallel copy. Concretely:

- An `applications` row is edited by admin (status dropdown, comment field, interview scheduling fields) and read by the candidate on their own Applications table. Same row, same fields.
- There is **no separate "interviews" table** and **no separate "assessments" table**. Both concepts collapsed into the `applications.status` field plus a small set of `upcoming_*` fields on the same row (see schema). This was a deliberate simplification after early prototyping showed a disconnected interviews/assessments model would drift out of sync with the status field.
- The candidate's "Upcoming" page is a **derived, filtered, sorted view** of applications that have `upcoming` data — not its own dataset.
- Comments on an application are a **single plain saved text field**, editable by authorized staff and read-only for candidates by default — explicitly **not** a chat thread. (General recruiter↔candidate conversation that isn't tied to one job lives separately in `messages`.)

If a future feature request would create a second place to store or edit something that already lives on `applications`, `candidates`, or `users` — push back and fold it into the existing record instead.

---

## 3. Auth flow (candidate side)

1. Candidate never self-registers. A public visitor submits an enquiry; admin reviews the consultation and approves or rejects portal access.
2. On approval, admin creates the candidate account. The system creates an unusable placeholder credential and sends an expiring, single-use secure setup link. Temporary passwords must never be displayed or emailed.
3. Candidate opens `/setup-account?token=...`, chooses a password, and the token is atomically consumed. `password_change_log.method = secure_invite` is written and `session_version` increments.
4. Route through the centralized access evaluator: account setup first, then active NDA signing, then **Dashboard**.
5. Candidates can change their password again later from Account Settings (`self_service`). Legacy pre-invitation accounts may still use the forced-reset route until migrated.
6. Every successful password change must write to `password_change_log`, because admin needs an auditable password-change history per candidate.

## 4. Candidate Portal — pages

Sidebar is **grouped**, not a flat list:

```
Overview
  Dashboard
  My Progress
Job Search
  Applications
  Upcoming
Resources
  Trainings
  Documents
  Announcements
Support
  Messages
  Help & Support
Account
  Account Settings
```

### Dashboard (home)
- Hero: candidate name, one-line status, "Profile last updated {date}"
- **Next-up banner**: soonest item with `upcoming` data across all applications, computed dynamically (days-until), with an **"Add to calendar" button that generates a real downloadable `.ics` file** client-side (no backend call needed for this)
- Onboarding checklist widget (e.g., set password, first interview attended, trainings) with a progress bar
- 3 stat cards, each clickable, each computed live from `applications` (not hardcoded): Applications submitted / In interview process / Upcoming this month
- Recruiter card (photo, name, contact, a note, "Message {recruiter}" button → Messages page)
- Announcements preview (latest 2, "View all")
- **Empty state**: if a candidate has zero applications yet, replace the whole dashboard body with a single "your recruiter is setting up your profile" message — do not show broken-looking zeroed stat cards.

### My Progress
Big version of the journey stepper (4 stages: Resume & profile training → Recruiter assigned → Marketing launched → Interviews & assessments) plus a dated vertical timeline with recruiter notes per stage.

### Applications
**A row-wise table, not cards.** Columns exactly:

| App No. | Company / role | Date applied | Status | Comments |

- Search by company/role, filter by status
- Status is a single dropdown-driven field with exactly these options: `Applied, Assessment, Interview Round 1, Interview Round 2, Interview Round 3, HR Round, Final Round, Decision Pending, Offer, Rejected`
- Comments column is a plain textarea, saves on blur, shared bidirectionally with admin — **no chat UI, no message bubbles, no per-message timestamps here**
- Per-company colored initial badges (not a generic building icon) — derive color deterministically from company name so it's consistent without needing per-company config

### Upcoming
**Derived, not separate data.** Filters `applications` for rows with `upcoming` populated, sorted by date ascending. Each shown as a card: company, `upcoming.label`, date/time, `upcoming.with_person`, `upcoming.prep`. Empty state if nothing scheduled.

### Trainings
Two sections, Upcoming / Completed. Each row: title, type icon (video/pdf), View or Download action.

### Documents
Core docs (resume, handbook) always shown. **STEM compliance section only renders if `candidates.opt_type = 'STEM_OPT'`.** Persistent footer note: "All official offer letters, payroll, timesheets, and compliance documents are managed securely on radxsys.com" — this product must never grow features for offer letters, payroll, or timesheets.

### Announcements
Chronological feed. Unread items get a highlighted background + "New" tag, driven by a real `announcement_reads` join, not decorative.

### Messages
General-purpose chat thread with the assigned recruiter. Message bubbles, sender-aligned, input + send. This is the *only* page that behaves like a chat.

### Help & Support
FAQ accordion. Escalation card at the bottom routes into Messages — never a dead end.

### Account Settings
- Profile fields: name/email read-only, phone editable
- **Password change section**: current/new/confirm fields, and a "Last changed: {date} · {method}" line reflecting the same `password_change_log` admin sees

## 5. Admin Console — pages

Sidebar:

```
Overview
  Dashboard
Recruiting
  Leads Inbox
  Candidates
Content
  Trainings Library
  Announcements
Insights
  Reports
Admin
  Team & Permissions
  Account Settings
```

### Admin Login
Separate from candidate login. Restrict to the company email domain. Every sign-in and permission change is logged (state this to the user on the login screen itself, as a trust signal).

### Dashboard
Hero + 4 stat cards (New leads / Active candidates / Interviews this week / Unread candidate messages), all computed from real data, not hardcoded. Pipeline funnel bar chart (Enquiries → Consultations booked → Active candidates → Placed). Recruiter workload list. Recent activity feed that references real candidate-level events (e.g. "Ravi Kumar sent a new message").

### Leads Inbox
Table/list of enquiries and consultation bookings. Status: `New → Contacted → Qualified → Rejected → Converted` (a "Converted" lead becomes a real candidate and should disappear from this default view). Approve (green check) advances status; Reject (red X) rejects. Internal notes field per lead (plain saved text, same pattern as application comments).

**When an enquiry reaches Qualified**, show an inline **"Create candidate portal account"** panel:
- Login email locked to the enquiry email
- Optional initial recruiter assignment
- "Create account and send invite" creates the `users`/`candidates` rows, flips the enquiry to Converted, revokes previous active invitations, and sends an expiring single-use account-setup link
- No temporary password is generated for staff, displayed in the UI, written to logs, or emailed

### Candidates (list)
Table: candidate name+avatar, recruiter, journey stage, application count, last activity. Row click → Candidate Detail.

### Candidate Detail
The busiest page. Header has recruiter-reassignment and journey-stage dropdowns (these directly drive what the candidate's own dashboard shows). Below that, **tabs**, not a long scroll:

- **Profile** — journey stepper mirrored from the candidate's own view
- **Applications** — same table as candidate side, but every field editable (status dropdown, comment textarea), plus "Add application"
- **Documents** — list + upload
- **Trainings** — assign/mark complete
- **Messages** — admin's side of the exact same thread the candidate sees, with a reply box
- **Account & Security** — account state, invitation status, resend/revoke invitation controls for admins, and full password-change history

### Trainings Library
Shared catalog of modules (video/pdf), assigned per-candidate from here — modules are not recreated per candidate.

### Announcements Composer
Broadcast to all or target one candidate. Feeds the same `announcements` table the candidate Announcements page reads.

### Reports
Pipeline funnel detail, recruiter workload, placement stats. This is the one page with no candidate-facing equivalent.

### Team & Permissions
Recruiter/admin accounts, role assignment (see open question below).

---

## 6. Open decision to make before building permissions

**Does every recruiter see every candidate, or only their own assigned candidates (with a separate full-admin role seeing everything)?** This determines whether Candidates List needs a hard row-level access filter. Decide before implementing auth middleware.

---

## 7. Accessibility — treat as required, not polish

- Every interactive element needs a visible focus-visible outline (a global focus-ring style is sufficient — don't rely on browser defaults, they've been reset)
- Real semantic landmarks: `<header>`, `<nav aria-label>`, `<main>`, `<aside>` for the sidebar
- `aria-current="page"` on the active sidebar nav item
- Icon-only buttons (hamburger, notification bell, close) need real `aria-label`s, not just a tooltip
- Save/update confirmations need `role="status" aria-live="polite"`
- Decorative icons get `aria-hidden="true"`
- Notification badges should show real unread counts, not a static dot

## 8. Non-goals (keep the product simple — these were deliberately cut)

- NDA template/signature tracking and portal gating are required; the typed-name provider is implemented, but production use still requires client/legal approval of the signature method and agreement text
- No separate Interviews page or Assessments page as distinct data models
- No comment/chat thread on individual applications — plain saved text only
- No offer letter, payroll, or timesheet functionality (that's radxsys.com's job)
- No automatic public candidate account creation; public enquiries require admin approval and a secure invitation

## Phase 4 operational requirements

- Recruiter assignments must be historical and auditable; `candidates.recruiter_id` is only the current assignment pointer.
- Only one active recruiter assignment may exist per candidate.
- Admins manage assignment and recruiter capacity. Recruiters access only their current assigned candidates.
- Candidate journey dates and notes must come from `candidate_journey_events`, not synthetic dates.
- Candidate marketing has an explicit lifecycle: `not_ready`, `ready`, `live`, `paused`, `completed`.
- Marketing launch requires an active candidate account/NDA, active recruiter assignment, resume on file, and candidate contact details.
- Recruiter contact details shown to candidates must come from staff profile data.

## Phase 5 — Verified application activity

- Staff records each candidate-company-role submission as one application.
- Interview rounds and assessments are child activity events; the parent application stores only the current summary.
- Status changes and history writes occur in one transaction.
- Recruiters may manage only applications for assigned candidates; admins have organization-wide access.
- Candidates have view-only access to their own candidate-visible application, interview, and assessment data.
- Internal notes are never serialized to candidate pages.
- Dashboard metrics count real completed/scheduled events rather than inferring history from one current status.
