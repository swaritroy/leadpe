
CREATE TABLE IF NOT EXISTS business_seo (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id TEXT,
  business_name TEXT,
  page_title TEXT,
  meta_description TEXT,
  keywords TEXT,
  google_description TEXT,
  whatsapp_bio TEXT,
  h1_heading TEXT,
  about_text TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE business_seo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read seo" ON business_seo FOR SELECT USING (true);
CREATE POLICY "Anyone can insert seo" ON business_seo FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update seo" ON business_seo FOR UPDATE USING (true);

CREATE TABLE IF NOT EXISTS scheduled_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  "to" TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'welcome',
  status TEXT DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read messages" ON scheduled_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert messages" ON scheduled_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update messages" ON scheduled_messages FOR UPDATE USING (true);
