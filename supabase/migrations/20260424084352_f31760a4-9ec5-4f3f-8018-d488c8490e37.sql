-- Add manual UPI payment fields
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS payer_phone text,
  ADD COLUMN IF NOT EXISTS payer_upi_name text;

-- Backfill assigned_coder_id in build_requests: profiles.id -> profiles.user_id
UPDATE public.build_requests br
SET assigned_coder_id = p.user_id
FROM public.profiles p
WHERE br.assigned_coder_id = p.id
  AND br.assigned_coder_id IS NOT NULL
  AND br.assigned_coder_id <> p.user_id;

-- Backfill assigned_coder_id in orders the same way
UPDATE public.orders o
SET assigned_coder_id = p.user_id
FROM public.profiles p
WHERE o.assigned_coder_id = p.id
  AND o.assigned_coder_id IS NOT NULL
  AND o.assigned_coder_id <> p.user_id;