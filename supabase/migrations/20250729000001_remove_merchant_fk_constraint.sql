-- Remove foreign key constraint on merchant_id to allow any user to create products
-- First drop the foreign key constraint
ALTER TABLE real_time_products DROP CONSTRAINT IF EXISTS real_time_products_merchant_id_fkey;

-- Change merchant_id to text type to store user_id instead of merchant uuid
ALTER TABLE real_time_products ALTER COLUMN merchant_id TYPE text;

-- Update the index to work with text
DROP INDEX IF EXISTS idx_real_time_products_merchant_id;
CREATE INDEX IF NOT EXISTS idx_real_time_products_merchant_id ON real_time_products(merchant_id);

-- Update RLS policies to work with text merchant_id
-- Drop old policies
DROP POLICY IF EXISTS "Allow authenticated users to create real-time products" ON real_time_products;
DROP POLICY IF EXISTS "Allow users to update their own real-time products" ON real_time_products;
DROP POLICY IF EXISTS "Allow users to delete their own real-time products" ON real_time_products;

-- Create new policies that work with text merchant_id
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