-- PART 1: 21-Day Trial System columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_started_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS growth_started_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS growth_ends_at timestamptz;

-- Backfill from existing trial_start_date / trial_end_date
UPDATE public.profiles
SET trial_started_at = COALESCE(trial_started_at, trial_start_date, created_at),
    trial_ends_at = COALESCE(trial_ends_at, trial_end_date, created_at + interval '21 days')
WHERE trial_started_at IS NULL OR trial_ends_at IS NULL;

-- PART 2: Demo vs Live deployment columns on build_requests
ALTER TABLE public.build_requests ADD COLUMN IF NOT EXISTS live_url text;
ALTER TABLE public.build_requests ADD COLUMN IF NOT EXISTS demo_deployed_at timestamptz;
ALTER TABLE public.build_requests ADD COLUMN IF NOT EXISTS live_deployed_at timestamptz;

-- PART 3: Admin messages inbox
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_type text,
  from_id uuid,
  from_name text,
  to_type text DEFAULT 'admin',
  to_id uuid,
  message text NOT NULL,
  meta jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all messages"
  ON public.messages FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update messages"
  ON public.messages FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone authenticated can insert messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System (service_role) inserts messages"
  ON public.messages FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON public.messages(read) WHERE read = false;

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;