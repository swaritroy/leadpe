CREATE TABLE IF NOT EXISTS public.coder_penalties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  coder_id uuid REFERENCES public.profiles(id),
  reason text,
  build_request_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.coder_penalties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage penalties" ON public.coder_penalties
FOR ALL TO public
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Coders read own penalties" ON public.coder_penalties
FOR SELECT TO public
USING (coder_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Service insert penalties" ON public.coder_penalties
FOR INSERT TO public
WITH CHECK (true);

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;