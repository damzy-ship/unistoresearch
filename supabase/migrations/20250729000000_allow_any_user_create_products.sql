-- Allow any authenticated user to create real-time products (not just merchants)
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Allow authenticated users to create real-time products" ON real_time_products;

-- Create new policy that allows any authenticated user
CREATE POLICY "Allow any authenticated user to create real-time products"
  ON real_time_products
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also update the update policy to be less restrictive
DROP POLICY IF EXISTS "Allow merchants to update their own real-time products" ON real_time_products;

CREATE POLICY "Allow users to update their own real-time products"
  ON real_time_products
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update delete policy as well
DROP POLICY IF EXISTS "Allow merchants to delete their own real-time products" ON real_time_products;

CREATE POLICY "Allow users to delete their own real-time products"
  ON real_time_products
  FOR DELETE
  TO authenticated
  USING (true); 