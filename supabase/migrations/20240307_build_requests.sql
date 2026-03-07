-- Create build_requests table
CREATE TABLE IF NOT EXISTS build_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id text NOT NULL,
  business_name text NOT NULL,
  business_type text NOT NULL,
  city text NOT NULL,
  state text,
  owner_name text NOT NULL,
  owner_whatsapp text NOT NULL,
  plan_selected text NOT NULL,
  preferred_language text DEFAULT 'hinglish',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'building', 'review', 'deployed', 'rejected')),
  assigned_coder_id text,
  created_at timestamp with time zone DEFAULT now(),
  deadline timestamp with time zone,
  github_url text,
  submitted_at timestamp with time zone,
  deployed_at timestamp with time zone,
  coder_notes text,
  admin_notes text
);

-- Create indexes for better performance
CREATE INDEX idx_build_requests_status ON build_requests(status);
CREATE INDEX idx_build_requests_assigned_coder ON build_requests(assigned_coder_id);
CREATE INDEX idx_build_requests_created_at ON build_requests(created_at);
CREATE INDEX idx_build_requests_deadline ON build_requests(deadline);

-- Add RLS policies
ALTER TABLE build_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see their own build requests
CREATE POLICY "Users can view own build requests" ON build_requests
  FOR SELECT USING (
    owner_whatsapp IN (
      SELECT whatsapp_number::text FROM profiles WHERE id = auth.uid()
    )
  );

-- Policy: Coders can see pending and assigned requests
CREATE POLICY "Coders can view build requests" ON build_requests
  FOR SELECT USING (
    status IN ('pending', 'assigned') OR 
    assigned_coder_id = (
      SELECT id::text FROM profiles WHERE id = auth.uid() AND role = 'developer'
    )
  );

-- Policy: Admins can see all build requests
CREATE POLICY "Admins can view all build requests" ON build_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Only system can insert build requests
CREATE POLICY "System can insert build requests" ON build_requests
  FOR INSERT WITH CHECK (true);

-- Policy: Coders and admins can update build requests
CREATE POLICY "Coders and admins can update build requests" ON build_requests
  FOR UPDATE USING (
    assigned_coder_id = (SELECT id::text FROM profiles WHERE id = auth.uid() AND role = 'developer') OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Function to set deadline (48 hours from creation)
CREATE OR REPLACE FUNCTION set_build_deadline()
RETURNS TRIGGER AS $$
BEGIN
  NEW.deadline = NEW.created_at + interval '48 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically set deadline
CREATE TRIGGER trigger_set_build_deadline
  BEFORE INSERT ON build_requests
  FOR EACH ROW
  EXECUTE FUNCTION set_build_deadline();
