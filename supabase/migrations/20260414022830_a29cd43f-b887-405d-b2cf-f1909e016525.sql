ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS custom_domain TEXT,
  ADD COLUMN IF NOT EXISTS custom_domain_verified BOOLEAN DEFAULT false;