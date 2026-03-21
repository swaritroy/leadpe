
-- Create ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid,
  coder_id uuid,
  build_request_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert ratings" ON public.ratings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins read all ratings" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Admins update ratings" ON public.ratings FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  business_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert feedback" ON public.feedback FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admins read all feedback" ON public.feedback FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name_changes_this_month integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS number_changes_this_month integer DEFAULT 0;

-- Lock down otp_verifications RLS (drop open policies, add service-only)
DROP POLICY IF EXISTS "Anyone can read OTP" ON public.otp_verifications;
DROP POLICY IF EXISTS "Anyone can update OTP" ON public.otp_verifications;
DROP POLICY IF EXISTS "Anyone can delete OTP" ON public.otp_verifications;
DROP POLICY IF EXISTS "Anyone can insert OTP" ON public.otp_verifications;

CREATE POLICY "Service role only" ON public.otp_verifications FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Lock down orders RLS (replace open read/update)
DROP POLICY IF EXISTS "Anyone can read orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;

CREATE POLICY "Users read own orders" ON public.orders FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR true);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.ratings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feedback;
