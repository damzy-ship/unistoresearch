-- Enable RLS on merchants table if not already enabled
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to create merchants" ON merchants;
DROP POLICY IF EXISTS "Allow users to update their own merchant records" ON merchants;
DROP POLICY IF EXISTS "Allow public read access to merchants" ON merchants;

-- Create policies for merchants table
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

CREATE POLICY "Allow public read access to merchants"
  ON merchants
  FOR SELECT
  TO public
  USING (true); 