-- Phase 5: company applications, interview rounds, assessments, and trustworthy metrics.

ALTER TABLE applications ADD COLUMN IF NOT EXISTS job_location TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS employment_type TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS application_source TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS job_url TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS external_reference TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS submitted_by UUID REFERENCES users(id);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS candidate_visible_notes TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS internal_notes TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS next_action_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;

UPDATE applications
SET candidate_visible_notes = NULLIF(comment, '')
WHERE candidate_visible_notes IS NULL AND comment <> '';

UPDATE applications a
SET submitted_by = c.recruiter_id
FROM candidates c
WHERE a.candidate_id = c.id AND a.submitted_by IS NULL AND c.recruiter_id IS NOT NULL;

DO $$
DECLARE constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = current_schema()
      AND t.relname = 'applications'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE applications DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE applications
  ADD CONSTRAINT applications_status_check CHECK (status IN (
    'draft', 'applied', 'submitted', 'under_review', 'assessment',
    'interview_r1', 'interview_r2', 'interview_r3', 'hr_round',
    'final_round', 'decision_pending', 'offer', 'hired', 'rejected',
    'withdrawn', 'on_hold', 'closed'
  ));

ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_priority_check;
ALTER TABLE applications
  ADD CONSTRAINT applications_priority_check CHECK (priority IN ('low', 'normal', 'high'));

CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_submitted_by ON applications(submitted_by, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_next_action ON applications(next_action_at) WHERE next_action_at IS NOT NULL;

ALTER TABLE application_events ADD COLUMN IF NOT EXISTS activity_type TEXT;
ALTER TABLE application_events ADD COLUMN IF NOT EXISTS event_key TEXT;
ALTER TABLE application_events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE application_events ADD COLUMN IF NOT EXISTS scheduled_end_at TIMESTAMPTZ;
ALTER TABLE application_events ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE application_events ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE application_events ADD COLUMN IF NOT EXISTS score TEXT;
ALTER TABLE application_events ADD COLUMN IF NOT EXISTS round_number INTEGER;
ALTER TABLE application_events ADD COLUMN IF NOT EXISTS round_name TEXT;
ALTER TABLE application_events ADD COLUMN IF NOT EXISTS company_contact_name TEXT;
ALTER TABLE application_events ADD COLUMN IF NOT EXISTS company_contact_email TEXT;
ALTER TABLE application_events ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE application_events ADD COLUMN IF NOT EXISTS external_url TEXT;
ALTER TABLE application_events ADD COLUMN IF NOT EXISTS candidate_visible_notes TEXT;
ALTER TABLE application_events ADD COLUMN IF NOT EXISTS candidate_visible BOOLEAN NOT NULL DEFAULT true;

UPDATE application_events
SET completed_at = COALESCE(completed_at, occurred_at)
WHERE status IN ('completed', 'passed', 'failed') AND completed_at IS NULL;

UPDATE application_events
SET candidate_visible_notes = preparation_notes
WHERE candidate_visible_notes IS NULL AND preparation_notes IS NOT NULL;

DO $$
DECLARE constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = current_schema()
      AND t.relname = 'application_events'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE application_events DROP CONSTRAINT %I', constraint_name);
  END LOOP;
END $$;

ALTER TABLE application_events
  ADD CONSTRAINT application_events_status_check CHECK (status IN (
    'pending', 'assigned', 'scheduled', 'confirmed', 'in_progress',
    'submitted', 'completed', 'cancelled', 'rescheduled', 'no_show',
    'feedback_pending', 'result_pending', 'expired', 'passed', 'failed'
  ));

ALTER TABLE application_events DROP CONSTRAINT IF EXISTS application_events_round_number_check;
ALTER TABLE application_events
  ADD CONSTRAINT application_events_round_number_check CHECK (round_number IS NULL OR round_number > 0);

CREATE UNIQUE INDEX IF NOT EXISTS application_events_event_key_unique
  ON application_events(application_id, event_key)
  WHERE event_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_application_events_schedule_v2
  ON application_events(event_type, scheduled_at)
  WHERE scheduled_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_application_events_candidate_visibility
  ON application_events(candidate_id, candidate_visible, event_type, created_at DESC);

ALTER TABLE announcements ADD COLUMN IF NOT EXISTS source_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS announcements_source_key_unique
  ON announcements(source_key) WHERE source_key IS NOT NULL;

-- Preserve legacy upcoming data as proper interview/assessment events without duplicating records.
INSERT INTO application_events(
  application_id, candidate_id, event_type, activity_type, event_key, title, status,
  scheduled_at, timezone, with_person, preparation_notes, candidate_visible_notes,
  candidate_visible, created_at, updated_at
)
SELECT
  a.id,
  a.candidate_id,
  CASE WHEN a.status = 'assessment' THEN 'assessment' ELSE 'interview' END,
  CASE WHEN a.status = 'assessment' THEN 'technical_test' ELSE 'other' END,
  'legacy-upcoming',
  COALESCE(a.upcoming_label, CASE WHEN a.status = 'assessment' THEN 'Assessment' ELSE 'Interview' END),
  'scheduled',
  a.upcoming_when,
  'UTC',
  a.upcoming_with_person,
  a.upcoming_prep,
  a.upcoming_prep,
  true,
  a.created_at,
  a.updated_at
FROM applications a
WHERE a.upcoming_when IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM application_events e
    WHERE e.application_id = a.id AND e.event_key = 'legacy-upcoming'
  );
