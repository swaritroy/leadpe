-- Password reset request tracking (manual admin workflow)
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  user_phone text NOT NULL,
  user_name text,
  user_type text NOT NULL DEFAULT 'business' CHECK (user_type IN ('business','coder')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','ignored')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  admin_note text
);

CREATE INDEX IF NOT EXISTS idx_prr_status_requested
  ON public.password_reset_requests (status, requested_at DESC);

ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins manage reset requests"
ON public.password_reset_requests
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Anyone can submit a reset request (login is locked, so we cannot require auth.uid())
CREATE POLICY "Anyone can submit reset request"
ON public.password_reset_requests
FOR INSERT
WITH CHECK (true);

-- Authenticated users can read their own
CREATE POLICY "Users read own reset requests"
ON public.password_reset_requests
FOR SELECT
USING (user_id IS NOT NULL AND user_id = auth.uid());
