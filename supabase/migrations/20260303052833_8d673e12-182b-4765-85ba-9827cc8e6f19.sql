
-- 1. Role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'business', 'developer');

-- 2. User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Businesses table
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  theme_json JSONB DEFAULT '{"primary":"#6366f1","secondary":"#10b981","font":"Inter"}',
  contact_info JSONB DEFAULT '{"phone":"","address":"","email":""}',
  business_hours TEXT DEFAULT 'Mon-Fri 9AM-6PM',
  service_pricing JSONB DEFAULT '[]',
  subscription_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- 4. Leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  phone TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','converted')),
  value NUMERIC DEFAULT 0,
  source TEXT DEFAULT 'website',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- 5. Projects table (developer submissions)
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dev_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  code_content TEXT,
  category TEXT DEFAULT 'general',
  vetting_score INTEGER DEFAULT 0,
  seo_score INTEGER DEFAULT 0,
  mobile_score INTEGER DEFAULT 0,
  performance_score INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','vetting','live','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 6. Profiles table (for user metadata)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. Security definer helper functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_business_owner(_user_id UUID, _business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.businesses WHERE id = _business_id AND owner_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_subscription_active(_business_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT subscription_active FROM public.businesses WHERE id = _business_id),
    false
  )
$$;

-- 8. Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 10. RLS Policies

-- user_roles: admins manage, users read own
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- profiles: users read all, update own
CREATE POLICY "Anyone can read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "System inserts profiles" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- businesses: public read for slug routing, owners manage
CREATE POLICY "Public can read businesses" ON public.businesses FOR SELECT USING (true);
CREATE POLICY "Owners insert businesses" ON public.businesses FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners update businesses" ON public.businesses FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Admins delete businesses" ON public.businesses FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- leads: business owners see own leads (if subscription active), public can insert (contact forms)
CREATE POLICY "Business owners read own leads" ON public.leads FOR SELECT
  USING (
    public.is_business_owner(auth.uid(), business_id) AND public.is_subscription_active(business_id)
    OR public.has_role(auth.uid(), 'admin')
  );
CREATE POLICY "Public can submit leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Business owners update leads" ON public.leads FOR UPDATE
  USING (public.is_business_owner(auth.uid(), business_id) AND public.is_subscription_active(business_id));
CREATE POLICY "Admins delete leads" ON public.leads FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- projects: devs see own, admins see all
CREATE POLICY "Devs read own projects" ON public.projects FOR SELECT USING (auth.uid() = dev_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Devs insert projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = dev_id);
CREATE POLICY "Devs update own projects" ON public.projects FOR UPDATE USING (auth.uid() = dev_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete projects" ON public.projects FOR DELETE USING (public.has_role(auth.uid(), 'admin'));
