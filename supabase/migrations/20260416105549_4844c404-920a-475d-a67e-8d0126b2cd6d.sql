
-- Add monthly change tracking to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_changes_used integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS changes_reset_date date DEFAULT CURRENT_DATE;

-- Create change_requests table
CREATE TABLE IF NOT EXISTS public.change_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid NOT NULL,
  description text,
  type text,
  status text DEFAULT 'pending',
  requested_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own change requests"
ON public.change_requests FOR SELECT
USING (business_id = auth.uid());

CREATE POLICY "Users insert own change requests"
ON public.change_requests FOR INSERT
WITH CHECK (business_id = auth.uid());

CREATE POLICY "Admins manage all change requests"
ON public.change_requests FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
