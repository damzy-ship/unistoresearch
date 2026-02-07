-- Add type and product_id columns to coupons table
ALTER TABLE coupons 
ADD COLUMN type text CHECK (type IN ('discount', 'product')) DEFAULT 'discount',
ADD COLUMN product_id uuid REFERENCES hostel_product_updates(id);

-- Optional: Create an index for faster lookups if needed
-- CREATE INDEX idx_coupons_product_id ON coupons(product_id);
