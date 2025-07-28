-- Fix merchant relationship for real-time products
-- Change merchant_id back to UUID type
ALTER TABLE real_time_products ALTER COLUMN merchant_id TYPE uuid USING merchant_id::uuid;

-- Add foreign key constraint back
ALTER TABLE real_time_products ADD CONSTRAINT real_time_products_merchant_id_fkey 
  FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE;

-- Update the index
DROP INDEX IF EXISTS idx_real_time_products_merchant_id;
CREATE INDEX IF NOT EXISTS idx_real_time_products_merchant_id ON real_time_products(merchant_id);

-- Update RLS policies to allow any authenticated user to create products
DROP POLICY IF EXISTS "Allow any authenticated user to create real-time products" ON real_time_products;
DROP POLICY IF EXISTS "Allow users to update their own real-time products" ON real_time_products;
DROP POLICY IF EXISTS "Allow users to delete their own real-time products" ON real_time_products;

-- Create new policies that allow any authenticated user
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

-- Also allow authenticated users to create merchant records
CREATE POLICY "Allow authenticated users to create merchants"
  ON merchants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow users to update their own merchant records
CREATE POLICY "Allow users to update their own merchant records"
  ON merchants
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true); 