/*
  # Create Product Images Storage and Table

  1. New Tables
    - `merchant_product_images` - Store product image metadata
      - `id` (uuid, primary key)
      - `merchant_id` (uuid, references merchants)
      - `image_url` (text)
      - `label` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on merchant_product_images table
    - Add policies for public access
*/

-- Create the merchant_product_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS merchant_product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  label text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE merchant_product_images ENABLE ROW LEVEL SECURITY;

-- Add policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'merchant_product_images' 
    AND policyname = 'Allow public read access to merchant_product_images'
  ) THEN
    CREATE POLICY "Allow public read access to merchant_product_images"
      ON merchant_product_images
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'merchant_product_images' 
    AND policyname = 'Allow public insert to merchant_product_images'
  ) THEN
    CREATE POLICY "Allow public insert to merchant_product_images"
      ON merchant_product_images
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'merchant_product_images' 
    AND policyname = 'Allow public update to merchant_product_images'
  ) THEN
    CREATE POLICY "Allow public update to merchant_product_images"
      ON merchant_product_images
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'merchant_product_images' 
    AND policyname = 'Allow public delete to merchant_product_images'
  ) THEN
    CREATE POLICY "Allow public delete to merchant_product_images"
      ON merchant_product_images
      FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_merchant_product_images_merchant_id ON merchant_product_images(merchant_id);