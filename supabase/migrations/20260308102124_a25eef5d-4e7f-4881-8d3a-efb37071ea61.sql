
-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT UNIQUE,
  customer_name TEXT NOT NULL,
  customer_whatsapp TEXT NOT NULL,
  whatsapp_verified BOOLEAN DEFAULT FALSE,
  business_name TEXT NOT NULL,
  business_type TEXT,
  city TEXT,
  business_since TEXT,
  business_description TEXT,
  package_id TEXT NOT NULL DEFAULT 'basic',
  package_price INTEGER NOT NULL DEFAULT 800,
  domain_option TEXT DEFAULT 'subdomain',
  own_domain TEXT,
  domain_addon_price INTEGER DEFAULT 0,
  total_price INTEGER NOT NULL DEFAULT 800,
  color_preference TEXT DEFAULT 'green',
  reference_site TEXT,
  special_requirements TEXT,
  logo_url TEXT,
  photos_urls TEXT[],
  status TEXT DEFAULT 'pending',
  demo_url TEXT,
  demo_sent_at TIMESTAMPTZ,
  demo_viewed_at TIMESTAMPTZ,
  demo_approved_at TIMESTAMPTZ,
  payment_amount INTEGER,
  payment_status TEXT DEFAULT 'pending',
  payment_received_at TIMESTAMPTZ,
  live_url TEXT,
  went_live_at TIMESTAMPTZ,
  assigned_coder_id UUID,
  assigned_coder_name TEXT,
  revision_count INTEGER DEFAULT 0,
  revision_requests JSONB DEFAULT '[]'::jsonb,
  build_record TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Anyone can update orders" ON orders FOR UPDATE USING (true);

-- Auto generate order ID
CREATE OR REPLACE FUNCTION generate_order_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_id := 'LP-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_id
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_id();

-- Order timeline table
CREATE TABLE IF NOT EXISTS order_timeline (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL,
  event TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE order_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert timeline" ON order_timeline FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can read timeline" ON order_timeline FOR SELECT USING (true);

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_timeline;
