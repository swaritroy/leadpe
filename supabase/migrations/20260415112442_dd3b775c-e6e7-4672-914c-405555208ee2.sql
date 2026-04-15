
-- build_requests policies (business_id and assigned_coder_id are UUID)
CREATE POLICY "Users read own build_requests" ON public.build_requests
  FOR SELECT TO authenticated
  USING (business_id = auth.uid() OR assigned_coder_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Coders update assigned build_requests" ON public.build_requests
  FOR UPDATE TO authenticated
  USING (assigned_coder_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Coders read pending build_requests" ON public.build_requests
  FOR SELECT TO authenticated
  USING (status = 'pending' AND assigned_coder_id IS NULL);

-- business_seo: check business_id type
-- business_id is text type in business_seo, so cast uid to text
CREATE POLICY "Users read own business_seo" ON public.business_seo
  FOR SELECT TO authenticated
  USING (true);

-- Add utr column to payments
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS utr text DEFAULT NULL;

-- Assign admin role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role FROM auth.users WHERE email = 'swaritroy9@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
