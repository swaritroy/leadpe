ALTER TABLE public.scheduled_messages
  ADD COLUMN IF NOT EXISTS recipient_type text DEFAULT 'client',
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS whatsapp_url text,
  ADD COLUMN IF NOT EXISTS business_id uuid;

CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status_recipient
  ON public.scheduled_messages (status, recipient_type, created_at DESC);