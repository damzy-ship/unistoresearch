-- Add policy to allow users to claim coupons
-- This allows updating 'claimed' from false to true.

create policy "Coupons can be claimed by everyone"
  on coupons for update
  using (claimed = false)
  with check (claimed = true);
