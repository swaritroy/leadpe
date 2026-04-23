CREATE TABLE public.auth_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text,
  event text NOT NULL,
  intent text,
  previous_role text,
  new_role text,
  promoted boolean DEFAULT false,
  redirect_to text,
  details jsonb DEFAULT '{}'::jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_auth_events_user_id ON public.auth_events(user_id);
CREATE INDEX idx_auth_events_created_at ON public.auth_events(created_at DESC);
CREATE INDEX idx_auth_events_event ON public.auth_events(event);

ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all auth_events"
  ON public.auth_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users read own auth_events"
  ON public.auth_events FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Authenticated insert own auth_events"
  ON public.auth_events FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Service role manages auth_events"
  ON public.auth_events FOR ALL
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');