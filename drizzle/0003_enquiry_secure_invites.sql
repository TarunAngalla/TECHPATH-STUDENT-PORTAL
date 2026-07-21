ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS consultation_status TEXT NOT NULL DEFAULT 'not_scheduled',
  ADD COLUMN IF NOT EXISTS consultation_scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consultation_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS consultation_notes TEXT NOT NULL DEFAULT '';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leads_consultation_status_check') THEN
    ALTER TABLE leads ADD CONSTRAINT leads_consultation_status_check
      CHECK (consultation_status IN ('not_scheduled', 'scheduled', 'completed', 'cancelled', 'no_show'));
  END IF;
END $$;

UPDATE leads
SET consultation_status = CASE
  WHEN source = 'consultation_booked' AND status IN ('qualified', 'converted') THEN 'completed'
  WHEN source = 'consultation_booked' THEN 'scheduled'
  ELSE consultation_status
END
WHERE consultation_status = 'not_scheduled';

CREATE INDEX IF NOT EXISTS idx_leads_consultation
  ON leads(consultation_status, consultation_scheduled_at);

CREATE TABLE IF NOT EXISTS public_request_rate_limits (
  key_hash TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_public_request_rate_limits_updated
  ON public_request_rate_limits(updated_at);

CREATE TABLE IF NOT EXISTS email_delivery_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type TEXT NOT NULL CHECK (email_type IN (
    'enquiry_acknowledgement',
    'new_enquiry_admin',
    'lead_rejection',
    'candidate_invite',
    'candidate_invite_resend'
  )),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'logged', 'failed')),
  provider_message_id TEXT,
  error_message TEXT,
  related_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  related_candidate_id UUID REFERENCES candidates(id) ON DELETE SET NULL,
  related_invite_id UUID REFERENCES candidate_invites(id) ON DELETE SET NULL,
  attempt_count INTEGER NOT NULL DEFAULT 1 CHECK (attempt_count > 0),
  last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_recipient
  ON email_delivery_logs(recipient, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_lead
  ON email_delivery_logs(related_lead_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_candidate
  ON email_delivery_logs(related_candidate_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_invite
  ON email_delivery_logs(related_invite_id, created_at DESC);

ALTER TABLE password_change_log
  DROP CONSTRAINT IF EXISTS password_change_log_method_check;
ALTER TABLE password_change_log
  ADD CONSTRAINT password_change_log_method_check
  CHECK (method IN ('forced_first_login', 'self_service', 'admin_reset', 'secure_invite'));
