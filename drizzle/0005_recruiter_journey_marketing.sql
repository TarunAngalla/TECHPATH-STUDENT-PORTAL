-- Phase 4: recruiter profiles, assignment history, journey evidence, and marketing lifecycle.

CREATE TABLE IF NOT EXISTS staff_profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'Talent Marketing Specialist',
  phone TEXT,
  timezone TEXT NOT NULL DEFAULT 'America/Chicago',
  max_active_candidates INTEGER NOT NULL DEFAULT 20,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT staff_profiles_capacity_positive CHECK (max_active_candidates > 0)
);

CREATE INDEX IF NOT EXISTS idx_staff_profiles_availability
  ON staff_profiles(is_available, max_active_candidates);

INSERT INTO staff_profiles(user_id, full_name)
SELECT
  u.id,
  initcap(replace(split_part(u.email, '@', 1), '.', ' '))
FROM users u
WHERE u.role IN ('admin', 'recruiter')
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE candidates
  ADD COLUMN IF NOT EXISTS marketing_status TEXT NOT NULL DEFAULT 'not_ready',
  ADD COLUMN IF NOT EXISTS marketing_ready_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_live_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_notes TEXT;

ALTER TABLE candidates
  DROP CONSTRAINT IF EXISTS candidates_marketing_status_check;
ALTER TABLE candidates
  ADD CONSTRAINT candidates_marketing_status_check
  CHECK (marketing_status IN ('not_ready', 'ready', 'live', 'paused', 'completed'));

ALTER TABLE candidates
  DROP CONSTRAINT IF EXISTS candidates_journey_stage_check;
ALTER TABLE candidates
  ADD CONSTRAINT candidates_journey_stage_check
  CHECK (journey_stage BETWEEN 0 AND 3);

CREATE INDEX IF NOT EXISTS idx_candidates_marketing_status
  ON candidates(marketing_status, marketing_live_at DESC);

UPDATE candidates
SET marketing_status = CASE WHEN journey_stage >= 2 THEN 'live' ELSE 'not_ready' END,
    marketing_live_at = CASE WHEN journey_stage >= 2 THEN COALESCE(marketing_live_at, created_at) ELSE marketing_live_at END
WHERE marketing_status = 'not_ready';

ALTER TABLE candidate_recruiter_assignments
  ADD COLUMN IF NOT EXISTS ended_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS end_reason TEXT;

WITH ranked_active AS (
  SELECT
    id,
    row_number() OVER (PARTITION BY candidate_id ORDER BY assigned_at DESC, id DESC) AS row_number
  FROM candidate_recruiter_assignments
  WHERE status = 'active'
)
UPDATE candidate_recruiter_assignments cra
SET status = 'ended',
    ended_at = COALESCE(cra.ended_at, now()),
    end_reason = COALESCE(cra.end_reason, 'Phase 4 duplicate-active-assignment cleanup')
FROM ranked_active ranked
WHERE cra.id = ranked.id AND ranked.row_number > 1;

CREATE UNIQUE INDEX IF NOT EXISTS candidate_recruiter_assignments_one_active
  ON candidate_recruiter_assignments(candidate_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_candidate_recruiter_assignments_active_workload
  ON candidate_recruiter_assignments(recruiter_id, assigned_at DESC)
  WHERE status = 'active';

INSERT INTO candidate_recruiter_assignments(
  candidate_id,
  recruiter_id,
  assigned_by,
  status,
  reason,
  assigned_at
)
SELECT
  c.id,
  c.recruiter_id,
  COALESCE(
    (SELECT u.id FROM users u WHERE u.role = 'admin' ORDER BY u.created_at LIMIT 1),
    c.recruiter_id
  ),
  'active',
  'Legacy assignment backfill',
  c.created_at
FROM candidates c
WHERE c.recruiter_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM candidate_recruiter_assignments cra
    WHERE cra.candidate_id = c.id AND cra.status = 'active'
  );

ALTER TABLE candidate_journey_events
  ADD COLUMN IF NOT EXISTS previous_stage SMALLINT,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS candidate_visible BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE candidate_journey_events
  DROP CONSTRAINT IF EXISTS candidate_journey_events_stage_check;
ALTER TABLE candidate_journey_events
  ADD CONSTRAINT candidate_journey_events_stage_check
  CHECK (stage BETWEEN 0 AND 3);

ALTER TABLE candidate_journey_events
  DROP CONSTRAINT IF EXISTS candidate_journey_events_previous_stage_check;
ALTER TABLE candidate_journey_events
  ADD CONSTRAINT candidate_journey_events_previous_stage_check
  CHECK (previous_stage IS NULL OR previous_stage BETWEEN 0 AND 3);

ALTER TABLE candidate_journey_events
  DROP CONSTRAINT IF EXISTS candidate_journey_events_source_check;
ALTER TABLE candidate_journey_events
  ADD CONSTRAINT candidate_journey_events_source_check
  CHECK (source IN ('manual', 'assignment', 'marketing', 'application', 'system'));

CREATE INDEX IF NOT EXISTS idx_candidate_journey_visible_history
  ON candidate_journey_events(candidate_id, candidate_visible, occurred_at DESC);

INSERT INTO candidate_journey_events(
  candidate_id,
  stage,
  previous_stage,
  event_type,
  source,
  note,
  candidate_visible,
  occurred_at,
  created_by
)
SELECT
  c.id,
  gs.stage,
  CASE WHEN gs.stage = 0 THEN NULL ELSE gs.stage - 1 END,
  'stage_reached',
  'system',
  CASE
    WHEN gs.stage = 0 THEN 'Legacy profile and onboarding milestone backfill'
    WHEN gs.stage = 1 THEN 'Legacy recruiter assignment milestone backfill'
    WHEN gs.stage = 2 THEN 'Legacy marketing launch milestone backfill'
    ELSE 'Legacy interview and assessment milestone backfill'
  END,
  true,
  c.created_at + (gs.stage * interval '1 second'),
  NULL
FROM candidates c
CROSS JOIN LATERAL generate_series(0, c.journey_stage) AS gs(stage)
WHERE NOT EXISTS (
  SELECT 1
  FROM candidate_journey_events cje
  WHERE cje.candidate_id = c.id AND cje.stage = gs.stage AND cje.event_type = 'stage_reached'
);
