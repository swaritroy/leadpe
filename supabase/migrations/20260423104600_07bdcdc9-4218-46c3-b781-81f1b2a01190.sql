ALTER TABLE public.build_requests
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS photos_urls text[],
  ADD COLUMN IF NOT EXISTS color_preference text,
  ADD COLUMN IF NOT EXISTS deployment_id text,
  ADD COLUMN IF NOT EXISTS deploy_stage text,
  ADD COLUMN IF NOT EXISTS deploy_error text,
  ADD COLUMN IF NOT EXISTS deploy_hint text,
  ADD COLUMN IF NOT EXISTS deploy_inspector_url text,
  ADD COLUMN IF NOT EXISTS last_deploy_checked_at timestamptz;