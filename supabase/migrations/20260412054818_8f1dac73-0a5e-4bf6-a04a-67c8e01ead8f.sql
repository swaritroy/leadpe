
-- 1. FIX PRIVILEGE ESCALATION: user_roles self-insert
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can insert own non-admin role"
ON public.user_roles FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND role <> 'admin'::app_role
);

-- 2. FIX PROFILES PUBLIC EXPOSURE
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
CREATE POLICY "Owner or admin can read profile"
ON public.profiles FOR SELECT
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
);
-- Allow coders to read other profiles for display name lookups
CREATE POLICY "Authenticated users read basic profiles"
ON public.profiles FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 3. FIX ORDER_TIMELINE OPEN ACCESS
DROP POLICY IF EXISTS "Anyone can read timeline" ON public.order_timeline;
DROP POLICY IF EXISTS "Anyone can insert timeline" ON public.order_timeline;
CREATE POLICY "Authenticated users read timeline"
ON public.order_timeline FOR SELECT
USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users insert timeline"
ON public.order_timeline FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 4. FIX BUSINESS_SEO OPEN WRITE
DROP POLICY IF EXISTS "Anyone can insert seo" ON public.business_seo;
DROP POLICY IF EXISTS "Anyone can update seo" ON public.business_seo;
CREATE POLICY "Authenticated users insert seo"
ON public.business_seo FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users update seo"
ON public.business_seo FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- 5. FIX SCHEDULED_MESSAGES OPEN WRITE
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.scheduled_messages;
DROP POLICY IF EXISTS "Anyone can update messages" ON public.scheduled_messages;
DROP POLICY IF EXISTS "Anyone can read messages" ON public.scheduled_messages;
CREATE POLICY "Authenticated users insert messages"
ON public.scheduled_messages FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users update messages"
ON public.scheduled_messages FOR UPDATE
USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users read messages"
ON public.scheduled_messages FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 6. FIX CODER_PENALTIES OPEN INSERT
DROP POLICY IF EXISTS "Service insert penalties" ON public.coder_penalties;
CREATE POLICY "Admin or service insert penalties"
ON public.coder_penalties FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 7. FIX MUTABLE SEARCH PATH on generate_order_id
CREATE OR REPLACE FUNCTION public.generate_order_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.order_id := 'LP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
  RETURN NEW;
END;
$function$;
