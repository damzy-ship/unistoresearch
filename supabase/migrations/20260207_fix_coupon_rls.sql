-- Enable RLS on coupons table (if not already)
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Policy for reading coupons (Anyone can read, or maybe just authenticated. Wait, "useHostelCoupons" needs to read it.)
-- Existing policies might be "Enable read access for all users".
-- But for INSERT/UPDATE/DELETE, we need ADMIN access.

-- Drop existing policies to be safe/clean or just add new ones? 
-- Better to create comprehensive policies.

-- 1. Read access
CREATE POLICY "Enable read access for all users" ON coupons 
FOR SELECT USING (true);

-- 2. Insert/Update/Delete for Admins
-- Using a subquery to check unique_visitors.is_admin
CREATE POLICY "Enable insert for admins" ON coupons 
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM unique_visitors 
        WHERE unique_visitors.auth_user_id = auth.uid() 
        AND unique_visitors.is_admin = true
    )
);

CREATE POLICY "Enable update for admins" ON coupons 
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM unique_visitors 
        WHERE unique_visitors.auth_user_id = auth.uid() 
        AND unique_visitors.is_admin = true
    )
);

CREATE POLICY "Enable delete for admins" ON coupons 
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM unique_visitors 
        WHERE unique_visitors.auth_user_id = auth.uid() 
        AND unique_visitors.is_admin = true
    )
);
