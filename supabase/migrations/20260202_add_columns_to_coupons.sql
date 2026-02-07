-- Add school_id and claimed_at columns to coupons table

ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES schools(id),
ADD COLUMN IF NOT EXISTS claimed_at timestamp with time zone;
