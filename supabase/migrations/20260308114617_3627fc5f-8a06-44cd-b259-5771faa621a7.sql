
-- Fix all RESTRICTIVE RLS policies to PERMISSIVE

-- build_requests
DROP POLICY IF EXISTS "Devs read build requests" ON public.build_requests;
DROP POLICY IF EXISTS "Admins manage build requests" ON public.build_requests;
CREATE POLICY "Devs read build requests" ON public.build_requests FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage build requests" ON public.build_requests FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated insert build requests" ON public.build_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Coders update own build requests" ON public.build_requests FOR UPDATE USING (auth.uid() = assigned_coder_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- business_seo
DROP POLICY IF EXISTS "Anyone can read seo" ON public.business_seo;
DROP POLICY IF EXISTS "Anyone can insert seo" ON public.business_seo;
DROP POLICY IF EXISTS "Anyone can update seo" ON public.business_seo;
CREATE POLICY "Anyone can read seo" ON public.business_seo FOR SELECT USING (true);
CREATE POLICY "Anyone can insert seo" ON public.business_seo FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update seo" ON public.business_seo FOR UPDATE USING (true);

-- businesses
DROP POLICY IF EXISTS "Public can read businesses" ON public.businesses;
DROP POLICY IF EXISTS "Owners insert businesses" ON public.businesses;
DROP POLICY IF EXISTS "Owners update businesses" ON public.businesses;
DROP POLICY IF EXISTS "Admins delete businesses" ON public.businesses;
CREATE POLICY "Public can read businesses" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Owners insert businesses" ON public.businesses FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update businesses" ON public.businesses FOR UPDATE USING (auth.uid() = owner_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete businesses" ON public.businesses FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- deployments
DROP POLICY IF EXISTS "Devs read own deployments" ON public.deployments;
DROP POLICY IF EXISTS "Devs insert deployments" ON public.deployments;
DROP POLICY IF EXISTS "Devs update own deployments" ON public.deployments;
CREATE POLICY "Devs read own deployments" ON public.deployments FOR SELECT USING (auth.uid() = vibe_coder_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Devs insert deployments" ON public.deployments FOR INSERT WITH CHECK (auth.uid() = vibe_coder_id);
CREATE POLICY "Devs update own deployments" ON public.deployments FOR UPDATE USING (auth.uid() = vibe_coder_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- earnings
DROP POLICY IF EXISTS "Devs read own earnings" ON public.earnings;
DROP POLICY IF EXISTS "Devs insert earnings" ON public.earnings;
DROP POLICY IF EXISTS "Admins update earnings" ON public.earnings;
CREATE POLICY "Devs read own earnings" ON public.earnings FOR SELECT USING (auth.uid() = vibe_coder_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Devs insert earnings" ON public.earnings FOR INSERT WITH CHECK (auth.uid() = vibe_coder_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update earnings" ON public.earnings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- leads
DROP POLICY IF EXISTS "Business owners read own leads" ON public.leads;
DROP POLICY IF EXISTS "Business owners update leads" ON public.leads;
DROP POLICY IF EXISTS "Admins delete leads" ON public.leads;
DROP POLICY IF EXISTS "Anyone can submit leads" ON public.leads;
CREATE POLICY "Business owners read own leads" ON public.leads FOR SELECT USING (public.is_business_owner(auth.uid(), business_id) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Business owners update leads" ON public.leads FOR UPDATE USING (public.is_business_owner(auth.uid(), business_id) OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete leads" ON public.leads FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can submit leads" ON public.leads FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM businesses WHERE businesses.id = leads.business_id));

-- message_log
DROP POLICY IF EXISTS "Admins read message_log" ON public.message_log;
DROP POLICY IF EXISTS "System insert message_log" ON public.message_log;
CREATE POLICY "Admins read message_log" ON public.message_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System insert message_log" ON public.message_log FOR INSERT WITH CHECK (true);

-- order_timeline
DROP POLICY IF EXISTS "Anyone can insert timeline" ON public.order_timeline;
DROP POLICY IF EXISTS "Anyone can read timeline" ON public.order_timeline;
CREATE POLICY "Anyone can insert timeline" ON public.order_timeline FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read timeline" ON public.order_timeline FOR SELECT USING (true);

-- orders
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can read orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;
CREATE POLICY "Anyone can insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Anyone can update orders" ON public.orders FOR UPDATE USING (true);

-- payments
DROP POLICY IF EXISTS "Users read own payments" ON public.payments;
DROP POLICY IF EXISTS "Anyone insert payments" ON public.payments;
CREATE POLICY "Users read own payments" ON public.payments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Anyone insert payments" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins update payments" ON public.payments FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- profiles
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "System inserts profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "System inserts profiles" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'::app_role));

-- projects
DROP POLICY IF EXISTS "Devs read own projects" ON public.projects;
DROP POLICY IF EXISTS "Devs insert projects" ON public.projects;
DROP POLICY IF EXISTS "Devs update own projects" ON public.projects;
DROP POLICY IF EXISTS "Admins delete projects" ON public.projects;
CREATE POLICY "Devs read own projects" ON public.projects FOR SELECT USING (auth.uid() = dev_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Devs insert projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = dev_id);
CREATE POLICY "Devs update own projects" ON public.projects FOR UPDATE USING (auth.uid() = dev_id OR public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete projects" ON public.projects FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- quality_reports
DROP POLICY IF EXISTS "Authenticated users can read quality reports" ON public.quality_reports;
DROP POLICY IF EXISTS "Authenticated users can insert quality reports" ON public.quality_reports;
CREATE POLICY "Authenticated users can read quality reports" ON public.quality_reports FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can insert quality reports" ON public.quality_reports FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- scheduled_messages
DROP POLICY IF EXISTS "Anyone can read messages" ON public.scheduled_messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.scheduled_messages;
DROP POLICY IF EXISTS "Anyone can update messages" ON public.scheduled_messages;
CREATE POLICY "Anyone can read messages" ON public.scheduled_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert messages" ON public.scheduled_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update messages" ON public.scheduled_messages FOR UPDATE USING (true);

-- signups
DROP POLICY IF EXISTS "Anyone can insert signups" ON public.signups;
DROP POLICY IF EXISTS "Admins read signups" ON public.signups;
CREATE POLICY "Anyone can insert signups" ON public.signups FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read signups" ON public.signups FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));

-- user_roles
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert own role" ON public.user_roles;
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add referral columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_count integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS free_months_earned integer DEFAULT 0;

-- Enable realtime for key tables (orders already added)
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.build_requests;

-- Create trigger for handle_new_user if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
