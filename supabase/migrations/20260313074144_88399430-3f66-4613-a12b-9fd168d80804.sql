ALTER TABLE public.build_requests ADD COLUMN IF NOT EXISTS ai_prompt text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website_status text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS feedback_given boolean DEFAULT false;
CREATE TABLE IF NOT EXISTS public.otp_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert OTP" ON public.otp_verifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read OTP" ON public.otp_verifications FOR SELECT USING (true);
CREATE POLICY "Anyone can update OTP" ON public.otp_verifications FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete OTP" ON public.otp_verifications FOR DELETE USING (true);