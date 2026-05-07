CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email::text FROM auth.users WHERE id = auth.uid();
$$;

DROP POLICY IF EXISTS "Users can claim guest bookings by email" ON public.bookings;

CREATE POLICY "Users can claim guest bookings by email"
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  user_id IS NULL
  AND patient_email = public.current_user_email()
)
WITH CHECK (
  user_id = auth.uid()
);