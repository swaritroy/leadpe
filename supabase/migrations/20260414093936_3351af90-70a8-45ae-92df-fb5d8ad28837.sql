ALTER TABLE public.build_requests
ADD COLUMN IF NOT EXISTS revision_count integer DEFAULT 0;

ALTER TABLE public.build_requests
ADD COLUMN IF NOT EXISTS revision_feedback jsonb;

ALTER TABLE public.build_requests
ADD COLUMN IF NOT EXISTS max_revisions integer DEFAULT 2;