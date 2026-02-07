-- Allow Admins to Insert/Update/Delete ANY record in hostel_product_updates
-- This fixes the issue where admins cannot post on behalf of merchants because the default policy likely restricts 'actual_user_id' to 'auth.uid()'

DROP POLICY IF EXISTS "Admins can manage all hostel product updates" ON public.hostel_product_updates;

CREATE POLICY "Admins can manage all hostel product updates"
ON public.hostel_product_updates
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.unique_visitors
    WHERE auth_user_id = auth.uid()
    AND is_admin = true
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.hostel_product_updates ENABLE ROW LEVEL SECURITY;
