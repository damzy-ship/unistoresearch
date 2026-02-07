-- Allow authenticated users to claim a coupon (update claimed_by) if it's currently unclaimed (NULL)
-- This assumes the user is claiming it for themselves.
-- However, claimed_by references unique_visitors.id, not auth.users.id directly (usually).
-- We need to check if the user OWNS the unique_visitor record they are trying to assign.

CREATE POLICY "Enable claim for authenticated users" ON coupons
FOR UPDATE USING (
    -- Can update if it's currently unclaimed
    claimed_by IS NULL
) WITH CHECK (
    -- Can only assign to their own unique_visitor ID
    EXISTS (
        SELECT 1 FROM unique_visitors
        WHERE unique_visitors.id = coupons.claimed_by
        AND unique_visitors.auth_user_id = auth.uid()
    )
);
