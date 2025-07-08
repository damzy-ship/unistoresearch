/*
  # Create Site Reviews Table

  1. New Tables
    - `site_reviews` - Store site-wide reviews from users
      - `id` (uuid, primary key)
      - `user_id` (text)
      - `user_name` (text)
      - `rating` (integer, 1-5)
      - `review_text` (text, optional)
      - `is_featured` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for public access
*/

-- Create site_reviews table
CREATE TABLE IF NOT EXISTS site_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  user_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE site_reviews ENABLE ROW LEVEL SECURITY;

-- Add policies (checking if they exist first to avoid errors)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'site_reviews' 
    AND policyname = 'Allow public read access to site_reviews'
  ) THEN
    CREATE POLICY "Allow public read access to site_reviews"
      ON site_reviews
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'site_reviews' 
    AND policyname = 'Allow public insert to site_reviews'
  ) THEN
    CREATE POLICY "Allow public insert to site_reviews"
      ON site_reviews
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'site_reviews' 
    AND policyname = 'Allow public update to site_reviews'
  ) THEN
    CREATE POLICY "Allow public update to site_reviews"
      ON site_reviews
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'site_reviews' 
    AND policyname = 'Allow public delete to site_reviews'
  ) THEN
    CREATE POLICY "Allow public delete to site_reviews"
      ON site_reviews
      FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_site_reviews_user_id ON site_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_site_reviews_rating ON site_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_site_reviews_is_featured ON site_reviews(is_featured);
CREATE INDEX IF NOT EXISTS idx_site_reviews_created_at ON site_reviews(created_at);