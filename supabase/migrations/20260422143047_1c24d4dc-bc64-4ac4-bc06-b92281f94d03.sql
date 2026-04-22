-- Update handle_new_user trigger so new business signups get a proper 21-day trial
-- with all plan_type / trial_started_at / trial_ends_at columns populated, matching usePlanStatus logic.
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
BEGIN
  INSERT INTO public.profiles (
    user_id,
    display_name,
    avatar_url,
    full_name,
    whatsapp_number,
    email,
    role,
    status,
    upi_id,
    city,
    plan_type,
    trial_started_at,
    trial_ends_at,
    trial_start_date,
    trial_end_date
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
    CASE WHEN _role = 'business' THEN _trial_end ELSE NULL END
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, _role::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- Backfill existing business users that were created without proper trial fields
UPDATE public.profiles
SET plan_type = 'trial',
    trial_started_at = COALESCE(trial_started_at, trial_start_date, created_at),
    trial_ends_at = COALESCE(trial_ends_at, trial_end_date, created_at + interval '21 days')
WHERE role = 'business'
  AND (plan_type IS NULL OR plan_type = 'free')
  AND COALESCE(trial_ends_at, trial_end_date, created_at + interval '21 days') > now();