
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS business_type text DEFAULT 'other',
ADD COLUMN IF NOT EXISTS city text DEFAULT '',
ADD COLUMN IF NOT EXISTS whatsapp_number text DEFAULT '',
ADD COLUMN IF NOT EXISTS owner_name text DEFAULT '',
ADD COLUMN IF NOT EXISTS description text DEFAULT '',
ADD COLUMN IF NOT EXISTS timing text DEFAULT '',
ADD COLUMN IF NOT EXISTS starting_price text DEFAULT '',
ADD COLUMN IF NOT EXISTS special_offer text DEFAULT '',
ADD COLUMN IF NOT EXISTS referral_code text DEFAULT '',
ADD COLUMN IF NOT EXISTS trial_start_date timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS trial_active boolean DEFAULT true;
