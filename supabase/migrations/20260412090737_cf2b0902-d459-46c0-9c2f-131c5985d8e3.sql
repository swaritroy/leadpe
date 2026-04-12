
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subdomain text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_subdomain ON public.profiles(subdomain) WHERE subdomain IS NOT NULL;
