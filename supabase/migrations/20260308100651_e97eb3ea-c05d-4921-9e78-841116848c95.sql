
CREATE TABLE IF NOT EXISTS public.quality_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  build_request_id UUID REFERENCES public.build_requests(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  checks JSONB DEFAULT '{}'::jsonb,
  issues JSONB DEFAULT '[]'::jsonb,
  fixes JSONB DEFAULT '[]'::jsonb,
  ai_suggestions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quality_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read quality reports"
  ON public.quality_reports FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert quality reports"
  ON public.quality_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
