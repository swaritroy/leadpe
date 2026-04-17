-- Remove ghost orders that would violate the new minimum-length rule
DELETE FROM public.orders
WHERE COALESCE(length(btrim(business_name)), 0) < 3
   OR COALESCE(length(btrim(customer_name)), 0) < 3
   OR COALESCE(length(btrim(customer_whatsapp)), 0) < 10;

-- Enforce non-null on identity columns
ALTER TABLE public.orders
  ALTER COLUMN business_name SET NOT NULL,
  ALTER COLUMN customer_name SET NOT NULL,
  ALTER COLUMN customer_whatsapp SET NOT NULL;

-- Minimum length constraint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_min_length_chk') THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_min_length_chk
      CHECK (
        length(btrim(business_name)) >= 3
        AND length(btrim(customer_name)) >= 3
        AND length(btrim(customer_whatsapp)) >= 10
      );
  END IF;
END $$;

-- Require authenticated session for new orders
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
CREATE POLICY "Authenticated insert orders"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);