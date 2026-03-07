
-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'business';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'trial';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'basic';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_code text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_start_date timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS trial_end_date timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'hinglish';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS founding_member boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS business_type text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS site_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_status text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan_renewal_date timestamptz;

-- Create signups table
CREATE TABLE IF NOT EXISTS public.signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name text NOT NULL,
  business_type text,
  city text,
  whatsapp_number text NOT NULL,
  owner_name text,
  plan_selected text DEFAULT 'basic',
  preferred_language text DEFAULT 'hinglish',
  trial_code text,
  status text DEFAULT 'trial',
  trial_start_date timestamptz DEFAULT now(),
  trial_end_date timestamptz DEFAULT (now() + interval '21 days'),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert signups" ON public.signups FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins read signups" ON public.signups FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Create deployments table
CREATE TABLE IF NOT EXISTS public.deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vibe_coder_id uuid,
  business_id uuid,
  business_name text,
  business_type text,
  city text,
  owner_name text,
  owner_whatsapp text,
  building_fee integer DEFAULT 800,
  leadpe_commission integer DEFAULT 0,
  vibe_coder_earning integer DEFAULT 0,
  github_url text,
  subdomain text,
  status text DEFAULT 'pending',
  monthly_passive integer DEFAULT 30,
  seo_title text,
  seo_description text,
  seo_keywords text,
  seo_schema text,
  meta_keywords text,
  schema_markup text,
  indexnow_pinged boolean DEFAULT false,
  url_slug text,
  og_tags text,
  trial_start_date timestamptz DEFAULT now(),
  trial_day integer DEFAULT 1,
  day1_sent boolean DEFAULT false,
  day2_sent boolean DEFAULT false,
  day3_sent boolean DEFAULT false,
  day4_sent boolean DEFAULT false,
  day5_sent boolean DEFAULT false,
  day6_sent boolean DEFAULT false,
  day7_sent boolean DEFAULT false,
  converted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.deployments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Devs read own deployments" ON public.deployments FOR SELECT USING (auth.uid() = vibe_coder_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Devs insert deployments" ON public.deployments FOR INSERT WITH CHECK (auth.uid() = vibe_coder_id);
CREATE POLICY "Devs update own deployments" ON public.deployments FOR UPDATE USING (auth.uid() = vibe_coder_id OR public.has_role(auth.uid(), 'admin'));

-- Create build_requests table
CREATE TABLE IF NOT EXISTS public.build_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid,
  business_name text,
  business_type text,
  city text,
  owner_name text,
  owner_whatsapp text,
  plan_selected text,
  status text DEFAULT 'pending',
  assigned_coder_id uuid,
  deadline timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.build_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Devs read build requests" ON public.build_requests FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins manage build requests" ON public.build_requests FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid,
  business_name text,
  plan text,
  amount integer,
  gst integer,
  total integer,
  method text,
  status text DEFAULT 'pending',
  gateway_order_id text,
  created_at timestamptz DEFAULT now(),
  activated_at timestamptz
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own payments" ON public.payments FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Anyone insert payments" ON public.payments FOR INSERT WITH CHECK (true);

-- Create message_log table
CREATE TABLE IF NOT EXISTS public.message_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_number text,
  message text,
  status text DEFAULT 'sent',
  channel text DEFAULT 'whatsapp',
  language text,
  business_id uuid,
  message_type text,
  sent_at timestamptz DEFAULT now()
);
ALTER TABLE public.message_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read message_log" ON public.message_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System insert message_log" ON public.message_log FOR INSERT WITH CHECK (true);

-- Create earnings table
CREATE TABLE IF NOT EXISTS public.earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vibe_coder_id uuid,
  deployment_id uuid,
  amount integer DEFAULT 0,
  type text DEFAULT 'building',
  month text,
  paid boolean DEFAULT false,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Devs read own earnings" ON public.earnings FOR SELECT USING (auth.uid() = vibe_coder_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Devs insert earnings" ON public.earnings FOR INSERT WITH CHECK (auth.uid() = vibe_coder_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update earnings" ON public.earnings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
