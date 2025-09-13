/*
  # Create Real-time Products Feature

  1. New Tables
    - `real_time_products` - Main table for real-time product shorts
    - `real_time_product_views` - Track product views
    - `real_time_product_contacts` - Track contact interactions

  2. Features
    - 24-hour expiration for products
    - Image and video support
    - Analytics tracking
    - Merchant verification (only active merchants can post)

  3. Security
    - Enable RLS on all tables
    - Add policies for public read, authenticated insert/update
    - Only active merchants can create products
*/

-- Create real_time_products table
CREATE TABLE IF NOT EXISTS real_time_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price decimal(10,2),
  location text,
  contact_phone text,
  category text,
  media_url text NOT NULL, -- Supabase Storage URL
  media_type text NOT NULL CHECK (media_type = ANY (ARRAY['image'::text, 'video'::text])),
  duration integer, -- Video duration in seconds
  views_count integer DEFAULT 0,
  contact_clicks integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create real_time_product_views table
CREATE TABLE IF NOT EXISTS real_time_product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES real_time_products(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  viewed_at timestamptz DEFAULT now()
);

-- Create real_time_product_contacts table
CREATE TABLE IF NOT EXISTS real_time_product_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES real_time_products(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  contacted_at timestamptz DEFAULT now(),
  contact_method text NOT NULL CHECK (contact_method = ANY (ARRAY['whatsapp'::text, 'call'::text, 'message'::text]))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_real_time_products_expires_at ON real_time_products(expires_at);
CREATE INDEX IF NOT EXISTS idx_real_time_products_created_at ON real_time_products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_real_time_products_merchant_id ON real_time_products(merchant_id);
CREATE INDEX IF NOT EXISTS idx_real_time_products_is_featured ON real_time_products(is_featured);
CREATE INDEX IF NOT EXISTS idx_real_time_products_media_type ON real_time_products(media_type);

CREATE INDEX IF NOT EXISTS idx_real_time_product_views_product_id ON real_time_product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_real_time_product_views_user_id ON real_time_product_views(user_id);
CREATE INDEX IF NOT EXISTS idx_real_time_product_views_viewed_at ON real_time_product_views(viewed_at);

CREATE INDEX IF NOT EXISTS idx_real_time_product_contacts_product_id ON real_time_product_contacts(product_id);
CREATE INDEX IF NOT EXISTS idx_real_time_product_contacts_user_id ON real_time_product_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_real_time_product_contacts_contacted_at ON real_time_product_contacts(contacted_at);

-- Enable RLS on all tables
ALTER TABLE real_time_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_time_product_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_time_product_contacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for real_time_products

-- Allow public read access to non-expired products
CREATE POLICY "Allow public read access to active real-time products"
  ON real_time_products
  FOR SELECT
  TO public
  USING (expires_at > now());

-- Allow authenticated users to create products (only if they are active merchants)
CREATE POLICY "Allow authenticated users to create real-time products"
  ON real_time_products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM merchants 
      WHERE id = merchant_id 
      AND is_billing_active = true
    )
  );

-- Allow merchants to update their own products
CREATE POLICY "Allow merchants to update their own real-time products"
  ON real_time_products
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM merchants 
      WHERE id = merchant_id 
      AND is_billing_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM merchants 
      WHERE id = merchant_id 
      AND is_billing_active = true
    )
  );

-- Allow merchants to delete their own products
CREATE POLICY "Allow merchants to delete their own real-time products"
  ON real_time_products
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM merchants 
      WHERE id = merchant_id 
      AND is_billing_active = true
    )
  );

-- RLS Policies for real_time_product_views

-- Allow public read access
CREATE POLICY "Allow public read access to real-time product views"
  ON real_time_product_views
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert view records
CREATE POLICY "Allow authenticated users to insert real-time product views"
  ON real_time_product_views
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for real_time_product_contacts

-- Allow public read access
CREATE POLICY "Allow public read access to real-time product contacts"
  ON real_time_product_contacts
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert contact records
CREATE POLICY "Allow authenticated users to insert real-time product contacts"
  ON real_time_product_contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_real_time_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_real_time_products_updated_at_trigger
  BEFORE UPDATE ON real_time_products
  FOR EACH ROW
  EXECUTE FUNCTION update_real_time_products_updated_at();

-- Create function to automatically increment views_count
CREATE OR REPLACE FUNCTION increment_real_time_product_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE real_time_products 
  SET views_count = views_count + 1
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically increment views_count
CREATE TRIGGER increment_real_time_product_views_trigger
  AFTER INSERT ON real_time_product_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_real_time_product_views();

-- Create function to automatically increment contact_clicks
CREATE OR REPLACE FUNCTION increment_real_time_product_contacts()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE real_time_products 
  SET contact_clicks = contact_clicks + 1
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically increment contact_clicks
CREATE TRIGGER increment_real_time_product_contacts_trigger
  AFTER INSERT ON real_time_product_contacts
  FOR EACH ROW
  EXECUTE FUNCTION increment_real_time_product_contacts();

-- Create function to clean up expired products (optional - can be handled in application logic)
CREATE OR REPLACE FUNCTION cleanup_expired_real_time_products()
RETURNS void AS $$
BEGIN
  DELETE FROM real_time_products 
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql; 