CREATE OR REPLACE FUNCTION public.find_reset_user_by_phone(input_text text)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  whatsapp_number text,
  role text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  clean_input text;
  login_email text;
BEGIN
  clean_input := regexp_replace(lower(trim(coalesce(input_text, ''))), '@leadpe\.com$', '');
  clean_input := regexp_replace(clean_input, '\D', '', 'g');
  clean_input := regexp_replace(clean_input, '^91(?=\d{10}$)', '');
  clean_input := right(clean_input, 10);

  IF clean_input !~ '^[6-9][0-9]{9}$' THEN
    RETURN;
  END IF;

  login_email := clean_input || '@leadpe.com';

  RETURN QUERY
  SELECT p.user_id, p.full_name, p.whatsapp_number, p.role
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  WHERE p.whatsapp_number = clean_input
     OR lower(coalesce(u.email, '')) = login_email
  ORDER BY CASE WHEN p.whatsapp_number = clean_input THEN 0 ELSE 1 END
  LIMIT 1;
END;
$$;