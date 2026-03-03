
-- Allow authenticated users to insert their own role (for role selection page)
CREATE POLICY "Users can insert own role" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
