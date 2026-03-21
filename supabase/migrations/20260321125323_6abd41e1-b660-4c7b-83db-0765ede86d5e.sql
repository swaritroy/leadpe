-- FIX 7: Add demo_url column to build_requests
ALTER TABLE build_requests ADD COLUMN IF NOT EXISTS demo_url text;

-- FIX 5: Drop overly permissive update policy on orders
DROP POLICY IF EXISTS "Admins update orders" ON orders;
CREATE POLICY "Admins update orders" ON orders FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for key tables (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'build_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE build_requests;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'leads'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE leads;
  END IF;
END $$;