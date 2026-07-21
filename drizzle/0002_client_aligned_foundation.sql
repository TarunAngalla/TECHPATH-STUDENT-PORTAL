ALTER TABLE users
  ADD COLUMN IF NOT EXISTS account_state TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 1;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_account_state_check') THEN
    ALTER TABLE users ADD CONSTRAINT users_account_state_check
      CHECK (account_state IN ('pending_setup', 'nda_pending', 'active', 'suspended'));
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS candidates_user_unique ON candidates(user_id);

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS role_interest TEXT,
  ADD COLUMN IF NOT EXISTS experience_summary TEXT,
  ADD COLUMN IF NOT EXISTS additional_information TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

DO $$
DECLARE fallback_staff_id UUID;
BEGIN
  SELECT id INTO fallback_staff_id FROM users
  WHERE role IN ('admin', 'recruiter')
  ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, created_at LIMIT 1;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'messages' AND column_name = 'candidate_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN IF NOT EXISTS receiver_id UUID;
    UPDATE messages m SET receiver_id = CASE
      WHEN m.sender_role = 'candidate' THEN COALESCE(c.recruiter_id, fallback_staff_id, m.sender_id)
      ELSE c.user_id END
    FROM candidates c WHERE c.id = m.candidate_id AND m.receiver_id IS NULL;
    UPDATE messages SET receiver_id = sender_id WHERE receiver_id IS NULL;
    ALTER TABLE messages ALTER COLUMN receiver_id SET NOT NULL;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_receiver_id_users_id_fk') THEN
      ALTER TABLE messages ADD CONSTRAINT messages_receiver_id_users_id_fk
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    DROP INDEX IF EXISTS idx_messages_candidate;
    ALTER TABLE messages DROP COLUMN IF EXISTS candidate_id;
    ALTER TABLE messages DROP COLUMN IF EXISTS sender_role;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'messages_sender_id_users_id_fk') THEN
    ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
    ALTER TABLE messages ADD CONSTRAINT messages_sender_id_users_id_fk
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id, sent_at);
ALTER TABLE message_reads DROP COLUMN IF EXISTS candidate_id;
DROP INDEX IF EXISTS idx_message_reads_user;
CREATE INDEX IF NOT EXISTS idx_message_reads_user ON message_reads(user_id);

ALTER TABLE documents ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE documents ALTER COLUMN file_url DROP NOT NULL;
UPDATE documents SET storage_path = regexp_replace(file_url, '^.*?/storage/v1/object/public/documents/', '')
WHERE storage_path IS NULL AND file_url LIKE '%/storage/v1/object/public/documents/%';
CREATE INDEX IF NOT EXISTS idx_documents_candidate ON documents(candidate_id, uploaded_at DESC);

CREATE TABLE IF NOT EXISTS candidate_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE, expires_at TIMESTAMPTZ NOT NULL, used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ, created_by UUID NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_candidate_invites_candidate ON candidate_invites(candidate_id, created_at DESC);

CREATE TABLE IF NOT EXISTS nda_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), version TEXT NOT NULL UNIQUE, title TEXT NOT NULL,
  content TEXT NOT NULL, document_hash TEXT NOT NULL, effective_from TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false, created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_nda_templates_active ON nda_templates(is_active, effective_from DESC);
CREATE UNIQUE INDEX IF NOT EXISTS nda_templates_one_active ON nda_templates ((is_active)) WHERE is_active = true;
CREATE TABLE IF NOT EXISTS candidate_nda_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES nda_templates(id), status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'signed', 'revoked')), presented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ, signer_name TEXT, signer_ip TEXT, signer_user_agent TEXT, consent_text TEXT,
  signed_document_path TEXT, signed_document_hash TEXT, email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT candidate_nda_candidate_template_unique UNIQUE (candidate_id, template_id)
);
CREATE INDEX IF NOT EXISTS idx_candidate_nda_status ON candidate_nda_agreements(candidate_id, status);

CREATE TABLE IF NOT EXISTS candidate_recruiter_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  recruiter_id UUID NOT NULL REFERENCES users(id), assigned_by UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')), reason TEXT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(), ended_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_candidate_recruiter_assignments_candidate ON candidate_recruiter_assignments(candidate_id, assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_candidate_recruiter_assignments_recruiter ON candidate_recruiter_assignments(recruiter_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS candidate_recruiter_one_active ON candidate_recruiter_assignments(candidate_id) WHERE status = 'active';
INSERT INTO candidate_recruiter_assignments(candidate_id, recruiter_id, assigned_by, status, assigned_at)
SELECT c.id, c.recruiter_id, c.recruiter_id, 'active', c.created_at FROM candidates c
WHERE c.recruiter_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM candidate_recruiter_assignments a WHERE a.candidate_id = c.id AND a.status = 'active'
);

CREATE TABLE IF NOT EXISTS candidate_journey_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  stage SMALLINT NOT NULL, event_type TEXT NOT NULL DEFAULT 'stage_reached'
    CHECK (event_type IN ('stage_reached', 'stage_reopened', 'note')), note TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(), created_by UUID REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_candidate_journey_events ON candidate_journey_events(candidate_id, occurred_at DESC);
INSERT INTO candidate_journey_events(candidate_id, stage, event_type, occurred_at, created_by)
SELECT c.id, c.journey_stage, 'stage_reached', c.created_at, c.recruiter_id FROM candidates c
WHERE NOT EXISTS (SELECT 1 FROM candidate_journey_events e WHERE e.candidate_id = c.id);

CREATE TABLE IF NOT EXISTS application_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('application_submitted', 'status_change', 'interview', 'assessment', 'note')),
  title TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled', 'rescheduled', 'passed', 'failed')),
  scheduled_at TIMESTAMPTZ, occurred_at TIMESTAMPTZ, result TEXT, with_person TEXT, meeting_link TEXT,
  preparation_notes TEXT, internal_notes TEXT, created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_application_events_application ON application_events(application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_application_events_candidate ON application_events(candidate_id, event_type, status);
CREATE INDEX IF NOT EXISTS idx_application_events_schedule ON application_events(scheduled_at) WHERE scheduled_at IS NOT NULL;
INSERT INTO application_events(application_id, candidate_id, event_type, title, status, occurred_at, created_at, updated_at)
SELECT a.id, a.candidate_id, 'application_submitted', 'Application submitted to ' || a.company_name,
  'completed', a.date_applied::timestamptz, a.created_at, a.updated_at FROM applications a
WHERE NOT EXISTS (SELECT 1 FROM application_events e WHERE e.application_id = a.id AND e.event_type = 'application_submitted');
