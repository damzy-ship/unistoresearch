/*
  # Fix database schema for visitor tracking

  1. New Tables (if not exists)
    - `unique_visitors`
      - `id` (uuid, primary key)
      - `user_id` (text, unique)
      - `first_visit` (timestamptz)
      - `last_visit` (timestamptz)
      - `visit_count` (integer)
      - `created_at` (timestamptz)
    - `request_logs`
      - `id` (uuid, primary key)
      - `user_id` (text)
      - `university` (text)
      - `request_text` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for public access (recreate if exists)

  3. Performance
    - Add indexes for better query performance
*/

-- Create unique_visitors table
CREATE TABLE IF NOT EXISTS unique_visitors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  first_visit timestamptz NOT NULL DEFAULT now(),
  last_visit timestamptz NOT NULL DEFAULT now(),
  visit_count integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Create request_logs table
CREATE TABLE IF NOT EXISTS request_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  university text NOT NULL,
  request_text text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add university constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'request_logs_university_check' 
    AND table_name = 'request_logs'
  ) THEN
    ALTER TABLE request_logs ADD CONSTRAINT request_logs_university_check 
    CHECK (university = ANY (ARRAY['Bingham'::text, 'Veritas'::text]));
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE unique_visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Allow public read access to unique_visitors" ON unique_visitors;
DROP POLICY IF EXISTS "Allow public insert access to unique_visitors" ON unique_visitors;
DROP POLICY IF EXISTS "Allow public update access to unique_visitors" ON unique_visitors;
DROP POLICY IF EXISTS "Allow public read access to request_logs" ON request_logs;
DROP POLICY IF EXISTS "Allow public insert access to request_logs" ON request_logs;

-- Create policies for public access
CREATE POLICY "Allow public read access to unique_visitors"
  ON unique_visitors
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to unique_visitors"
  ON unique_visitors
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update to unique_visitors"
  ON unique_visitors
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public read access to request_logs"
  ON request_logs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert to request_logs"
  ON request_logs
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_unique_visitors_user_id ON unique_visitors(user_id);
CREATE INDEX IF NOT EXISTS idx_unique_visitors_created_at ON unique_visitors(created_at);
CREATE INDEX IF NOT EXISTS idx_request_logs_user_id ON request_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_request_logs_university ON request_logs(university);
CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs(created_at);