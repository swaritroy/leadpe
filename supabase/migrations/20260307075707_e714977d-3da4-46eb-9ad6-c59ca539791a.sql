ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS upi_id text DEFAULT '',
ADD COLUMN IF NOT EXISTS preferred_fee integer DEFAULT 800,
ADD COLUMN IF NOT EXISTS monthly_capacity text DEFAULT '3-5 sites',
ADD COLUMN IF NOT EXISTS whatsapp_number text DEFAULT '';