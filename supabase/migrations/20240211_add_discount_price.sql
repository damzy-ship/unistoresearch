-- Add discount_price column to hostel_product_updates table
ALTER TABLE hostel_product_updates 
ADD COLUMN discount_price NUMERIC DEFAULT NULL;

-- Optional: Add a check constraint to ensure discount_price is positive (if desired)
-- ALTER TABLE hostel_product_updates ADD CONSTRAINT check_discount_price_positive CHECK (discount_price >= 0);
