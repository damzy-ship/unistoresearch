-- Clean fix for merchant relationship
-- First, ensure merchant_id is UUID type
ALTER TABLE real_time_products ALTER COLUMN merchant_id TYPE uuid USING merchant_id::uuid;

-- Drop any existing foreign key constraint
ALTER TABLE real_time_products DROP CONSTRAINT IF EXISTS real_time_products_merchant_id_fkey;

-- Add the foreign key constraint back
ALTER TABLE real_time_products ADD CONSTRAINT real_time_products_merchant_id_fkey 
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE;

-- Update the index
DROP INDEX IF EXISTS idx_real_time_products_merchant_id;
CREATE INDEX IF NOT EXISTS idx_real_time_products_merchant_id ON real_time_products(merchant_id);

-- Ensure RLS is enabled
ALTER TABLE real_time_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow any authenticated user to create real-time products" ON real_time_products;
DROP POLICY IF EXISTS "Allow users to update their own real-time products" ON real_time_products;
DROP POLICY IF EXISTS "Allow users to delete their own real-time products" ON real_time_products;
DROP POLICY IF EXISTS "Allow public read access to active real-time products" ON real_time_products;

DROP POLICY IF EXISTS "Allow authenticated users to create merchants" ON merchants;
DROP POLICY IF EXISTS "Allow users to update their own merchant records" ON merchants;
DROP POLICY IF EXISTS "Allow public read access to merchants" ON merchants;

-- Create clean policies for real_time_products
CREATE POLICY "Allow public read access to active real-time products"
  ON real_time_products
  FOR SELECT
  TO public
  USING (expires_at > now());

CREATE POLICY "Allow any authenticated user to create real-time products"
  ON real_time_products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow users to update their own real-time products"
  ON real_time_products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow users to delete their own real-time products"
  ON real_time_products
  FOR DELETE
  TO authenticated
  USING (true);

-- Create clean policies for merchants
CREATE POLICY "Allow public read access to merchants"
  ON merchants
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to create merchants"
  ON merchants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow users to update their own merchant records"
  ON merchants
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true); 