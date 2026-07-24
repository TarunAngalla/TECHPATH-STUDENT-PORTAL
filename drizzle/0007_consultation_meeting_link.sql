ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS consultation_meeting_link TEXT;
