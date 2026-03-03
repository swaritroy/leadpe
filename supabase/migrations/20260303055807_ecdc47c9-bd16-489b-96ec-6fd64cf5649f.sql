
-- Add add-on toggles and subscription fields to businesses
ALTER TABLE public.businesses
ADD COLUMN IF NOT EXISTS addon_chatbot boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS addon_sms boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS addon_whatsapp boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS addon_booking boolean NOT NULL DEFAULT false;

-- Create storage bucket for static site freezes
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-builds', 'site-builds', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: devs can upload their own builds
CREATE POLICY "Devs upload builds"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'site-builds' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can read builds"
ON storage.objects
FOR SELECT
USING (bucket_id = 'site-builds');

CREATE POLICY "Devs delete own builds"
ON storage.objects
FOR DELETE
USING (bucket_id = 'site-builds' AND auth.uid()::text = (storage.foldername(name))[1]);
