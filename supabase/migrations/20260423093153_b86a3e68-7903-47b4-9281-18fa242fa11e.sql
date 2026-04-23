-- 1. Add columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referral_discount integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_bonus_total integer NOT NULL DEFAULT 0;

-- Backfill referral_code for existing profiles
UPDATE public.profiles
SET referral_code = 'LP-' || upper(substring(md5(random()::text || user_id::text), 1, 6))
WHERE referral_code IS NULL;

-- Unique index on referral_code
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code
  ON public.profiles(referral_code)
  WHERE referral_code IS NOT NULL;

-- 2. Create referrals table
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referrer_type text NOT NULL CHECK (referrer_type IN ('business', 'coder')),
  referee_id uuid,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'rewarded')),
  reward_amount integer NOT NULL DEFAULT 0,
  converted_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON public.referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON public.referrals(referral_code);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users read own referrals"
  ON public.referrals FOR SELECT
  USING (referrer_id = auth.uid() OR referee_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated insert own referral"
  ON public.referrals FOR INSERT
  WITH CHECK (referee_id = auth.uid());

CREATE POLICY "Admins manage referrals"
  ON public.referrals FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Update handle_new_user trigger to generate referral_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _role text := COALESCE(NEW.raw_user_meta_data->>'role', 'business');
  _now timestamptz := now();
  _trial_end timestamptz := _now + interval '21 days';
  _ref_code text := 'LP-' || upper(substring(md5(random()::text || NEW.id::text), 1, 6));
BEGIN
  INSERT INTO public.profiles (
    user_id, display_name, avatar_url, full_name, whatsapp_number, email,
    role, status, upi_id, city, plan_type,
    trial_started_at, trial_ends_at, trial_start_date, trial_end_date,
    referral_code
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'whatsapp_number',
    NEW.email,
    _role,
    CASE WHEN _role = 'vibe_coder' THEN 'active' ELSE 'trial' END,
    NEW.raw_user_meta_data->>'upi_id',
    NEW.raw_user_meta_data->>'city',
    CASE WHEN _role = 'business' THEN 'trial' ELSE 'free' END,
    CASE WHEN _role = 'business' THEN _now ELSE NULL END,
    CASE WHEN _role = 'business' THEN _trial_end ELSE NULL END,
    CASE WHEN _role = 'business' THEN _now ELSE NULL END,
    CASE WHEN _role = 'business' THEN _trial_end ELSE NULL END,
    _ref_code
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;