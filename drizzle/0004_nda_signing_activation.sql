ALTER TABLE candidate_nda_agreements
  ADD COLUMN IF NOT EXISTS signing_provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_envelope_id TEXT,
  ADD COLUMN IF NOT EXISTS signing_started_at TIMESTAMPTZ;

ALTER TABLE candidate_nda_agreements
  DROP CONSTRAINT IF EXISTS candidate_nda_agreements_status_check;
ALTER TABLE candidate_nda_agreements
  ADD CONSTRAINT candidate_nda_agreements_status_check
  CHECK (status IN ('pending', 'signing', 'signed', 'superseded', 'revoked'));

ALTER TABLE email_delivery_logs
  DROP CONSTRAINT IF EXISTS email_delivery_logs_email_type_check;
ALTER TABLE email_delivery_logs
  ADD CONSTRAINT email_delivery_logs_email_type_check
  CHECK (email_type IN (
    'enquiry_acknowledgement',
    'new_enquiry_admin',
    'lead_rejection',
    'candidate_invite',
    'candidate_invite_resend',
    'nda_signed_candidate'
  ));

ALTER TABLE email_delivery_logs
  ADD COLUMN IF NOT EXISTS related_nda_agreement_id UUID
    REFERENCES candidate_nda_agreements(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_email_delivery_logs_nda
  ON email_delivery_logs(related_nda_agreement_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_candidate_nda_template_status
  ON candidate_nda_agreements(template_id, status, accepted_at DESC);

CREATE INDEX IF NOT EXISTS idx_candidate_nda_signing_recovery
  ON candidate_nda_agreements(status, signing_started_at)
  WHERE status = 'signing';

CREATE OR REPLACE FUNCTION protect_signed_nda_evidence()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IN ('signed', 'superseded') THEN
    -- Finalized agreements may only move between signed and superseded (reactivation / supersession).
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NEW.status NOT IN ('signed', 'superseded') THEN
      RAISE EXCEPTION 'Finalized NDA status transitions are limited to signed and superseded';
    END IF;

    IF (
      NEW.candidate_id IS DISTINCT FROM OLD.candidate_id OR
      NEW.template_id IS DISTINCT FROM OLD.template_id OR
      NEW.presented_at IS DISTINCT FROM OLD.presented_at OR
      NEW.accepted_at IS DISTINCT FROM OLD.accepted_at OR
      NEW.signer_name IS DISTINCT FROM OLD.signer_name OR
      NEW.signer_ip IS DISTINCT FROM OLD.signer_ip OR
      NEW.signer_user_agent IS DISTINCT FROM OLD.signer_user_agent OR
      NEW.consent_text IS DISTINCT FROM OLD.consent_text OR
      NEW.signing_provider IS DISTINCT FROM OLD.signing_provider OR
      NEW.provider_envelope_id IS DISTINCT FROM OLD.provider_envelope_id OR
      NEW.signing_started_at IS DISTINCT FROM OLD.signing_started_at OR
      NEW.signed_document_path IS DISTINCT FROM OLD.signed_document_path OR
      NEW.signed_document_hash IS DISTINCT FROM OLD.signed_document_hash OR
      NEW.created_at IS DISTINCT FROM OLD.created_at
    ) THEN
      RAISE EXCEPTION 'Signed NDA evidence is immutable';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS candidate_nda_signed_evidence_immutable
  ON candidate_nda_agreements;
CREATE TRIGGER candidate_nda_signed_evidence_immutable
BEFORE UPDATE ON candidate_nda_agreements
FOR EACH ROW
EXECUTE FUNCTION protect_signed_nda_evidence();
