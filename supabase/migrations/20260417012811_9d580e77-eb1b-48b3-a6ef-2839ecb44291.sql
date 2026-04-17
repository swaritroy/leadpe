ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS subscription_expiry timestamptz;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS commission_rate integer NOT NULL DEFAULT 40;