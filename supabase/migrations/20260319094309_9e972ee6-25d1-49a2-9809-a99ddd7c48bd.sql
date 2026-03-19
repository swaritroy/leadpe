ALTER TABLE build_requests ADD COLUMN IF NOT EXISTS admin_notified boolean DEFAULT false;
ALTER TABLE build_requests ADD COLUMN IF NOT EXISTS hard_deadline timestamptz;
UPDATE build_requests SET hard_deadline = created_at + interval '48 hours' WHERE hard_deadline IS NULL;