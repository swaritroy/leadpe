ALTER TABLE message_log ADD COLUMN IF NOT EXISTS delivery_status text DEFAULT 'queued';
ALTER TABLE message_log ADD COLUMN IF NOT EXISTS twilio_sid text;
ALTER TABLE message_log ADD COLUMN IF NOT EXISTS error_message text;