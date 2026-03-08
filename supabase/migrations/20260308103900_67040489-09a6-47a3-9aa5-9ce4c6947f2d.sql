
-- Add vibe_coder to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vibe_coder';

-- Update handle_new_user to populate more profile fields and auto-create user_role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
    city
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'whatsapp_number',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'business'),
    CASE
      WHEN NEW.raw_user_meta_data->>'role' = 'vibe_coder' THEN 'active'
      ELSE 'trial'
    END,
    NEW.raw_user_meta_data->>'upi_id',
    NEW.raw_user_meta_data->>'city'
  );

  -- Auto-create user_role entry
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'business')::app_role
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$function$;
