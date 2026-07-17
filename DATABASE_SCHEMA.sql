-- The Tech Path — Database Schema (PostgreSQL)
-- Reflects REQUIREMENTS.md exactly. No NDA tables. No separate
-- interviews/assessments tables — those concepts live on `applications`.

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ─────────────────────────────────────────────────────────
-- Auth & people
-- ─────────────────────────────────────────────────────────

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('candidate', 'recruiter', 'admin')),
  first_login   BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE candidates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name      TEXT NOT NULL,
  phone          TEXT,
  opt_type       TEXT NOT NULL CHECK (opt_type IN ('OPT', 'STEM_OPT')),
  journey_stage  SMALLINT NOT NULL DEFAULT 0, -- index into: 0 Resume/profile training, 1 Recruiter assigned, 2 Marketing launched, 3 Interviews & assessments
  recruiter_id   UUID REFERENCES users(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- Lead intake (public site enquiries / consultation bookings)
-- ─────────────────────────────────────────────────────────

CREATE TABLE leads (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                   TEXT NOT NULL,
  email                  TEXT NOT NULL,
  phone                  TEXT,
  opt_type               TEXT CHECK (opt_type IN ('OPT', 'STEM_OPT')),
  source                 TEXT NOT NULL CHECK (source IN ('enquiry_form', 'consultation_booked')),
  status                 TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'rejected', 'converted')),
  notes                  TEXT NOT NULL DEFAULT '',
  converted_candidate_id UUID REFERENCES candidates(id),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- Applications — THE core table. Status field replaces what would
-- otherwise be separate interviews/assessments tables. upcoming_*
-- fields power the candidate's derived "Upcoming" view.
-- ─────────────────────────────────────────────────────────

CREATE TABLE applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id        UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  app_no              TEXT NOT NULL, -- e.g. "APP-001", generated per candidate
  company_name        TEXT NOT NULL,
  role_title          TEXT NOT NULL,
  date_applied        DATE NOT NULL,
  status              TEXT NOT NULL CHECK (status IN (
                         'applied', 'assessment', 'interview_r1', 'interview_r2',
                         'interview_r3', 'hr_round', 'final_round',
                         'decision_pending', 'offer', 'rejected'
                       )),
  comment             TEXT NOT NULL DEFAULT '', -- plain saved note, shared both ways — NOT a chat thread
  upcoming_label       TEXT,       -- e.g. "Round 2 — Technical"
  upcoming_when        TIMESTAMPTZ,
  upcoming_with_person  TEXT,
  upcoming_prep         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, app_no)
);

-- ─────────────────────────────────────────────────────────
-- Trainings
-- ─────────────────────────────────────────────────────────

CREATE TABLE trainings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('video', 'pdf')),
  content_url TEXT
);

CREATE TABLE candidate_trainings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id  UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  training_id   UUID NOT NULL REFERENCES trainings(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'completed')),
  completed_at  TIMESTAMPTZ,
  UNIQUE (candidate_id, training_id)
);

-- ─────────────────────────────────────────────────────────
-- Documents (resume, handbook, STEM compliance docs)
-- ─────────────────────────────────────────────────────────

CREATE TABLE documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id  UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL CHECK (category IN ('resume', 'handbook', 'stem_compliance', 'other')),
  file_url      TEXT NOT NULL,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- Announcements (broadcast or targeted) + read tracking
-- ─────────────────────────────────────────────────────────

CREATE TABLE announcements (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                TEXT NOT NULL,
  body                 TEXT NOT NULL,
  target_candidate_id  UUID REFERENCES candidates(id), -- NULL = broadcast to all
  created_by           UUID NOT NULL REFERENCES users(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE announcement_reads (
  announcement_id  UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  candidate_id     UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  read_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (announcement_id, candidate_id)
);

-- ─────────────────────────────────────────────────────────
-- Messages — general recruiter <-> candidate chat.
-- This is separate from `applications.comment` on purpose:
-- messages are conversational and not tied to one job.
-- ─────────────────────────────────────────────────────────

CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id  UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  sender_role   TEXT NOT NULL CHECK (sender_role IN ('candidate', 'recruiter')),
  sender_id     UUID NOT NULL REFERENCES users(id),
  body          TEXT NOT NULL,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- Password audit — REQUIRED. Every reset/change, of any kind,
-- writes here. Candidate settings page and admin candidate-detail
-- page both read from this same table.
-- ─────────────────────────────────────────────────────────

CREATE TABLE password_change_log (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  changed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  method             TEXT NOT NULL CHECK (method IN ('forced_first_login', 'self_service', 'admin_reset')),
  changed_by_user_id UUID NOT NULL REFERENCES users(id)
);

-- ─────────────────────────────────────────────────────────
-- General admin audit trail (sign-ins, permission changes, etc.)
-- ─────────────────────────────────────────────────────────

CREATE TABLE audit_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id  UUID NOT NULL REFERENCES users(id),
  action         TEXT NOT NULL,
  target_table   TEXT,
  target_id      UUID,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────
-- Indexes worth having from day one
-- ─────────────────────────────────────────────────────────

CREATE INDEX idx_applications_candidate ON applications(candidate_id);
CREATE INDEX idx_applications_upcoming ON applications(upcoming_when) WHERE upcoming_when IS NOT NULL;
CREATE INDEX idx_messages_candidate ON messages(candidate_id, sent_at);
CREATE INDEX idx_candidates_recruiter ON candidates(recruiter_id);
CREATE INDEX idx_leads_status ON leads(status);
