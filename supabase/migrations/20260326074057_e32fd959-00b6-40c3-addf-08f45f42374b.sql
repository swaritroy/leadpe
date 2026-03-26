-- Create storage bucket for business assets
INSERT INTO storage.buckets (id, name, public) VALUES ('business-assets', 'business-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to upload to business-assets bucket
CREATE POLICY "Anyone can upload business assets" ON storage.objects
FOR INSERT TO public WITH CHECK (bucket_id = 'business-assets');

-- Allow public read access
CREATE POLICY "Public read business assets" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'business-assets');