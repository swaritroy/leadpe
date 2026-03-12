CREATE TABLE IF NOT EXISTS otp_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text NOT NULL,
  otp_code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_otp_phone 
ON otp_verifications(phone);

ALTER TABLE otp_verifications 
ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
ON otp_verifications FOR ALL
USING (true) WITH CHECK (true);
