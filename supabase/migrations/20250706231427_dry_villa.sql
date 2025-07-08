/*
  # Create OTP Table for Password Reset

  1. New Tables
    - `otp_codes` - Store OTP codes for password reset
      - `id` (uuid, primary key)
      - `phone_number` (text, unique)
      - `code` (text)
      - `expires_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for public access
*/

-- Create otp_codes table
CREATE TABLE IF NOT EXISTS otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number text UNIQUE NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

-- Add policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'otp_codes' 
    AND policyname = 'Allow public read access to otp_codes'
  ) THEN
    CREATE POLICY "Allow public read access to otp_codes"
      ON otp_codes
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'otp_codes' 
    AND policyname = 'Allow public insert to otp_codes'
  ) THEN
    CREATE POLICY "Allow public insert to otp_codes"
      ON otp_codes
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'otp_codes' 
    AND policyname = 'Allow public update to otp_codes'
  ) THEN
    CREATE POLICY "Allow public update to otp_codes"
      ON otp_codes
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'otp_codes' 
    AND policyname = 'Allow public delete to otp_codes'
  ) THEN
    CREATE POLICY "Allow public delete to otp_codes"
      ON otp_codes
      FOR DELETE
      TO public
      USING (true);
  END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_otp_codes_phone_number ON otp_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at);