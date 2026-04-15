
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS vetting_status text DEFAULT 'pending_vetting',
  ADD COLUMN IF NOT EXISTS ai_tools text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS test_site_url text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS vetting_notes text DEFAULT NULL;

-- Update existing coders who already completed onboarding to 'approved' so they aren't blocked
UPDATE public.profiles 
SET vetting_status = 'approved' 
WHERE role IN ('developer', 'vibe_coder') AND onboarding_complete = true;
