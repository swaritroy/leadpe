
-- Drop restrictive policies on profiles
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "System inserts profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

-- Recreate as PERMISSIVE
CREATE POLICY "Anyone can read profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "System inserts profiles" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);
